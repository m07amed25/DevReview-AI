import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getAccessibleRepository } from "@/lib/repository";
import { inngest } from "@/server/inngest";
import {
  fetchPullRequestByFullName,
  getGitHubAccessToken,
} from "@/server/services/github";

export const reviewRouter = createTRPCRouter({
  trigger: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
        parentReviewId: z.string().optional(),
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

      const pr = await fetchPullRequestByFullName(
        accessToken,
        repository.fullName,
        input.prNumber,
      );

      // Read user preferences for the AI review
      const user = await ctx.db.user.findUnique({
        where: { id: repository.userId },
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
          userId: repository.userId,
          prNumber: pr.number,
          prTitle: pr.title,
          prUrl: pr.html_url,
          status: "PENDING",
          parentReviewId: input.parentReviewId ?? null,
        },
      });

      try {
        await inngest.send({
          name: "review/pr.requested",
          data: {
            reviewId: review.id,
            repositoryId: repository.id,
            prNumber: pr.number,
            userId: repository.userId,
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
      }) as Promise<
        | (Awaited<ReturnType<typeof ctx.db.review.findFirst>> & {
            resolvedComments: string[];
          })
        | null
      >;
    }),

  toggleResolvedComment: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        commentKey: z.string(),
        resolved: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify access
      const review = await ctx.db.review.findFirst({
        where: {
          id: input.reviewId,
          OR: [
            { userId: ctx.user.id },
            {
              repository: {
                team: { members: { some: { userId: ctx.user.id } } },
              },
            },
          ],
        },
        select: { id: true },
      });

      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      }

      if (input.resolved) {
        // Remove then re-append to avoid duplicates (idempotent)
        await ctx.db.$executeRaw`
          UPDATE "Review"
          SET "resolvedComments" = array_append(array_remove("resolvedComments", ${input.commentKey}), ${input.commentKey})
          WHERE id = ${input.reviewId}
        `;
      } else {
        await ctx.db.$executeRaw`
          UPDATE "Review"
          SET "resolvedComments" = array_remove("resolvedComments", ${input.commentKey})
          WHERE id = ${input.reviewId}
        `;
      }

      return { success: true };
    }),

  submitFeedback: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        rating: z.union([z.literal(1), z.literal(-1)]),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const feedback = await ctx.db.reviewFeedback.upsert({
        where: {
          reviewId_userId: {
            reviewId: input.reviewId,
            userId: ctx.user.id,
          },
        },
        update: {
          rating: input.rating,
          comment: input.comment,
        },
        create: {
          reviewId: input.reviewId,
          userId: ctx.user.id,
          rating: input.rating,
          comment: input.comment,
        },
      });

      return feedback;
    }),

  getFeedbackStats: protectedProcedure
    .input(z.object({ repositoryId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const teamRepoIds = await ctx.db.repository.findMany({
        where: { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const repoIds = teamRepoIds.map((r: { id: string }) => r.id);

      const feedbacks = await ctx.db.reviewFeedback.findMany({
        where: {
          review: {
            OR: [{ userId: ctx.user.id }, { repositoryId: { in: repoIds } }],
            ...(input.repositoryId && { repositoryId: input.repositoryId }),
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const trend = feedbacks.reduce(
        (acc, fb) => {
          const date = fb.createdAt.toISOString().split("T")[0];
          const current = acc[date] ?? { date, up: 0, down: 0 };

          if (fb.rating === 1) {
            current.up += 1;
          } else if (fb.rating === -1) {
            current.down += 1;
          }

          acc[date] = current;
          return acc;
        },
        {} as Record<string, { date: string; up: number; down: number }>,
      );

      return Object.values(trend) as {
        date: string;
        up: number;
        down: number;
      }[];
    }),

  listHistoryForPR: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.review.findMany({
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
        select: {
          id: true,
          status: true,
          riskScore: true,
          parentReviewId: true,
          createdAt: true,
          comments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getDiff: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        compareReviewId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [current, previous] = await Promise.all([
        ctx.db.review.findFirst({
          where: {
            id: input.reviewId,
            OR: [
              { userId: ctx.user.id },
              {
                repository: {
                  team: { members: { some: { userId: ctx.user.id } } },
                },
              },
            ],
          },
          select: {
            id: true,
            comments: true,
            riskScore: true,
            createdAt: true,
          },
        }),
        ctx.db.review.findFirst({
          where: {
            id: input.compareReviewId,
            OR: [
              { userId: ctx.user.id },
              {
                repository: {
                  team: { members: { some: { userId: ctx.user.id } } },
                },
              },
            ],
          },
          select: {
            id: true,
            comments: true,
            riskScore: true,
            createdAt: true,
          },
        }),
      ]);

      if (!current || !previous) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or both reviews not found",
        });
      }

      type Finding = {
        file: string;
        line: number;
        severity: string;
        category?: string;
        message: string;
        suggestion?: string;
        confidence?: number;
      };

      const currentFindings = (
        Array.isArray(current.comments) ? current.comments : []
      ) as Finding[];
      const previousFindings = (
        Array.isArray(previous.comments) ? previous.comments : []
      ) as Finding[];

      const matchedCurrent = new Set<Finding>();
      const matchedPrevious = new Set<Finding>();

      const fixed: Finding[] = [];
      const persisted: Finding[] = [];
      const newFindings: Finding[] = [];

      for (const prev of previousFindings) {
        // Find a matching finding in the current review
        // Must be same file, same severity, and line number within 3 lines (to account for minor shifts or AI variance)
        const match = currentFindings.find(
          (curr) =>
            !matchedCurrent.has(curr) &&
            curr.file === prev.file &&
            curr.severity === prev.severity &&
            Math.abs(curr.line - prev.line) <= 3,
        );

        if (match) {
          persisted.push(match); // Show the new wording/line number
          matchedCurrent.add(match);
          matchedPrevious.add(prev);
        } else {
          fixed.push(prev);
        }
      }

      for (const curr of currentFindings) {
        if (!matchedCurrent.has(curr)) {
          newFindings.push(curr);
        }
      }

      return {
        currentReviewId: current.id,
        previousReviewId: previous.id,
        currentRiskScore: current.riskScore,
        previousRiskScore: previous.riskScore,
        currentDate: current.createdAt,
        previousDate: previous.createdAt,
        fixed,
        persisted,
        new: newFindings,
        summary: {
          fixedCount: fixed.length,
          persistedCount: persisted.length,
          newCount: newFindings.length,
          previousTotal: previousFindings.length,
          currentTotal: currentFindings.length,
        },
      };
    }),
});
