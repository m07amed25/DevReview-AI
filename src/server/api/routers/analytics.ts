import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const DateRangeSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const TimePeriodSchema = z.enum(["7d", "30d", "90d", "6m", "1y"]);

export const analyticsRouter = createTRPCRouter({
  getOverview: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().optional(),
        teamId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId } = input;

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      // Build the where clause based on filters
      const baseWhere = {
        createdAt: {
          gte: startDate,
          lte: now,
        },
        ...(repositoryId && { repositoryId }),
      };

      // Get all accessible reviews (user's own + team accessible)
      const teamRepoIds = await ctx.db.repository.findMany({
        where: teamId
          ? { teamId }
          : { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r) => r.id);

      const reviews = await ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepoIdSet } },
          ],
          ...baseWhere,
        },
      });

      // Calculate metrics
      const totalReviews = reviews.length;
      const completedReviews = reviews.filter(
        (r) => r.status === "COMPLETED",
      ).length;
      const pendingReviews = reviews.filter(
        (r) => r.status === "PENDING",
      ).length;
      const processingReviews = reviews.filter(
        (r) => r.status === "PROCESSING",
      ).length;
      const failedReviews = reviews.filter((r) => r.status === "FAILED").length;

      // Calculate completion rate
      const completionRate =
        totalReviews > 0
          ? Math.round((completedReviews / totalReviews) * 100)
          : 0;

      // Calculate average review time (from creation to last update)
      const completedWithTimes = reviews
        .filter((r) => r.status === "COMPLETED" && r.updatedAt)
        .map((r) => ({
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));

      const avgCompletionTimeMs =
        completedWithTimes.length > 0
          ? completedWithTimes.reduce((sum, r) => {
              return sum + (r.updatedAt.getTime() - r.createdAt.getTime());
            }, 0) / completedWithTimes.length
          : 0;

      // Convert to hours
      const avgCompletionTimeHours = Math.round(
        avgCompletionTimeMs / (1000 * 60 * 60),
      );

      // Calculate risk score averages
      const reviewsWithRiskScore = reviews.filter((r) => r.riskScore !== null);
      const avgRiskScore =
        reviewsWithRiskScore.length > 0
          ? Math.round(
              reviewsWithRiskScore.reduce(
                (sum, r) => sum + (r.riskScore || 0),
                0,
              ) / reviewsWithRiskScore.length,
            )
          : 0;

      // Calculate quality metrics averages from qualityMetrics JSON
      let totalQualityScore = 0;
      let qualityScoreCount = 0;
      let totalBugDetection = 0;
      let totalBugDetectionCount = 0;
      let totalSecurityIssues = 0;
      let totalSecurityIssuesCount = 0;

      reviews.forEach((r) => {
        if (r.qualityMetrics) {
          const metrics = r.qualityMetrics as Record<string, unknown>;
          if (metrics.overallScore) {
            totalQualityScore += Number(metrics.overallScore);
            qualityScoreCount++;
          }
          if (metrics.bugDetectionRate) {
            totalBugDetection += Number(metrics.bugDetectionRate);
            totalBugDetectionCount++;
          }
          if (metrics.securityIssues) {
            totalSecurityIssues += Number(metrics.securityIssues);
            totalSecurityIssuesCount++;
          }
        }
      });

      return {
        totalReviews,
        completedReviews,
        pendingReviews,
        processingReviews,
        failedReviews,
        completionRate,
        avgCompletionTimeHours,
        avgRiskScore,
        avgQualityScore:
          qualityScoreCount > 0
            ? Math.round(totalQualityScore / qualityScoreCount)
            : 0,
        avgBugDetectionRate:
          totalBugDetectionCount > 0
            ? Math.round(totalBugDetection / totalBugDetectionCount)
            : 0,
        totalSecurityIssues,
        period: timePeriod,
      };
    }),

  getTrends: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().optional(),
        teamId: z.string().optional(),
        granularity: z.enum(["daily", "weekly", "monthly"]).default("daily"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId, granularity } = input;

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      // Get team repo IDs
      const teamRepoIds = await ctx.db.repository.findMany({
        where: teamId
          ? { teamId }
          : { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r) => r.id);

      const reviews = await ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepoIdSet } },
          ],
          createdAt: {
            gte: startDate,
            lte: now,
          },
          ...(repositoryId && { repositoryId }),
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by time period
      const trends = groupReviewsByTime(reviews, granularity, startDate, now);

      return trends;
    }),

  getApprovalRejectionRates: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().optional(),
        teamId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId } = input;

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      const teamRepoIds = await ctx.db.repository.findMany({
        where: teamId
          ? { teamId }
          : { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r) => r.id);

      const reviews = await ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepoIdSet } },
          ],
          createdAt: {
            gte: startDate,
            lte: now,
          },
          status: "COMPLETED",
          ...(repositoryId && { repositoryId }),
        },
      });

      // Analyze summary to determine approval/rejection patterns
      // This is a simplified approach - in reality you'd want more sophisticated NLP
      let approved = 0;
      let rejected = 0;
      let needsChanges = 0;
      let pending = 0;

      reviews.forEach((review) => {
        const summary = review.summary?.toLowerCase() || "";
        if (
          summary.includes("approved") ||
          summary.includes("lgtm") ||
          summary.includes("looks good")
        ) {
          approved++;
        } else if (
          summary.includes("rejected") ||
          summary.includes("changes requested")
        ) {
          rejected++;
        } else if (
          summary.includes("changes") ||
          summary.includes("needs work")
        ) {
          needsChanges++;
        } else {
          pending++;
        }
      });

      const total = reviews.length || 1; // Avoid division by zero

      return {
        approved: {
          count: approved,
          percentage: Math.round((approved / total) * 100),
        },
        rejected: {
          count: rejected,
          percentage: Math.round((rejected / total) * 100),
        },
        needsChanges: {
          count: needsChanges,
          percentage: Math.round((needsChanges / total) * 100),
        },
        pending: {
          count: pending,
          percentage: Math.round((pending / total) * 100),
        },
        total: reviews.length,
        period: timePeriod,
      };
    }),

  getReviewerWorkload: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().optional(),
        teamId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId } = input;

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      const teamRepoIds = await ctx.db.repository.findMany({
        where: teamId
          ? { teamId }
          : { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r) => r.id);

      const reviews = await ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepoIdSet } },
          ],
          createdAt: {
            gte: startDate,
            lte: now,
          },
          ...(repositoryId && { repositoryId }),
        },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      // Group by reviewer
      const reviewerMap = new Map<
        string,
        {
          id: string;
          name: string;
          image: string | null;
          total: number;
          completed: number;
          pending: number;
          failed: number;
          avgCompletionTimeHours: number;
        }
      >();

      reviews.forEach((review) => {
        const userId = review.userId;
        if (!reviewerMap.has(userId)) {
          reviewerMap.set(userId, {
            id: review.user.id,
            name: review.user.name || "Unknown",
            image: review.user.image,
            total: 0,
            completed: 0,
            pending: 0,
            failed: 0,
            avgCompletionTimeHours: 0,
          });
        }

        const reviewer = reviewerMap.get(userId)!;
        reviewer.total++;

        if (review.status === "COMPLETED") {
          reviewer.completed++;
          const completionTime =
            review.updatedAt.getTime() - review.createdAt.getTime();
          reviewer.avgCompletionTimeHours =
            (reviewer.avgCompletionTimeHours * (reviewer.completed - 1) +
              completionTime / (1000 * 60 * 60)) /
            reviewer.completed;
        } else if (
          review.status === "PENDING" ||
          review.status === "PROCESSING"
        ) {
          reviewer.pending++;
        } else if (review.status === "FAILED") {
          reviewer.failed++;
        }
      });

      // Convert to array and sort by total reviews
      const workload = Array.from(reviewerMap.values()).sort(
        (a, b) => b.total - a.total,
      );

      return {
        reviewers: workload.map((r) => ({
          ...r,
          avgCompletionTimeHours: Math.round(r.avgCompletionTimeHours),
        })),
        period: timePeriod,
      };
    }),

  getQualityScores: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().optional(),
        teamId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId } = input;

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      const teamRepoIds = await ctx.db.repository.findMany({
        where: teamId
          ? { teamId }
          : { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r) => r.id);

      const reviews = await ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepoIdSet } },
          ],
          createdAt: {
            gte: startDate,
            lte: now,
          },
          status: "COMPLETED",
          ...(repositoryId && { repositoryId }),
        },
        select: {
          qualityMetrics: true,
          riskScore: true,
          summary: true,
        },
      });

      // Extract quality metrics
      let totalCoverage = 0;
      let coverageCount = 0;
      let totalMaintainability = 0;
      let maintainabilityCount = 0;
      let totalPerformance = 0;
      let performanceCount = 0;
      let totalSecurity = 0;
      let securityCount = 0;
      const riskScores: number[] = [];

      reviews.forEach((review) => {
        if (review.qualityMetrics) {
          const metrics = review.qualityMetrics as Record<string, unknown>;

          if (metrics.coverage !== undefined) {
            totalCoverage += Number(metrics.coverage);
            coverageCount++;
          }
          if (metrics.maintainability !== undefined) {
            totalMaintainability += Number(metrics.maintainability);
            maintainabilityCount++;
          }
          if (metrics.performance !== undefined) {
            totalPerformance += Number(metrics.performance);
            performanceCount++;
          }
          if (metrics.security !== undefined) {
            totalSecurity += Number(metrics.security);
            securityCount++;
          }
        }

        if (review.riskScore !== null) {
          riskScores.push(review.riskScore);
        }
      });

      // Calculate distribution of risk scores
      const riskDistribution = {
        low: riskScores.filter((r) => r <= 30).length,
        medium: riskScores.filter((r) => r > 30 && r <= 60).length,
        high: riskScores.filter((r) => r > 60 && r <= 80).length,
        critical: riskScores.filter((r) => r > 80).length,
      };

      return {
        avgCoverage:
          coverageCount > 0 ? Math.round(totalCoverage / coverageCount) : 0,
        avgMaintainability:
          maintainabilityCount > 0
            ? Math.round(totalMaintainability / maintainabilityCount)
            : 0,
        avgPerformance:
          performanceCount > 0
            ? Math.round(totalPerformance / performanceCount)
            : 0,
        avgSecurity:
          securityCount > 0 ? Math.round(totalSecurity / securityCount) : 0,
        riskDistribution,
        totalReviewed: reviews.length,
        period: timePeriod,
      };
    }),

  getTopIssues: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().optional(),
        teamId: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId, limit } = input;

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      const teamRepoIds = await ctx.db.repository.findMany({
        where: teamId
          ? { teamId }
          : { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r) => r.id);

      const reviews = await ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepoIdSet } },
          ],
          createdAt: {
            gte: startDate,
            lte: now,
          },
          status: "COMPLETED",
          ...(repositoryId && { repositoryId }),
        },
        select: {
          comments: true,
          summary: true,
        },
      });

      // Extract issues from comments JSON
      const issueCounts = new Map<string, number>();
      const rejectionReasons = new Map<string, number>();

      reviews.forEach((review) => {
        if (review.comments) {
          const comments = review.comments as Array<{
            issue?: string;
            category?: string;
            severity?: string;
            type?: string;
          }>;

          comments.forEach((comment) => {
            if (comment.issue) {
              const current = issueCounts.get(comment.issue) || 0;
              issueCounts.set(comment.issue, current + 1);
            }
            if (comment.category) {
              const current = rejectionReasons.get(comment.category) || 0;
              rejectionReasons.set(comment.category, current + 1);
            }
          });
        }

        // Also analyze summary for rejection reasons
        if (review.summary) {
          const summary = review.summary.toLowerCase();
          if (
            summary.includes("security") ||
            summary.includes("vulnerability")
          ) {
            const current = rejectionReasons.get("Security Issues") || 0;
            rejectionReasons.set("Security Issues", current + 1);
          }
          if (summary.includes("performance") || summary.includes("slow")) {
            const current = rejectionReasons.get("Performance Issues") || 0;
            rejectionReasons.set("Performance Issues", current + 1);
          }
          if (summary.includes("bug") || summary.includes("error")) {
            const current = rejectionReasons.get("Bugs") || 0;
            rejectionReasons.set("Bugs", current + 1);
          }
          if (
            summary.includes("code quality") ||
            summary.includes("maintainability")
          ) {
            const current = rejectionReasons.get("Code Quality") || 0;
            rejectionReasons.set("Code Quality", current + 1);
          }
          if (summary.includes("style") || summary.includes("formatting")) {
            const current = rejectionReasons.get("Code Style") || 0;
            rejectionReasons.set("Code Style", current + 1);
          }
          if (summary.includes("test") || summary.includes("coverage")) {
            const current = rejectionReasons.get("Test Coverage") || 0;
            rejectionReasons.set("Test Coverage", current + 1);
          }
          if (summary.includes("documentation") || summary.includes("docs")) {
            const current = rejectionReasons.get("Documentation") || 0;
            rejectionReasons.set("Documentation", current + 1);
          }
        }
      });

      // Convert to arrays and sort by count
      const topIssues = Array.from(issueCounts.entries())
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      const topRejectionReasons = Array.from(rejectionReasons.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return {
        topIssues,
        topRejectionReasons,
        totalReviews: reviews.length,
        period: timePeriod,
      };
    }),

  getReviewerPerformance: protectedProcedure
    .input(
      z.object({
        reviewerId: z.string(),
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { reviewerId, timePeriod, repositoryId } = input;

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      const reviews = await ctx.db.review.findMany({
        where: {
          userId: reviewerId,
          createdAt: {
            gte: startDate,
            lte: now,
          },
          ...(repositoryId && { repositoryId }),
        },
        orderBy: { createdAt: "desc" },
      });

      const user = await ctx.db.user.findUnique({
        where: { id: reviewerId },
        select: { id: true, name: true, image: true, email: true },
      });

      const total = reviews.length;
      const completed = reviews.filter((r) => r.status === "COMPLETED").length;
      const pending = reviews.filter((r) => r.status === "PENDING").length;
      const processing = reviews.filter(
        (r) => r.status === "PROCESSING",
      ).length;
      const failed = reviews.filter((r) => r.status === "FAILED").length;

      // Calculate average completion time
      const completedReviews = reviews.filter(
        (r) => r.status === "COMPLETED" && r.updatedAt,
      );
      const avgCompletionTimeMs =
        completedReviews.length > 0
          ? completedReviews.reduce(
              (sum, r) => sum + (r.updatedAt.getTime() - r.createdAt.getTime()),
              0,
            ) / completedReviews.length
          : 0;

      // Calculate quality score
      let totalQualityScore = 0;
      let qualityCount = 0;
      reviews.forEach((r) => {
        if (r.qualityMetrics) {
          const metrics = r.qualityMetrics as Record<string, unknown>;
          if (metrics.overallScore) {
            totalQualityScore += Number(metrics.overallScore);
            qualityCount++;
          }
        }
      });

      return {
        reviewer: user
          ? {
              id: user.id,
              name: user.name,
              image: user.image,
              email: user.email,
            }
          : null,
        stats: {
          total,
          completed,
          pending,
          processing,
          failed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          avgCompletionTimeHours: Math.round(
            avgCompletionTimeMs / (1000 * 60 * 60),
          ),
          avgQualityScore:
            qualityCount > 0 ? Math.round(totalQualityScore / qualityCount) : 0,
        },
        recentReviews: reviews.slice(0, 10).map((r) => ({
          id: r.id,
          prTitle: r.prTitle,
          prNumber: r.prNumber,
          status: r.status,
          riskScore: r.riskScore,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        period: timePeriod,
      };
    }),

  getAnomalies: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriodSchema.default("30d"),
        repositoryId: z.string().optional(),
        teamId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, repositoryId, teamId } = input;

      const now = new Date();
      const startDate = getStartDate(timePeriod, now);

      const teamRepoIds = await ctx.db.repository.findMany({
        where: teamId
          ? { teamId }
          : { team: { members: { some: { userId: ctx.user.id } } } },
        select: { id: true },
      });
      const teamRepoIdSet = teamRepoIds.map((r) => r.id);

      const reviews = await ctx.db.review.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { repositoryId: { in: teamRepoIdSet } },
          ],
          createdAt: {
            gte: startDate,
            lte: now,
          },
          ...(repositoryId && { repositoryId }),
        },
      });

      const anomalies: Array<{
        type:
          | "high_failure_rate"
          | "slow_processing"
          | "low_quality"
          | "risk_spike";
        severity: "warning" | "critical";
        message: string;
        value: number;
        threshold: number;
      }> = [];

      // Check failure rate
      const failedCount = reviews.filter((r) => r.status === "FAILED").length;
      const failureRate =
        reviews.length > 0 ? (failedCount / reviews.length) * 100 : 0;

      if (failureRate > 20) {
        anomalies.push({
          type: "high_failure_rate",
          severity: failureRate > 40 ? "critical" : "warning",
          message: `Failure rate is ${Math.round(failureRate)}% (threshold: 20%)`,
          value: Math.round(failureRate),
          threshold: 20,
        });
      }

      // Check for reviews stuck in processing
      const stuckProcessing = reviews.filter(
        (r) =>
          r.status === "PROCESSING" &&
          now.getTime() - r.createdAt.getTime() > 30 * 60 * 1000, // 30 minutes
      ).length;

      if (stuckProcessing > 0) {
        anomalies.push({
          type: "slow_processing",
          severity: "warning",
          message: `${stuckProcessing} review(s) stuck in processing for over 30 minutes`,
          value: stuckProcessing,
          threshold: 0,
        });
      }

      // Check average quality
      let totalQualityScore = 0;
      let qualityCount = 0;
      reviews.forEach((r) => {
        if (r.qualityMetrics) {
          const metrics = r.qualityMetrics as Record<string, unknown>;
          if (metrics.overallScore) {
            totalQualityScore += Number(metrics.overallScore);
            qualityCount++;
          }
        }
      });

      const avgQualityScore =
        qualityCount > 0 ? totalQualityScore / qualityCount : 0;

      if (avgQualityScore < 50 && qualityCount > 5) {
        anomalies.push({
          type: "low_quality",
          severity: "warning",
          message: `Average quality score is ${Math.round(avgQualityScore)}% (below 50%)`,
          value: Math.round(avgQualityScore),
          threshold: 50,
        });
      }

      // Check for risk spikes
      const highRiskCount = reviews.filter(
        (r) => (r.riskScore || 0) > 80,
      ).length;
      const riskPercentage =
        reviews.length > 0 ? (highRiskCount / reviews.length) * 100 : 0;

      if (riskPercentage > 30) {
        anomalies.push({
          type: "risk_spike",
          severity: "critical",
          message: `${Math.round(riskPercentage)}% of reviews have high risk scores (threshold: 30%)`,
          value: Math.round(riskPercentage),
          threshold: 30,
        });
      }

      return {
        anomalies,
        period: timePeriod,
      };
    }),
});

// Helper functions
function getStartDate(period: string, now: Date): Date {
  const startDate = new Date(now);

  switch (period) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    case "6m":
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "1y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return startDate;
}

interface TrendDataPoint {
  date: string;
  total: number;
  completed: number;
  pending: number;
  failed: number;
}

function groupReviewsByTime(
  reviews: Array<{ createdAt: Date; status: string }>,
  granularity: "daily" | "weekly" | "monthly",
  startDate: Date,
  endDate: Date,
): TrendDataPoint[] {
  const trendMap = new Map<string, TrendDataPoint>();

  // Initialize all time buckets
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = getDateKey(current, granularity);
    trendMap.set(key, {
      date: key,
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
    });
    incrementDate(current, granularity);
  }

  // Fill in the data
  reviews.forEach((review) => {
    const key = getDateKey(review.createdAt, granularity);
    const existing = trendMap.get(key);
    if (existing) {
      existing.total++;
      if (review.status === "COMPLETED") {
        existing.completed++;
      } else if (
        review.status === "PENDING" ||
        review.status === "PROCESSING"
      ) {
        existing.pending++;
      } else if (review.status === "FAILED") {
        existing.failed++;
      }
    }
  });

  return Array.from(trendMap.values());
}

function getDateKey(
  date: Date,
  granularity: "daily" | "weekly" | "monthly",
): string {
  if (granularity === "daily") {
    return date.toISOString().split("T")[0];
  } else if (granularity === "weekly") {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().split("T")[0];
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
}

function incrementDate(
  date: Date,
  granularity: "daily" | "weekly" | "monthly",
): void {
  if (granularity === "daily") {
    date.setDate(date.getDate() + 1);
  } else if (granularity === "weekly") {
    date.setDate(date.getDate() + 7);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
}
