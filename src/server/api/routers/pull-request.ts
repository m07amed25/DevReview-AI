import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getAccessibleRepository } from "@/lib/repository";
import {
  fetchPullRequests,
  fetchPullRequest,
  getGitHubAccessToken,
  fetchPullRequestFiles,
} from "@/server/services/github";

export const pullRequestRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
        state: z.enum(["open", "closed", "all"]).default("open"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repository = await getAccessibleRepository(
        ctx.db,
        ctx.user.id,
        input.repositoryId,
      );

      const accessToken = await getGitHubAccessToken(repository.userId);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Github account not connected",
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const prs = await fetchPullRequests(
        accessToken,
        owner,
        repo,
        input.state,
      );

      const existingReviews = await ctx.db.review.findMany({
        where: {
          repositoryId: repository.id,
          prNumber: { in: prs.map((pr) => pr.number) },
        },
        select: {
          prNumber: true,
          status: true,
          summary: true,
          riskScore: true,
          comments: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const reviewMap = new Map(
        existingReviews.map((r) => {
          // Compute severity counts from comments JSON
          const comments = Array.isArray(r.comments)
            ? (r.comments as Array<{ severity?: string; category?: string }>)
            : [];
          const severityCounts = {
            critical: comments.filter((c) => c.severity === "critical").length,
            high: comments.filter((c) => c.severity === "high").length,
            medium: comments.filter((c) => c.severity === "medium").length,
            low: comments.filter((c) => c.severity === "low").length,
          };
          const categories = Array.from(
            new Set(
              comments
                .map((c: { category?: string }) => c.category)
                .filter((cat): cat is string => typeof cat === "string"),
            ),
          );
          return [
            r.prNumber,
            {
              prNumber: r.prNumber,
              status: r.status,
              summary: r.summary,
              riskScore: r.riskScore,
              severityCounts,
              categories,
              createdAt: r.createdAt,
            },
          ];
        }),
      );

      return prs.map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        draft: pr.draft,
        htmlUrl: pr.html_url,
        author: {
          login: pr.user.login,
          avatarUrl: pr.user.avatar_url,
        },
        headRef: pr.head.ref,
        baseRef: pr.base.ref,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt: pr.merged_at,
        review: reviewMap.get(pr.number) ?? null,
      }));
    }),

  get: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repository = await getAccessibleRepository(
        ctx.db,
        ctx.user.id,
        input.repositoryId,
      );

      const accessToken = await getGitHubAccessToken(repository.userId);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub account not connected",
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const pr = await fetchPullRequest(
        accessToken,
        owner,
        repo,
        input.prNumber,
      );

      const existingReview = await ctx.db.review.findFirst({
        where: {
          repositoryId: repository.id,
          prNumber: pr.number,
        },
        orderBy: { createdAt: "desc" },
      });

      let isAdmin = false;
      if (repository.userId === ctx.user.id) {
        isAdmin = true;
      } else if (repository.teamId) {
        const membership = await ctx.db.teamMember.findUnique({
          where: {
            teamId_userId: { teamId: repository.teamId, userId: ctx.user.id },
          },
        });
        if (
          membership &&
          (membership.role === "ADMIN" || membership.role === "OWNER")
        ) {
          isAdmin = true;
        }
      }

      return {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        draft: pr.draft,
        htmlUrl: pr.html_url,
        author: {
          login: pr.user.login,
          avatarUrl: pr.user.avatar_url,
        },
        headRef: pr.head.ref,
        headSha: pr.head.sha,
        baseRef: pr.base.ref,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt: pr.merged_at,
        review: existingReview,
        isAdmin,
      };
    }),

  files: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().max(255),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repository = await getAccessibleRepository(
        ctx.db,
        ctx.user.id,
        input.repositoryId,
      );

      const accessToken = await getGitHubAccessToken(repository.userId);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub account not connected",
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const files = await fetchPullRequestFiles(
        accessToken,
        owner,
        repo,
        input.prNumber,
      );

      return files.map((file) => ({
        sha: file.sha,
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        previousFilename: file.previous_filename,
      }));
    }),
});
