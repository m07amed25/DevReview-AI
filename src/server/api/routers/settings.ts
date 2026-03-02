import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const settingsRouter = createTRPCRouter({
  /**
   * Get all active sessions for the current user
   */
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db.session.findMany({
      where: {
        userId: ctx.user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
      },
    });

    // The current session token is in the cookie — we can mark it
    // by comparing session IDs (ctx.session.id is the current session)
    // better-auth: ctx.session = { session: { id, ... }, user: { ... } }
    const currentSessionId = ctx.session.session.id;

    return sessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }));
  }),

  /**
   * Revoke a specific session (sign out from that device)
   */
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Don't allow revoking the current session via this endpoint
      if (input.sessionId === ctx.session.session.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use the sign-out button to end your current session.",
        });
      }

      const session = await ctx.db.session.findFirst({
        where: {
          id: input.sessionId,
          userId: ctx.user.id,
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found.",
        });
      }

      await ctx.db.session.delete({
        where: { id: input.sessionId },
      });

      return { success: true };
    }),

  /**
   * Revoke all other sessions (sign out everywhere else)
   */
  revokeAllOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.db.session.deleteMany({
      where: {
        userId: ctx.user.id,
        id: { not: ctx.session.session.id },
      },
    });

    return { revoked: result.count };
  }),

  /**
   * Delete the user account and all associated data
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        confirmation: z
          .string()
          .refine((val) => val === "DELETE", {
            message: 'Please type "DELETE" to confirm.',
          }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.confirmation !== "DELETE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: 'Please type "DELETE" to confirm account deletion.',
        });
      }

      // Delete user — cascades to sessions, accounts, repositories, reviews
      await ctx.db.user.delete({
        where: { id: ctx.user.id },
      });

      return { success: true };
    }),
});
