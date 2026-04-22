import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { inngest } from "@/server/inngest";

export const diagramRouter = createTRPCRouter({
  /** List all diagrams for a review (accessible to the review's owner). */
  listForReview: protectedProcedure
    .input(z.object({ reviewId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: { id: input.reviewId },
        select: { userId: true },
      });
      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      }
      if (review.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.diagram.findMany({
        where: { reviewId: input.reviewId },
        orderBy: { createdAt: "asc" },
      });
    }),

  /** Get a single diagram by id (owner-only). */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const diagram = await ctx.db.diagram.findUnique({
        where: { id: input.id },
        include: { review: { select: { userId: true } } },
      });
      if (!diagram) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Diagram not found",
        });
      }
      if (diagram.review.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return diagram;
    }),

  /**
   * Request (or re-request) generation of a diagram type for a review.
   * Creates/resets the Diagram record and dispatches the Inngest job.
   */
  requestDiagram: protectedProcedure
    .input(
      z.object({
        reviewId: z.string().cuid(),
        type: z.enum(["ERD", "CLASS", "USE_CASE"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: { id: input.reviewId },
        select: { userId: true, repositoryId: true, prNumber: true },
      });
      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      }
      if (review.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const diagram = await ctx.db.diagram.upsert({
        where: {
          reviewId_type: { reviewId: input.reviewId, type: input.type },
        },
        create: {
          reviewId: input.reviewId,
          type: input.type,
          status: "PENDING",
        },
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
          reviewId: input.reviewId,
          repositoryId: review.repositoryId,
          userId: ctx.user.id,
          prNumber: review.prNumber,
          type: input.type,
        },
      });

      return diagram;
    }),
});
