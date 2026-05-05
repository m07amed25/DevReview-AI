import { z } from "zod";
import { UserRole } from "../../db/client";
import {
  createTRPCRouter,
  adminProcedure,
  publicProcedure,
  protectedProcedure,
} from "../trpc";
import {
  sendSupportReplyEmail,
  sendAdminPromotedEmail,
  sendAdminDemotedEmail,
} from "../../email/service";
import { logAudit } from "../../services/audit";

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
        throw new Error("User not found.");
      }

      // 1. Protect the owner from any role changes
      if (targetUser.email === process.env.OWNER_MAIL) {
        throw new Error("The owner's role cannot be changed.");
      }

      // 2. Prevent users from changing their own role (except the owner, but we handled that above)
      if (input.userId === ctx.user.id) {
        throw new Error("You cannot change your own role.");
      }

      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      // Audit log
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_ROLE_UPDATED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { newRole: input.role },
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
        throw new Error("User not found.");
      }

      // 1. Protect the owner from deletion
      if (targetUser.email === process.env.OWNER_MAIL) {
        throw new Error("The owner's account cannot be deleted.");
      }

      // 2. Prevent deleting the admin account itself
      if (input.userId === ctx.user.id) {
        throw new Error("Cannot delete your own admin account.");
      }

      await ctx.db.user.delete({ where: { id: input.userId } });
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_DELETED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
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
        throw new Error("User not found.");
      }

      // 1. Protect the owner from being banned
      if (targetUser.email === process.env.OWNER_MAIL) {
        throw new Error("The owner's account cannot be banned.");
      }

      // 2. Prevent banning self
      if (input.userId === ctx.user.id) {
        throw new Error("You cannot ban your own account.");
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
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_BANNED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { reason: input.reason ?? null },
      });
      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { banned: false, bannedReason: null },
      });
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_UNBANNED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
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
          ...(search
            ? {
                where: {
                  OR: [
                    {
                      prTitle: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      repository: {
                        fullName: {
                          contains: search,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  ],
                },
              }
            : {}),
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
      void logAudit({
        actorId: ctx.user.id,
        action: "REVIEW_DELETED",
        resource: "REVIEW",
        resourceId: input.reviewId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { success: true };
    }),

  stopAllActiveReviews: adminProcedure.mutation(async ({ ctx }) => {
    const { count } = await ctx.db.review.updateMany({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      data: {
        status: "FAILED",
        error: "Stopped by administrator.",
      },
    });

    void logAudit({
      actorId: ctx.user.id,
      action: "REVIEWS_STOPPED",
      resource: "REVIEW",
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { stoppedCount: count },
    });

    return { success: true, stoppedCount: count };
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
      void logAudit({
        actorId: ctx.user.id,
        action: "TEAM_DELETED",
        resource: "TEAM",
        resourceId: input.teamId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
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
        throw new Error("Message not found");
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

  submitFeedback: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1).max(200),
        message: z.string().min(1).max(5000),
        category: z
          .enum(["BUG", "FEATURE", "GENERAL", "OTHER"])
          .default("GENERAL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supportMessage.create({
        data: {
          userId: ctx.user.id,
          name: ctx.user.name ?? undefined,
          email: ctx.user.email,
          subject: `[${input.category}] ${input.subject}`,
          message: input.message,
          type: "FEEDBACK",
        },
      });
    }),

  getAppFeedbacks: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        status: z.enum(["ALL", "PENDING", "RESOLVED"]).default("ALL"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status } = input;
      const skip = (page - 1) * limit;
      const where = {
        type: "FEEDBACK",
        ...(status !== "ALL" ? { status } : {}),
      };

      const [feedbacks, total] = await Promise.all([
        ctx.db.supportMessage.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.supportMessage.count({ where }),
      ]);

      return { feedbacks, total, pages: Math.ceil(total / limit) };
    }),

  replyToAppFeedback: adminProcedure
    .input(
      z.object({
        id: z.string().max(255),
        replyMessage: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const feedback = await ctx.db.supportMessage.findUnique({
        where: { id: input.id },
      });

      if (!feedback) throw new Error("Feedback not found");
      if (!feedback.email) throw new Error("No email address on this feedback");

      await sendSupportReplyEmail({
        to: feedback.email,
        originalMessage: feedback.message,
        replyMessage: input.replyMessage,
      });

      return ctx.db.supportMessage.update({
        where: { id: input.id },
        data: { status: "RESOLVED" },
      });
    }),

  getAuditLogs: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().max(100).trim().optional(),
        resource: z.string().max(50).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, resource } = input;
      const skip = (page - 1) * limit;

      // ── 1. New structured AuditLog events ───────────────────────────────
      const auditWhere = {
        ...(resource ? { resource } : {}),
        ...(search
          ? {
              OR: [
                { action: { contains: search, mode: "insensitive" as const } },
                {
                  resource: { contains: search, mode: "insensitive" as const },
                },
                {
                  ipAddress: { contains: search, mode: "insensitive" as const },
                },
              ],
            }
          : {}),
      };

      const [auditLogs, auditTotal] = await Promise.all([
        ctx.db.auditLog.findMany({
          where: auditWhere,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { id: true, name: true, email: true } } },
        }),
        ctx.db.auditLog.count({ where: auditWhere }),
      ]);

      const structuredLogs = auditLogs.map((l) => ({
        id: l.id,
        source: "system" as const,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        actor: l.actor ?? null,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        country: l.country,
        city: l.city,
        metadata: l.metadata,
        createdAt: l.createdAt,
      }));

      return {
        logs: structuredLogs,
        total: auditTotal,
        pages: Math.ceil(auditTotal / limit),
      };
    }),

  /** Export audit logs as a CSV string (max 5 000 rows). */
  exportAuditLogs: adminProcedure
    .input(
      z.object({
        resource: z.string().max(50).optional(),
        search: z.string().max(100).trim().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { resource, search } = input;

      const where = {
        ...(resource ? { resource } : {}),
        ...(search
          ? {
              OR: [
                { action: { contains: search, mode: "insensitive" as const } },
                {
                  resource: { contains: search, mode: "insensitive" as const },
                },
                {
                  ipAddress: { contains: search, mode: "insensitive" as const },
                },
              ],
            }
          : {}),
      };

      const logs = await ctx.db.auditLog.findMany({
        where,
        take: 5000,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true, email: true } } },
      });

      const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

      const header =
        "id,timestamp,action,resource,resourceId,actor,ip,country,city,userAgent";
      const rows = logs.map((l) =>
        [
          l.id,
          l.createdAt.toISOString(),
          l.action,
          l.resource ?? "",
          l.resourceId ?? "",
          l.actor ? (l.actor.name ?? l.actor.email) : "",
          l.ipAddress ?? "",
          l.country ?? "",
          l.city ?? "",
          l.userAgent ?? "",
        ]
          .map(escape)
          .join(","),
      );

      return { csv: [header, ...rows].join("\n") };
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

  // ── SSO Providers ─────────────────────────────────────────────────────────
  getSsoProviders: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.ssoProvider.findMany({ orderBy: { createdAt: "asc" } });
  }),

  upsertSsoProvider: adminProcedure
    .input(
      z.object({
        id: z.string().max(255).optional(),
        name: z.string().min(1).max(100),
        type: z.enum(["OIDC", "SAML"]),
        enabled: z.boolean().default(false),
        issuer: z.string().url().optional().or(z.literal("")),
        clientId: z.string().max(500).optional(),
        clientSecret: z.string().max(500).optional(),
        entryPoint: z.string().url().optional().or(z.literal("")),
        certificate: z.string().max(10000).optional(),
        emailDomain: z.string().max(253).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = id
        ? await ctx.db.ssoProvider.update({ where: { id }, data })
        : await ctx.db.ssoProvider.create({ data });

      void logAudit({
        actorId: ctx.user.id,
        action: id ? "SSO_PROVIDER_UPDATED" : "SSO_PROVIDER_CREATED",
        resource: "SSO_PROVIDER",
        resourceId: result.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { name: input.name, type: input.type },
      });

      return result;
    }),

  deleteSsoProvider: adminProcedure
    .input(z.object({ id: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.ssoProvider.delete({ where: { id: input.id } });
      void logAudit({
        actorId: ctx.user.id,
        action: "SSO_PROVIDER_DELETED",
        resource: "SSO_PROVIDER",
        resourceId: input.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { success: true };
    }),

  // ── Custom RBAC Roles ─────────────────────────────────────────────────────
  getCustomRoles: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.customRole.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { userRoles: true } } },
    });
  }),

  upsertCustomRole: adminProcedure
    .input(
      z.object({
        id: z.string().max(255).optional(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        canViewReviews: z.boolean().default(true),
        canTriggerReviews: z.boolean().default(false),
        canManageRepositories: z.boolean().default(false),
        canManageTeams: z.boolean().default(false),
        canViewAnalytics: z.boolean().default(false),
        canManageUsers: z.boolean().default(false),
        canAccessAdmin: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = id
        ? await ctx.db.customRole.update({ where: { id }, data })
        : await ctx.db.customRole.create({ data });

      void logAudit({
        actorId: ctx.user.id,
        action: id ? "CUSTOM_ROLE_UPDATED" : "CUSTOM_ROLE_CREATED",
        resource: "CUSTOM_ROLE",
        resourceId: result.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { name: input.name },
      });

      return result;
    }),

  deleteCustomRole: adminProcedure
    .input(z.object({ id: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      // Prevent deletion of seeded roles
      if (["role_viewer", "role_reviewer", "role_manager"].includes(input.id)) {
        throw new Error("Built-in roles cannot be deleted.");
      }
      await ctx.db.customRole.delete({ where: { id: input.id } });
      void logAudit({
        actorId: ctx.user.id,
        action: "CUSTOM_ROLE_DELETED",
        resource: "CUSTOM_ROLE",
        resourceId: input.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return { success: true };
    }),

  assignCustomRole: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        roleId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.userCustomRole.upsert({
        where: {
          userId_roleId: { userId: input.userId, roleId: input.roleId },
        },
        update: {},
        create: { userId: input.userId, roleId: input.roleId },
      });
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_ROLE_ASSIGNED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { roleId: input.roleId },
      });
      return { success: true };
    }),

  revokeCustomRole: adminProcedure
    .input(
      z.object({
        userId: z.string().max(255),
        roleId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.userCustomRole.deleteMany({
        where: { userId: input.userId, roleId: input.roleId },
      });
      void logAudit({
        actorId: ctx.user.id,
        action: "USER_ROLE_REVOKED",
        resource: "USER",
        resourceId: input.userId,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { roleId: input.roleId },
      });
      return { success: true };
    }),

  getUserCustomRoles: adminProcedure
    .input(z.object({ userId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.userCustomRole.findMany({
        where: { userId: input.userId },
        include: { role: true },
      });
    }),

  // ── Data Retention Settings ───────────────────────────────────────────────
  getRetentionSettings: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.systemSettings.upsert({
      where: { id: "global" },
      update: {},
      create: { id: "global", maintenanceMode: false },
    });
  }),

  updateRetentionSettings: adminProcedure
    .input(
      z.object({
        reviewRetentionDays: z.number().int().min(0).max(3650),
        auditLogRetentionDays: z.number().int().min(0).max(3650),
        sessionRetentionDays: z.number().int().min(0).max(365),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.systemSettings.update({
        where: { id: "global" },
        data: input,
      });
      void logAudit({
        actorId: ctx.user.id,
        action: "RETENTION_SETTINGS_UPDATED",
        resource: "SYSTEM_SETTINGS",
        resourceId: "global",
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: input as Record<string, unknown>,
      });
      return result;
    }),
});
