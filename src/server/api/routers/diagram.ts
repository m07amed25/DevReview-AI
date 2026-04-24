import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { inngest } from "@/server/inngest";

export const diagramRouter = createTRPCRouter({
  /** List all diagrams for a repository (accessible to the repository's owner). */
  listForRepository: protectedProcedure
    .input(z.object({ repositoryId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId },
        select: { userId: true },
      });
      if (!repository) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }
      if (repository.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.diagram.findMany({
        where: { repositoryId: input.repositoryId },
        orderBy: { createdAt: "asc" },
      });
    }),

  /** Get a single diagram by id (owner-only). */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const diagram = await ctx.db.diagram.findUnique({
        where: { id: input.id },
        include: { repository: { select: { userId: true } } },
      });
      if (!diagram) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Diagram not found",
        });
      }
      if (diagram.repository.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return diagram;
    }),

  /**
   * Request (or re-request) generation of a diagram type for a repository.
   * Creates/resets the Diagram record and dispatches the Inngest job.
   */
  requestDiagram: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().cuid(),
        prNumber: z.number().int().optional(), // optional since we might trigger manually without a PR
        type: z.enum(["ERD", "CLASS", "USE_CASE"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId },
        select: { userId: true },
      });
      if (!repository) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }
      if (repository.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const diagram = await ctx.db.diagram.upsert({
        where: {
          repositoryId_type: { repositoryId: input.repositoryId, type: input.type },
        },
        create: {
          repositoryId: input.repositoryId,
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
          repositoryId: input.repositoryId,
          userId: ctx.user.id,
          prNumber: input.prNumber || 1, // Fallback if needed, though generateDiagram currently requires it to fetch PR files.
          // Note: If we really want full repository diagrams, the inngest function should be refactored to fetch the default branch tree instead of PR files when prNumber is not provided.
          reviewId: "", // Just providing an empty string to satisfy type if needed, though we should update the event type
          type: input.type,
        },
      });

      return diagram;
    }),
});
