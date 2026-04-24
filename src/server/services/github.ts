import { db } from "@/server/db";

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
  const userRepos = await fetchAllPages<GitHubRepo>(
    "https://api.github.com/user/repos?sort=updated&affiliation=owner,collaborator,organization_member",
    accessToken,
  );

  const orgs = await fetchAllPages<GitHubOrg>(
    "https://api.github.com/user/orgs",
    accessToken,
  );

  const orgRepoArrays = await Promise.all(
    orgs.map((org) =>
      fetchAllPages<GitHubRepo>(
        `https://api.github.com/orgs/${org.login}/repos?sort=updated`,
        accessToken,
      ),
    ),
  );

  const repoMap = new Map<number, GitHubRepo>();
  for (const repo of userRepos) {
    repoMap.set(repo.id, repo);
  }
  for (const orgRepos of orgRepoArrays) {
    for (const repo of orgRepos) {
      repoMap.set(repo.id, repo);
    }
  }

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

export async function fetchPullRequestByFullName(
  accessToken: string,
  repoFullName: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository full name: ${repoFullName}`);
  }

  return fetchPullRequest(accessToken, owner, repo, prNumber);
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

export interface GitHubTreeFile {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export async function fetchRepositoryFiles(
  accessToken: string,
  owner: string,
  repo: string,
  branch?: string,
): Promise<GitHubTreeFile[]> {
  const branchName = branch ?? (await fetchDefaultBranch(accessToken, owner, repo));
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branchName}?recursive=1`,
    accessToken,
  );
  
  const data = (await response.json()) as { tree: GitHubTreeFile[], truncated: boolean };
  return data.tree.filter((t) => t.type === "blob");
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  committer: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
  parents: {
    sha: string;
    url: string;
  }[];
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export async function fetchCommits(
  accessToken: string,
  owner: string,
  repo: string,
  options: {
    perPage?: number;
    page?: number;
    sha?: string; // Branch or ref to list commits from
  } = {},
): Promise<GitHubCommit[]> {
  const { perPage = 30, page = 1, sha } = options;

  let url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`;
  if (sha) {
    url += `&sha=${encodeURIComponent(sha)}`;
  }

  const response = await githubFetch(url, accessToken);
  return (await response.json()) as GitHubCommit[];
}

export async function fetchCommit(
  accessToken: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<GitHubCommit> {
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
    accessToken,
  );
  return (await response.json()) as GitHubCommit;
}

export async function fetchBranches(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<GitHubBranch[]> {
  return fetchAllPages<GitHubBranch>(
    `https://api.github.com/repos/${owner}/${repo}/branches`,
    accessToken,
  );
}

export async function fetchDefaultBranch(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<string> {
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    accessToken,
  );
  const data = (await response.json()) as { default_branch: string };
  return data.default_branch;
}

export async function registerWebhook(
  accessToken: string,
  repoFullName: string,
  webhookUrl: string,
  secret: string,
): Promise<number> {
  const [owner, repo] = repoFullName.split("/");
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "web",
        active: true,
        events: ["pull_request"],
        config: {
          url: webhookUrl,
          content_type: "json",
          secret,
          insecure_ssl: "0",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error ${response.status} registering webhook for ${repoFullName}`,
    );
  }

  const data = (await response.json()) as { id: number };
  return data.id;
}

export async function deleteWebhook(
  accessToken: string,
  repoFullName: string,
  webhookId: number,
): Promise<void> {
  const [owner, repo] = repoFullName.split("/");
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `GitHub API error ${response.status} deleting webhook ${webhookId} for ${repoFullName}`,
    );
  }
}

export async function postCommitStatus(
  accessToken: string,
  repoFullName: string,
  commitSha: string,
  state: "pending" | "success" | "failure" | "error",
  reviewId: string,
  description: string,
): Promise<void> {
  const [owner, repo] = repoFullName.split("/");
  const appBaseUrl = process.env.APP_BASE_URL ?? process.env.BETTER_AUTH_URL;
  if (!appBaseUrl) {
    throw new Error(
      "APP_BASE_URL (or BETTER_AUTH_URL) is required to post commit statuses",
    );
  }
  const targetUrl = `${appBaseUrl}/reviews/${reviewId}`;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/statuses/${commitSha}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state,
        target_url: targetUrl,
        description,
        context: "devreview-ai/code-review",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error ${response.status} posting commit status for ${repoFullName}@${commitSha}`,
    );
  }
}

export type ReviewComment = {
  path: string;
  line: number;
  body: string;
};

export async function submitPullRequestReview(
  accessToken: string,
  repoFullName: string,
  pullNumber: number,
  commitSha: string,
  body: string,
  comments: ReviewComment[],
): Promise<number> {
  const [owner, repo] = repoFullName.split("/");
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commit_id: commitSha,
        body,
        event: "COMMENT",
        comments: comments.map((c) => ({
          path: c.path,
          line: c.line,
          body: c.body,
        })),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error ${response.status} submitting PR review for ${repoFullName}#${pullNumber}`,
    );
  }

  const data = (await response.json()) as { id: number };
  return data.id;
}

export async function dismissGitHubReview(
  accessToken: string,
  repoFullName: string,
  pullNumber: number,
  reviewId: number,
  message: string,
): Promise<void> {
  const [owner, repo] = repoFullName.split("/");
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews/${reviewId}/dismissals`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        event: "DISMISS",
      }),
    },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `GitHub API error ${response.status} dismissing PR review ${reviewId} for ${repoFullName}#${pullNumber}`,
    );
  }
}

export type OpenPullRequest = {
  number: number;
  title: string;
  html_url: string;
  head: { sha: string };
};

export async function listOpenPullRequests(
  accessToken: string,
  repoFullName: string,
): Promise<OpenPullRequest[]> {
  const [owner, repo] = repoFullName.split("/");
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=100`,
    accessToken,
  );

  const pulls = (await response.json()) as (OpenPullRequest & {
    draft: boolean;
  })[];
  return pulls.filter((pr) => !pr.draft);
}
