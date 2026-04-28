import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { UserRole } from "../../db/client";
import { createTRPCRouter, adminProcedure, publicProcedure } from "../trpc";
import {
  sendSupportReplyEmail,
  sendAdminPromotedEmail,
  sendAdminDemotedEmail,
} from "../../email/service";

export const adminRouter = createTRPCRouter({
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalRepositories,
      totalReviews,
      totalTeams,
      reviewsByStatus,
      recentSignups,
      reviewsLast7Days,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.repository.count(),
      ctx.db.review.count(),
      ctx.db.team.count(),
      ctx.db.review.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      ctx.db.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      ctx.db.review.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(
      reviewsByStatus.map((r) => [r.status, r._count.status]),
    );

    return {
      totalUsers,
      totalRepositories,
      totalReviews,
      totalTeams,
      recentSignups,
      reviewsLast7Days,
      reviewsByStatus: {
        PENDING: statusMap.PENDING ?? 0,
        PROCESSING: statusMap.PROCESSING ?? 0,
        COMPLETED: statusMap.COMPLETED ?? 0,
        FAILED: statusMap.FAILED ?? 0,
      },
    };
  }),

  getGrowthData: adminProcedure.query(async ({ ctx }) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [users, reviews] = await Promise.all([
      ctx.db.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      ctx.db.review.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const buckets: Record<
      string,
      { date: string; users: number; reviews: number }
    > = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, users: 0, reviews: 0 };
    }

    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].users++;
    }
    for (const r of reviews) {
      const key = r.createdAt.toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].reviews++;
    }

    return Object.values(buckets);
  }),

  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().max(50).trim().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            role: true,
            banned: true,
            bannedReason: true,
            createdAt: true,
            _count: {
              select: {
                repositories: true,
                reviews: true,
                teamMembers: true,
              },
            },
          },
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        users: users.map((u) => ({
          ...u,
          isOwner: u.email === process.env.OWNER_MAIL,
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  getUser: adminProcedure
    .input(z.object({ userId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          repositories: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              fullName: true,
              private: true,
              createdAt: true,
              _count: { select: { reviews: true } },
            },
          },
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              prTitle: true,
              status: true,
              riskScore: true,
              createdAt: true,
            },
          },
          teamMembers: {
            include: {
              team: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: {
            select: { repositories: true, reviews: true, sessions: true },
          },
        },
      });
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        role: z.nativeEnum(UserRole),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true, name: true },
      });

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      // 1. Protect the owner from any role changes
      if (targetUser.email === process.env.OWNER_MAIL) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The owner's role cannot be changed.",
        });
      }

      // 2. Prevent users from changing their own role (except the owner, but we handled that above)
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot change your own role.",
        });
      }

      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      // Send email notification
      if (input.role === "ADMIN") {
        void sendAdminPromotedEmail({
          to: targetUser.email,
          userName: targetUser.name || "User",
          promotedByName: ctx.user.name || "Administrator",
        });
      } else if (input.role === "USER") {
        void sendAdminDemotedEmail({
          to: targetUser.email,
          userName: targetUser.name || "User",
          demotedByName: ctx.user.name || "Administrator",
        });
      }

      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      // 1. Protect the owner from deletion
      if (targetUser.email === process.env.OWNER_MAIL) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The owner's account cannot be deleted.",
        });
      }

      // 2. Prevent deleting the admin account itself
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete your own admin account.",
        });
      }

      await ctx.db.user.delete({ where: { id: input.userId } });
      return { success: true };
    }),

  banUser: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        reason: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      // 1. Protect the owner from being banned
      if (targetUser.email === process.env.OWNER_MAIL) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The owner's account cannot be banned.",
        });
      }

      // 2. Prevent banning self
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot ban your own account.",
        });
      }

      // Ban the user and immediately revoke all their active sessions
      await ctx.db.$transaction([
        ctx.db.user.update({
          where: { id: input.userId },
          data: {
            banned: true,
            bannedReason: input.reason ?? null,
          },
        }),
        ctx.db.session.deleteMany({
          where: { userId: input.userId },
        }),
      ]);
      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { banned: false, bannedReason: null },
      });
      return { success: true };
    }),

  getReviews: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        status: z
          .enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "ALL"])
          .default("ALL"),
        search: z.string().max(50).trim().optional(),
        sortBy: z
          .enum(["createdAt", "riskScore", "prNumber"])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status, search, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      // Build where clause
      const conditions: Record<string, unknown>[] = [];
      if (status !== "ALL") {
        conditions.push({ status });
      }
      if (search) {
        conditions.push({
          OR: [
            { prTitle: { contains: search, mode: "insensitive" as const } },
            {
              repository: {
                fullName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              user: {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    email: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            },
          ],
        });
      }
      const where = conditions.length > 0 ? { AND: conditions } : {};

      const [reviews, total, statusCounts] = await Promise.all([
        ctx.db.review.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            prTitle: true,
            prNumber: true,
            prUrl: true,
            status: true,
            riskScore: true,
            summary: true,
            error: true,
            qualityMetrics: true,
            createdAt: true,
            updatedAt: true,
            repository: {
              select: {
                id: true,
                fullName: true,
                htmlUrl: true,
                private: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                threads: true,
                feedbacks: true,
                childReviews: true,
              },
            },
            feedbacks: {
              select: { rating: true },
            },
          },
        }),
        ctx.db.review.count({ where }),
        ctx.db.review.groupBy({
          by: ["status"],
          _count: { status: true },
          where,
        }),
      ]);

      const statusMap = Object.fromEntries(
        statusCounts.map((r) => [r.status, r._count.status]),
      );

      return {
        reviews,
        total,
        pages: Math.ceil(total / limit),
        statusBreakdown: {
          PENDING: statusMap.PENDING ?? 0,
          PROCESSING: statusMap.PROCESSING ?? 0,
          COMPLETED: statusMap.COMPLETED ?? 0,
          FAILED: statusMap.FAILED ?? 0,
        },
      };
    }),

  deleteReview: adminProcedure
    .input(z.object({ reviewId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.review.delete({ where: { id: input.reviewId } });
      return { success: true };
    }),

  getTeams: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [teams, total] = await Promise.all([
        ctx.db.team.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { members: true, repositories: true } },
          },
        }),
        ctx.db.team.count(),
      ]);

      return { teams, total, pages: Math.ceil(total / limit) };
    }),

  deleteTeam: adminProcedure
    .input(z.object({ teamId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.team.delete({ where: { id: input.teamId } });
      return { success: true };
    }),

  getFeedbacks: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        rating: z.union([z.literal(1), z.literal(-1), z.literal(0)]).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, rating } = input;
      const skip = (page - 1) * limit;
      const where = rating !== 0 ? { rating } : {};

      const [feedbacks, total] = await Promise.all([
        ctx.db.reviewFeedback.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true, image: true } },
            review: {
              select: {
                id: true,
                prTitle: true,
                prNumber: true,
                repository: { select: { id: true, fullName: true } },
              },
            },
          },
        }),
        ctx.db.reviewFeedback.count({ where }),
      ]);

      return { feedbacks, total, pages: Math.ceil(total / limit) };
    }),

  getRepositories: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().max(50).trim().optional(),
        sortBy: z.enum(["createdAt", "name", "reviews"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { name: { contains: search, mode: "insensitive" as const } },
              {
                user: {
                  email: { contains: search, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {};

      const [repositories, total] = await Promise.all([
        ctx.db.repository.findMany({
          where,
          skip,
          take: limit,
          orderBy:
            sortBy === "reviews"
              ? { reviews: { _count: sortOrder } }
              : { [sortBy]: sortOrder },
          include: {
            user: { select: { name: true, email: true, image: true } },
            team: { select: { name: true, slug: true } },
            webhookConfig: { select: { enabled: true } },
            scheduledScanConfig: { select: { enabled: true, cadence: true } },
            _count: {
              select: { reviews: true, reviewRules: true, diagrams: true },
            },
          },
        }),
        ctx.db.repository.count({ where }),
      ]);

      return { repositories, total, pages: Math.ceil(total / limit) };
    }),

  deleteRepository: adminProcedure
    .input(z.object({ repositoryId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.repository.delete({ where: { id: input.repositoryId } });
      return { success: true };
    }),

  getSystemSettings: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.systemSettings.upsert({
      where: { id: "global" },
      update: {},
      create: { id: "global", maintenanceMode: false },
    });
  }),

  updateSystemSettings: adminProcedure
    .input(z.object({ maintenanceMode: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.systemSettings.update({
        where: { id: "global" },
        data: { maintenanceMode: input.maintenanceMode },
      });
    }),

  getSupportMessages: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.supportMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  updateSupportStatus: adminProcedure
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supportMessage.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  replyToSupportMessage: adminProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email(),
        replyMessage: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.supportMessage.findUnique({
        where: { id: input.id },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Send the email
      await sendSupportReplyEmail({
        to: input.email,
        originalMessage: message.message,
        replyMessage: input.replyMessage,
      });

      // Update status to RESOLVED
      return ctx.db.supportMessage.update({
        where: { id: input.id },
        data: { status: "RESOLVED" },
      });
    }),

  submitSupportMessage: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        message: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supportMessage.create({
        data: {
          email: input.email,
          message: input.message,
        },
      });
    }),

  getAuditLogs: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [actions, total] = await Promise.all([
        ctx.db.teamAction.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            team: { select: { id: true, name: true } },
          },
        }),
        ctx.db.teamAction.count(),
      ]);

      // Batch-load user info for all actor IDs
      const userIds = [
        ...new Set([
          ...actions.map((a) => a.requestedBy),
          ...actions.map((a) => a.resolvedBy).filter(Boolean),
        ]),
      ] as string[];

      const users = await ctx.db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      const logs = actions.map((a) => ({
        id: a.id,
        actionType: a.actionType,
        status: a.status,
        teamId: a.teamId,
        teamName: a.team.name,
        requestedBy: userMap.get(a.requestedBy) ?? {
          id: a.requestedBy,
          name: "Unknown",
          email: "",
        },
        resolvedBy: a.resolvedBy
          ? (userMap.get(a.resolvedBy) ?? {
              id: a.resolvedBy,
              name: "Unknown",
              email: "",
            })
          : null,
        targetUserId: a.targetUserId,
        targetRepoId: a.targetRepoId,
        createdAt: a.createdAt,
        resolvedAt: a.resolvedAt,
      }));

      return { logs, total, pages: Math.ceil(total / limit) };
    }),

  getSecuritySettings: adminProcedure.query(async ({ ctx }) => {
    const [
      systemSettings,
      bannedUsersCount,
      activeSessionsCount,
      failedReviewsCount,
    ] = await Promise.all([
      ctx.db.systemSettings.upsert({
        where: { id: "global" },
        update: {},
        create: { id: "global", maintenanceMode: false },
      }),
      ctx.db.user.count({ where: { banned: true } }),
      ctx.db.session.count({
        where: { expiresAt: { gt: new Date() } },
      }),
      ctx.db.review.count({
        where: {
          status: "FAILED",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      maintenanceMode: systemSettings.maintenanceMode,
      bannedUsersCount,
      activeSessionsCount,
      failedReviewsLast24h: failedReviewsCount,
    };
  }),
});
