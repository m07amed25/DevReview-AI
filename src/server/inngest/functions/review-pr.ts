import { inngest } from "../client";
import { db } from "@/server/db";
import { reviewCode } from "@/server/services/ai";
import type { ReviewPreferences, CustomRule } from "@/server/services/ai";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  getGitHubAccessToken,
} from "@/server/services/github";
import { sendReviewCompletedEmailNotification } from "@/server/email/integrations/review";
import { matchTriggerRules } from "@/server/services/diagram-generator";

export type ReviewPREvent = {
  name: "review/pr.requested";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
    preferences?: ReviewPreferences;
  };
};

export const reviewPR = inngest.createFunction(
  {
    id: "review-pr",
    retries: 2,
    onFailure: async ({
      event: {
        data: {
          event: {
            data: { reviewId },
          },
        },
      },
      error,
    }) => {
      if (reviewId) {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error:
              error?.message ??
              "An unexpected error occurred during the review",
          },
        });
      }
    },
  },
  { event: "review/pr.requested" },
  async ({ event, step }) => {
    const { reviewId, repositoryId, prNumber, userId, preferences } =
      event.data;

    await step.run("update-status-processing", async () => {
      await db.review.update({
        where: { id: reviewId },
        data: { status: "PROCESSING" },
      });
    });

    const repository = await step.run("get-repository", async () => {
      return db.repository.findUnique({
        where: { id: repositoryId },
      });
    });

    if (!repository) {
      await step.run("mark-failed-no-repo", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: { status: "FAILED", error: "No repository found" },
        });
      });
      return { success: false, error: "No repository found" };
    }

    const accessToken = await step.run("get-access-token", async () => {
      return getGitHubAccessToken(userId);
    });

    if (!accessToken) {
      await step.run("mark-failed-no-token", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error: "GitHub access token not found",
          },
        });
      });
      return { success: false, error: "GitHub access token not found" };
    }

    const [owner, repo] = repository.fullName.split("/");
    if (!owner || !repo) {
      await step.run("mark-failed-invalid-repo", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error: "Invalid repository name",
          },
        });
      });
      return { success: false, error: "Invalid repository name" };
    }

    const files = await step.run("fetch-pr-files", async () => {
      return fetchPullRequestFiles(accessToken, owner, repo, prNumber);
    });

    const pr = await step.run("fetch-pr", async () => {
      return fetchPullRequest(accessToken, owner, repo, prNumber);
    });
    const commitSha = pr.head.sha;

    try {
      // Fetch active custom rules for this repository
      const activeRules = await step.run("fetch-active-rules", async () => {
        const repo = await db.repository.findUnique({
          where: { id: repositoryId },
          select: { teamId: true, userId: true },
        });

        const teamFilter = repo?.teamId ? [{ teamId: repo.teamId }] : [];

        const allRules = await db.reviewRule.findMany({
          where: {
            enabled: true,
            OR: [
              { repositoryId },
              ...teamFilter,
              { userId: repo?.userId ?? userId, repositoryId: null, teamId: null },
            ],
          },
        });

        // Repository rules override team/global rules with the same name
        const ruleMap = new Map<string, typeof allRules[number]>();
        const sorted = [...allRules].sort((a, b) => {
          const priority = (r: typeof allRules[number]) =>
            r.repositoryId ? 2 : r.teamId ? 1 : 0;
          return priority(a) - priority(b);
        });
        for (const rule of sorted) {
          ruleMap.set(rule.name.toLowerCase(), rule);
        }

        return Array.from(ruleMap.values()) as CustomRule[];
      });

      const reviewResult = await step.run("generate-review", async () => {
        const mergedPreferences: ReviewPreferences = {
          ...preferences,
          customRules: activeRules.length > 0 ? activeRules : undefined,
        };
        return reviewCode(
          pr.title,
          files.map((f) => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            patch: f.patch,
          })),
          mergedPreferences,
        );
      });

      await step.run("save-review-result", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "COMPLETED",
            summary: reviewResult.summary,
            riskScore: reviewResult.riskScore,
            comments: reviewResult.comments,
            qualityMetrics: reviewResult.qualityMetrics ?? undefined,
          },
        });
      });

      // Dispatch diagram generation for matched trigger rules
      await step.run("trigger-diagram-generation", async () => {
        const changedFilePaths = files.map((f) => f.filename);
        const matchedTypes = matchTriggerRules(changedFilePaths);
        if (matchedTypes.length === 0) return;

        for (const diagramType of matchedTypes) {
          const diagram = await db.diagram.upsert({
            where: { repositoryId_type: { repositoryId, type: diagramType } },
            create: { repositoryId, type: diagramType, status: "PENDING" },
            update: {
              status: "PENDING",
              definition: null,
              nodes: undefined,
              edges: undefined,
              error: null,
              generatedAt: null,
            },
          });

          await inngest.send({
            name: "diagram/generation.requested",
            data: {
              diagramId: diagram.id,
              reviewId,
              repositoryId,
              userId,
              prNumber,
              type: diagramType,
            },
          });
        }
      });

      await step.sendEvent("emit-review-completed", {
        name: "review/pr.completed",
        data: {
          reviewId,
          repositoryId,
          prNumber,
          userId,
          commitSha,
          status: "COMPLETED",
          hasHighSeverity: Array.isArray(reviewResult.comments)
            ? reviewResult.comments.some((comment) => {
                const value = comment as
                  | { severity?: string; severityLevel?: string; text?: string }
                  | undefined;
                const severity =
                  `${value?.severity ?? value?.severityLevel ?? ""}`.toUpperCase();
                if (severity === "HIGH" || severity === "CRITICAL") return true;
                return `${value?.text ?? ""}`
                  .toUpperCase()
                  .includes("CRITICAL");
              })
            : false,
        },
      });

      // Send email notification (non-blocking)
      await step.run("send-review-email", async () => {
        await sendReviewCompletedEmailNotification({
          db,
          reviewId,
        });
      });

      return { success: true, reviewId };
    } catch (err) {
      await step.run("mark-failed-error", async () => {
        await db.review.update({
          where: { id: reviewId },
          data: {
            status: "FAILED",
            error:
              err instanceof Error
                ? err.message
                : "An unexpected error occurred during the review",
          },
        });
      });

      await step.sendEvent("emit-review-failed", {
        name: "review/pr.completed",
        data: {
          reviewId,
          repositoryId,
          prNumber,
          userId,
          commitSha,
          status: "FAILED",
          hasHighSeverity: false,
        },
      });

      return { success: false, error: String(err) };
    }
  },
);
