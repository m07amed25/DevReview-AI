import { createTRPCRouter, adminProcedure } from "../../trpc";

export const adminStatsRouter = createTRPCRouter({
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
});
