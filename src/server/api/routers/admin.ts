import { z } from "zod";
import { UserRole } from "../../db/client";
import { createTRPCRouter, adminProcedure } from "../trpc";

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
        search: z.string().optional(),
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

      return { users, total, pages: Math.ceil(total / limit) };
    }),

  getUser: adminProcedure
    .input(z.object({ userId: z.string() }))
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
        userId: z.string(),
        role: z.nativeEnum(UserRole),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new Error("You cannot change your own role.");
      }
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent deleting the admin account itself
      if (input.userId === ctx.user.id) {
        throw new Error("Cannot delete your own admin account.");
      }
      await ctx.db.user.delete({ where: { id: input.userId } });
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
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status } = input;
      const skip = (page - 1) * limit;
      const where = status !== "ALL" ? { status } : {};

      const [reviews, total] = await Promise.all([
        ctx.db.review.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            prTitle: true,
            prNumber: true,
            status: true,
            riskScore: true,
            createdAt: true,
            repository: { select: { fullName: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        }),
        ctx.db.review.count({ where }),
      ]);

      return { reviews, total, pages: Math.ceil(total / limit) };
    }),

  deleteReview: adminProcedure
    .input(z.object({ reviewId: z.string() }))
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
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.team.delete({ where: { id: input.teamId } });
      return { success: true };
    }),
});
