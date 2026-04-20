import { db } from "@/server/db";
import { inngest } from "../client";
import {
  dismissGitHubReview,
  getGitHubAccessToken,
  postCommitStatus,
  submitPullRequestReview,
  type ReviewComment,
} from "@/server/services/github";
import { generateRepositoryRecommendations } from "@/server/api/routers/automation";

type ReviewCompletedEvent = {
  name: "review/pr.completed";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
    commitSha: string;
    status: "COMPLETED" | "FAILED";
    hasHighSeverity: boolean;
  };
};

type StoredFinding = {
  filePath?: string;
  filename?: string;
  path?: string;
  line?: number;
  message?: string;
  text?: string;
  severity?: string;
  severityLevel?: string;
};

export function mapFindingsToReviewPayload(
  findings: unknown,
  repositoryId: string,
  reviewId: string,
): { body: string; inlineComments: ReviewComment[] } {
  const values = Array.isArray(findings) ? (findings as StoredFinding[]) : [];

  const inlineComments: ReviewComment[] = [];
  const summaryOnlyFindings: string[] = [];

  const appBaseUrl = process.env.APP_BASE_URL ?? process.env.BETTER_AUTH_URL ?? "";
  const reviewUrl = `${appBaseUrl}/repo/${repositoryId}/reviews/${reviewId}`;

  for (const finding of values) {
    const severity = (finding.severity ?? finding.severityLevel ?? "MEDIUM").toUpperCase();
    const text = finding.message ?? finding.text ?? "Issue detected";
    const body = `**[${severity}]** ${text}\n\n[View full review](${reviewUrl})`;

    const path = finding.filePath ?? finding.filename ?? finding.path;
    if (path && typeof finding.line === "number" && finding.line > 0) {
      inlineComments.push({ path, line: finding.line, body });
    } else {
      summaryOnlyFindings.push(`- **[${severity}]** ${text}`);
    }
  }

  const summary = [
    "## DevReview AI Summary",
    summaryOnlyFindings.length > 0
      ? ["", "### General Findings", ...summaryOnlyFindings].join("\n")
      : "\nNo general findings outside inline comments.",
  ].join("\n");

  return { body: summary, inlineComments };
}

type PostReviewStep = {
  run: <T>(id: string, fn: () => Promise<T>) => Promise<unknown>;
};

type PostReviewDeps = {
  dbClient: typeof db;
  getGitHubAccessTokenFn: typeof getGitHubAccessToken;
  dismissGitHubReviewFn: typeof dismissGitHubReview;
  submitPullRequestReviewFn: typeof submitPullRequestReview;
  postCommitStatusFn: typeof postCommitStatus;
  generateRepositoryRecommendationsFn: typeof generateRepositoryRecommendations;
};

const defaultDeps: PostReviewDeps = {
  dbClient: db,
  getGitHubAccessTokenFn: getGitHubAccessToken,
  dismissGitHubReviewFn: dismissGitHubReview,
  submitPullRequestReviewFn: submitPullRequestReview,
  postCommitStatusFn: postCommitStatus,
  generateRepositoryRecommendationsFn: generateRepositoryRecommendations,
};

export async function runPostReviewToGitHub(
  completedEvent: ReviewCompletedEvent,
  step: PostReviewStep,
  deps: PostReviewDeps = defaultDeps,
) {
  const {
    dbClient,
    getGitHubAccessTokenFn,
    dismissGitHubReviewFn,
    submitPullRequestReviewFn,
    postCommitStatusFn,
    generateRepositoryRecommendationsFn,
  } = deps;

  const reviewData = (await step.run("get-review", async () => {
    const review = await dbClient.review.findUnique({
      where: { id: completedEvent.data.reviewId },
      include: {
        repository: true,
        user: true,
      },
    });

    if (!review) return null;

    const accessToken = await getGitHubAccessTokenFn(review.repository.userId);
    return { review, accessToken };
  })) as {
    review: {
      id: string;
      repositoryId: string;
      prNumber: number;
      comments: unknown;
      repository: { fullName: string; userId: string };
      user: { id: string };
    };
    accessToken: string | null;
  } | null;

  if (!reviewData || !reviewData.accessToken) {
    return { success: false, reason: "Missing review or token" };
  }

  const { review, accessToken } = reviewData;

  await step.run("dismiss-previous-review", async () => {
    const previous = await dbClient.gitHubComment.findFirst({
      where: {
        repositoryId: review.repositoryId,
        prNumber: review.prNumber,
        reviewId: { not: review.id },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!previous) return;

    await dismissGitHubReviewFn(
      accessToken,
      review.repository.fullName,
      review.prNumber,
      previous.githubReviewId,
      `Superseded by a new DevReview AI review after commit ${completedEvent.data.commitSha}`,
    );
  });

  await step.run("post-pr-review", async () => {
    const payload = mapFindingsToReviewPayload(
      review.comments,
      review.repositoryId,
      review.id,
    );

    const githubReviewId = await submitPullRequestReviewFn(
      accessToken,
      review.repository.fullName,
      completedEvent.data.prNumber,
      completedEvent.data.commitSha,
      payload.body,
      payload.inlineComments,
    );

    await dbClient.gitHubComment.upsert({
      where: { reviewId: review.id },
      create: {
        reviewId: review.id,
        githubReviewId,
        prNumber: completedEvent.data.prNumber,
        repositoryId: review.repositoryId,
        commitSha: completedEvent.data.commitSha,
        findingCount: payload.inlineComments.length,
      },
      update: {
        githubReviewId,
        commitSha: completedEvent.data.commitSha,
        findingCount: payload.inlineComments.length,
      },
    });
  });

  await step.run("update-status-check", async () => {
    const state: "success" | "failure" | "error" =
      completedEvent.data.status === "FAILED"
        ? "error"
        : completedEvent.data.hasHighSeverity
          ? "failure"
          : "success";

    const description =
      state === "success"
        ? "DevReview AI — no critical issues"
        : state === "failure"
          ? "DevReview AI — critical issues found"
          : "DevReview AI — review processing failed";

    await postCommitStatusFn(
      accessToken,
      review.repository.fullName,
      completedEvent.data.commitSha,
      state,
      review.id,
      description,
    );

    await dbClient.gitHubStatusCheck.upsert({
      where: { reviewId: review.id },
      create: {
        reviewId: review.id,
        commitSha: completedEvent.data.commitSha,
        state:
          state === "success"
            ? "SUCCESS"
            : state === "failure"
              ? "FAILURE"
              : "ERROR",
      },
      update: {
        commitSha: completedEvent.data.commitSha,
        state:
          state === "success"
            ? "SUCCESS"
            : state === "failure"
              ? "FAILURE"
              : "ERROR",
      },
    });
  });

  await step.run("generate-recommendations", async () => {
    const completedCount = await dbClient.review.count({
      where: { repositoryId: review.repositoryId, status: "COMPLETED" },
    });

    if (completedCount < 3) return;

    await generateRepositoryRecommendationsFn(dbClient, review.repositoryId);
  });

  return { success: true };
}

export const postReviewToGitHub = inngest.createFunction(
  { id: "post-review-to-github", retries: 3 },
  { event: "review/pr.completed" },
  async ({ event, step }) =>
    runPostReviewToGitHub(event as ReviewCompletedEvent, step, defaultDeps),
);









