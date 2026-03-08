import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getAccessibleRepository } from "@/lib/repository";
import { inngest } from "@/server/inngest";
import {
  fetchPullRequest,
  getGitHubAccessToken,
} from "@/server/services/github";

export const reviewRouter = createTRPCRouter({
  trigger: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = await getAccessibleRepository(
        ctx.db,
        ctx.user.id,
        input.repositoryId,
      );

      // Use the repo owner's token for GitHub API calls
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

      // Read user preferences for the AI review
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          reviewDepth: true,
          defaultLanguage: true,
          includeSecurityChecks: true,
          includePerfSuggestions: true,
        },
      });

      const review = await ctx.db.review.create({
        data: {
          repositoryId: repository.id,
          userId: ctx.user.id,
          prNumber: pr.number,
          prTitle: pr.title,
          prUrl: pr.html_url,
          status: "PENDING",
        },
      });

      try {
        await inngest.send({
          name: "review/pr.requested",
          data: {
            reviewId: review.id,
            repositoryId: repository.id,
            prNumber: pr.number,
            userId: ctx.user.id,
            preferences: user
              ? {
                  reviewDepth: user.reviewDepth,
                  defaultLanguage: user.defaultLanguage,
                  includeSecurityChecks: user.includeSecurityChecks,
                  includePerfSuggestions: user.includePerfSuggestions,
                }
              : undefined,
          },
        });
      } catch (err) {
        console.error("Failed to send Inngest event:", err);
        await ctx.db.review.update({
          where: { id: review.id },
          data: {
            status: "FAILED",
            error:
              "Failed to queue review job. Please check Inngest configuration.",
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to queue review. Ensure INNGEST_EVENT_KEY is configured.",
        });
      }

      return { reviewId: review.id };
    }),
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Try direct ownership first, then team access
      let review = await ctx.db.review.findUnique({
        where: { id: input.id, userId: ctx.user.id },
        include: { repository: true },
      });

      if (!review) {
        // Check if user has team access to this review's repository
        review = await ctx.db.review.findFirst({
          where: {
            id: input.id,
            repository: {
              team: { members: { some: { userId: ctx.user.id } } },
            },
          },
          include: { repository: true },
        });
      }

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      return review;
    }),
  list: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get IDs of team-shared repositories the user can access
      const teamRepoIds = await ctx.db.repository.findMany({
        where: {
          team: { members: { some: { userId: ctx.user.id } } },
        },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r: { id: string }) => r.id);

      return ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepoIdSet } },
          ],
          ...(input.repositoryId && { repositoryId: input.repositoryId }),
        },
        include: {
          repository: true,
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),
  getLatestForPR: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.review.findFirst({
        where: {
          repositoryId: input.repositoryId,
          prNumber: input.prNumber,
          OR: [
            { userId: ctx.user.id },
            {
              repository: {
                team: { members: { some: { userId: ctx.user.id } } },
              },
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    }),
});
