import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../../trpc";
import { inngest } from "../../../inngest/client";

const emailDesignSchema = z.object({
  bgColor: z.string(),
  containerBg: z.string(),
  textColor: z.string(),
  headingColor: z.string(),
  linkColor: z.string(),
  buttonBg: z.string(),
  buttonTextColor: z.string(),
  fontFamily: z.string(),
  fontSize: z.string(),
  headingSize: z.string(),
  containerWidth: z.string(),
  padding: z.string(),
  borderRadius: z.string(),
  logoPosition: z.enum(["hidden", "top", "before-greeting", "after-greeting"]),
  logoUrl: z.string(),
  logoWidth: z.string(),
  greetingText: z.string(),
  showFooter: z.boolean(),
  footerText: z.string(),
  showUnsubscribe: z.boolean(),
  headerImageUrl: z.string().optional(),
  footerImageUrl: z.string().optional(),
  bodyImages: z.array(z.string()).optional(),
});

export const adminNewsletterRouter = createTRPCRouter({
  send: adminProcedure
    .input(
      z.object({
        subject: z.string().min(1).max(200),
        body: z.string().min(1).max(50000),
        target: z.enum(["ALL", "FREE", "PRO", "CUSTOM"]),
        userIds: z.array(z.string()).optional(),
        design: emailDesignSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userCount =
        input.target === "CUSTOM"
          ? input.userIds?.length ?? 0
          : await ctx.db.user.count({
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
          userIds: input.userIds,
          design: input.design,
        },
      });

      return { queued: userCount };
    }),

  recipientCount: adminProcedure
    .input(
      z.object({
        target: z.enum(["ALL", "FREE", "PRO", "CUSTOM"]),
        userIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.target === "CUSTOM") {
        return input.userIds?.length ?? 0;
      }
      return ctx.db.user.count({
        where:
          input.target === "FREE"
            ? { planId: "free" }
            : input.target === "PRO"
              ? { planId: { not: "free" } }
              : undefined,
      });
    }),

  searchUsers: adminProcedure
    .input(z.object({ search: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findMany({
        where: {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, email: true, image: true },
        take: 20,
      });
    }),
});
