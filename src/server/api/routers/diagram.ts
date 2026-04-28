import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { inngest } from "@/server/inngest";

export const diagramRouter = createTRPCRouter({
  /** List all diagrams for a repository (accessible to the repository's owner). */
  listForRepository: protectedProcedure
    .input(z.object({ repositoryId: z.string().max(255).cuid() }))
    .query(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId },
        select: { userId: true },
      });
      if (!repository) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
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
    .input(z.object({ id: z.string().max(255).max(255).cuid() }))
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
        repositoryId: z.string().max(255).cuid(),
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }
      if (repository.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const diagram = await ctx.db.diagram.upsert({
        where: {
          repositoryId_type: {
            repositoryId: input.repositoryId,
            type: input.type,
          },
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

      try {
        await inngest.send({
          name: "diagram/generation.requested",
          data: {
            diagramId: diagram.id,
            repositoryId: input.repositoryId,
            userId: ctx.user.id,
            prNumber: input.prNumber, // undefined when not provided; generate-diagram fetches the default branch tree instead
            reviewId: "",
            type: input.type,
          },
        });
      } catch (err) {
        console.error("Failed to dispatch diagram generation event:", err);
        await ctx.db.diagram.update({
          where: { id: diagram.id },
          data: {
            status: "FAILED",
            error:
              "Failed to queue diagram generation job. Please check Inngest configuration.",
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to queue diagram generation. Ensure INNGEST_EVENT_KEY is configured.",
        });
      }

      return diagram;
    }),
});
