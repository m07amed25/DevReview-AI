import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getPusherServer, reviewChannel, PUSHER_EVENTS } from "@/server/pusher";

export const collaborationRouter = createTRPCRouter({
  // ─── Get all threads for a review ────────────────────────────────
  getThreads: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify the user owns this review
      const review = await ctx.db.review.findUnique({
        where: { id: input.reviewId, userId: ctx.user.id },
        select: { id: true },
      });
      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      }

      return ctx.db.reviewThread.findMany({
        where: { reviewId: input.reviewId },
        include: {
          comments: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ─── Create a new thread on a file/line ──────────────────────────
  createThread: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        file: z.string(),
        line: z.number(),
        content: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: { id: input.reviewId, userId: ctx.user.id },
        select: { id: true },
      });
      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      }

      const thread = await ctx.db.reviewThread.create({
        data: {
          reviewId: input.reviewId,
          file: input.file,
          line: input.line,
          comments: {
            create: {
              userId: ctx.user.id,
              content: input.content,
            },
          },
        },
        include: {
          comments: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      });

      // Broadcast via Pusher
      const pusher = getPusherServer();
      if (pusher) {
        await pusher.trigger(
          reviewChannel(input.reviewId),
          PUSHER_EVENTS.THREAD_CREATED,
          thread,
        );
      }

      return thread;
    }),

  // ─── Add a reply to an existing thread ───────────────────────────
  addComment: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        content: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const thread = await ctx.db.reviewThread.findUnique({
        where: { id: input.threadId },
        include: { review: { select: { id: true, userId: true } } },
      });
      if (!thread || thread.review.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found" });
      }

      const comment = await ctx.db.reviewThreadComment.create({
        data: {
          threadId: input.threadId,
          userId: ctx.user.id,
          content: input.content,
        },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      // Broadcast
      const pusher = getPusherServer();
      if (pusher) {
        await pusher.trigger(
          reviewChannel(thread.review.id),
          PUSHER_EVENTS.COMMENT_ADDED,
          { threadId: input.threadId, comment },
        );
      }

      return comment;
    }),

  // ─── Resolve / reopen a thread ───────────────────────────────────
  toggleResolve: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const thread = await ctx.db.reviewThread.findUnique({
        where: { id: input.threadId },
        include: { review: { select: { id: true, userId: true } } },
      });
      if (!thread || thread.review.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found" });
      }

      const updated = await ctx.db.reviewThread.update({
        where: { id: input.threadId },
        data: { resolved: !thread.resolved },
      });

      // Broadcast
      const pusher = getPusherServer();
      if (pusher) {
        await pusher.trigger(
          reviewChannel(thread.review.id),
          updated.resolved
            ? PUSHER_EVENTS.THREAD_RESOLVED
            : PUSHER_EVENTS.THREAD_REOPENED,
          { threadId: input.threadId, resolved: updated.resolved },
        );
      }

      return updated;
    }),

  // ─── Delete a comment ────────────────────────────────────────────
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.reviewThreadComment.findUnique({
        where: { id: input.commentId },
        include: {
          thread: {
            include: { review: { select: { id: true, userId: true } } },
          },
        },
      });
      if (!comment || comment.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      await ctx.db.reviewThreadComment.delete({
        where: { id: input.commentId },
      });

      // If this was the only comment in the thread, delete the thread too
      const remaining = await ctx.db.reviewThreadComment.count({
        where: { threadId: comment.threadId },
      });
      if (remaining === 0) {
        await ctx.db.reviewThread.delete({
          where: { id: comment.threadId },
        });
      }

      // Broadcast
      const pusher = getPusherServer();
      if (pusher) {
        await pusher.trigger(
          reviewChannel(comment.thread.review.id),
          PUSHER_EVENTS.COMMENT_DELETED,
          {
            threadId: comment.threadId,
            commentId: input.commentId,
            threadDeleted: remaining === 0,
          },
        );
      }

      return { deleted: true };
    }),
});
