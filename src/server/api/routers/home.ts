import { createTRPCRouter, publicProcedure } from "../trpc";

export const homeRouter = createTRPCRouter({
  getAboutStats: publicProcedure.query(async ({ ctx }) => {
    const [totalRepositories, totalReviews, avgSecondsResult] =
      await Promise.all([
        ctx.db.repository.count(),
        ctx.db.review.count(),
        ctx.db.$queryRaw<{ avg_seconds: number | null }[]>`
          SELECT ROUND(AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))))::int AS avg_seconds
          FROM "Review"
          WHERE status = 'COMPLETED'
        `,
      ]);

    const avgSeconds = avgSecondsResult[0]?.avg_seconds ?? null;
    let avgReviewTime: string;
    if (avgSeconds === null) {
      avgReviewTime = "< 8s";
    } else if (avgSeconds < 60) {
      avgReviewTime = `~${avgSeconds}s`;
    } else {
      avgReviewTime = `~${Math.round(avgSeconds / 60)}m`;
    }

    return {
      totalRepositories: Math.max(50, totalRepositories),
      totalReviews: Math.max(100, totalReviews),
      avgReviewTime,
    };
  }),

  getStats: publicProcedure.query(async ({ ctx }) => {
    const [totalUsers, totalReviews, completedReviews] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.review.count(),
      ctx.db.review.count({ where: { status: "COMPLETED" } }),
    ]);

    const displayUsers = Math.max(15, totalUsers);
    const displayReviews = Math.max(50, totalReviews);
    const displayLinesAnalyzed = Math.max(
      10,
      Math.floor((completedReviews * 150) / 1000) + 10,
    );

    return { displayUsers, displayReviews, displayLinesAnalyzed };
  }),

  getRecentUsers: publicProcedure.query(async ({ ctx }) => {
    const [totalUsers, recentUsers] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.$queryRaw<{ id: string; image: string | null; name: string }[]>`
        SELECT id, image, name FROM "user"
        ORDER BY RANDOM()
        LIMIT 5
      `,
    ]);

    return {
      totalUsers: Math.max(15, totalUsers),
      recentUsers,
    };
  }),
});
