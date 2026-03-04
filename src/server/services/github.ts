import { db } from "@/server/db";

/** Custom error for GitHub API failures with rate-limit and status info */
export class GitHubAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    public readonly rateLimitRemaining?: number,
    public readonly rateLimitReset?: Date,
  ) {
    super(`GitHub API error: ${status} for ${url}`);
    this.name = "GitHubAPIError";
  }
}

/**
 * Shared fetch wrapper that includes auth headers and checks for errors.
 * Throws GitHubAPIError with rate-limit metadata on failure.
 */
async function githubFetch(
  url: string,
  accessToken: string,
): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const resetEpoch = response.headers.get("x-ratelimit-reset");
    throw new GitHubAPIError(
      response.status,
      url,
      remaining ? parseInt(remaining, 10) : undefined,
      resetEpoch ? new Date(parseInt(resetEpoch, 10) * 1000) : undefined,
    );
  }

  return response;
}

export interface GitHubPullRequestFile {
  sha: string;
  filename: string;
  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft: boolean;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export async function getGitHubAccessToken(
  userId: string,
): Promise<string | null> {
  const account = await db.account.findFirst({
    where: {
      userId,
      providerId: "github",
    },
    select: {
      accessToken: true,
    },
  });

  return account?.accessToken ?? null;
}

interface GitHubOrg {
  login: string;
}

async function fetchAllPages<T>(
  url: string,
  accessToken: string,
  perPage = 100,
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (true) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await githubFetch(
      `${url}${separator}per_page=${perPage}&page=${page}`,
      accessToken,
    );

    const data = (await response.json()) as T[];
    results.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return results;
}

export async function fetchGitHubRepos(
  accessToken: string,
): Promise<GitHubRepo[]> {
  // Fetch user repos (owned, collaborator, and org-member repos)
  const userRepos = await fetchAllPages<GitHubRepo>(
    "https://api.github.com/user/repos?sort=updated&affiliation=owner,collaborator,organization_member",
    accessToken,
  );

  // Fetch all orgs the user belongs to
  const orgs = await fetchAllPages<GitHubOrg>(
    "https://api.github.com/user/orgs",
    accessToken,
  );

  // Fetch repos from each org (includes repos visible to the user in that org)
  const orgRepoArrays = await Promise.all(
    orgs.map((org) =>
      fetchAllPages<GitHubRepo>(
        `https://api.github.com/orgs/${org.login}/repos?sort=updated`,
        accessToken,
      ),
    ),
  );

  // Deduplicate by repo ID
  const repoMap = new Map<number, GitHubRepo>();
  for (const repo of userRepos) {
    repoMap.set(repo.id, repo);
  }
  for (const orgRepos of orgRepoArrays) {
    for (const repo of orgRepos) {
      repoMap.set(repo.id, repo);
    }
  }

  // Return sorted by updated_at descending
  return Array.from(repoMap.values()).sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export async function fetchPullRequests(
  accessToken: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open",
): Promise<GitHubPullRequest[]> {
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=30&sort=updated&direction=desc`,
    accessToken,
  );

  const pulls = (await response.json()) as GitHubPullRequest[];

  // The list endpoint doesn't include additions/deletions/changed_files,
  // so we fetch each PR individually to get those stats.
  // Batch in groups of 5 to avoid hitting GitHub rate limits.
  const batchSize = 5;
  const results: GitHubPullRequest[] = [];

  for (let i = 0; i < pulls.length; i += batchSize) {
    const batch = pulls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((pr) => fetchPullRequest(accessToken, owner, repo, pr.number)),
    );
    results.push(...batchResults);
  }

  return results;
}

export async function fetchPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    accessToken,
  );

  return (await response.json()) as GitHubPullRequest;
}

export async function fetchPullRequestFiles(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequestFile[]> {
  const files: GitHubPullRequestFile[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await githubFetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=${perPage}&page=${page}`,
      accessToken,
    );

    const data = (await response.json()) as GitHubPullRequestFile[];
    files.push(...data);

    if (data.length < perPage) break;
    page++;
  }

  return files;
}
