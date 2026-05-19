import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import { inngest } from "../../../inngest/client";

export const adminNewsletterRouter = createTRPCRouter({
  send: adminProcedure
    .input(
      z.object({
        subject: z.string().min(1).max(200),
        body: z.string().min(1).max(50000),
        target: z.enum(["ALL", "FREE", "PRO"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userCount = await ctx.db.user.count({
        where:
          input.target === "FREE"
            ? { planId: "free" }
            : input.target === "PRO"
              ? { planId: { not: "free" } }
              : undefined,
      });

      await inngest.send({
        name: "app/email.broadcast",
        data: {
          subject: input.subject,
          body: input.body,
          target: input.target,
        },
      });

      return { queued: userCount };
    }),

  recipientCount: adminProcedure
    .input(z.object({ target: z.enum(["ALL", "FREE", "PRO"]) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.user.count({
        where:
          input.target === "FREE"
            ? { planId: "free" }
            : input.target === "PRO"
              ? { planId: { not: "free" } }
              : undefined,
      });
    }),
});
