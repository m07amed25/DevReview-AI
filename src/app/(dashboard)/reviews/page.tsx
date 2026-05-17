"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, ShieldAlert, ShieldX, BarChart3, CheckCircle2, Loader2 } from "lucide-react";
import { type ReviewStatus, type SortKey, type SortDir, type ViewMode } from "@/features/review/types/dashboard";
import { getRiskLevel } from "@/features/review/utils/dashboard-helpers";
import { RiskDistributionBar } from "@/features/review/components/dashboard/chart-components";
import { StatCard } from "@/features/review/components/dashboard/stat-card";
import { EmptyState } from "@/features/review/components/dashboard/controls";
import { ReviewCard, ReviewCardSkeleton } from "@/features/review/components/dashboard/review-card";
import { ReviewsHeader } from "@/features/review/components/dashboard/ReviewsHeader";
import { ReviewsFilters } from "@/features/review/components/dashboard/ReviewsFilters";

export default function ReviewsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [repoFilter, setRepoFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const reviews = trpc.review.list.useQuery({ limit: 50 });
  const repos = trpc.repository.list.useQuery();
  const [currentTime] = useState(() => Date.now());

  const stats = useMemo(() => {
    if (!reviews.data) return null;
    const now = currentTime;
    const total = reviews.data.length;
    const completed = reviews.data.filter((r) => r.status === "COMPLETED").length;
    const pending = reviews.data.filter((r) => r.status === "PENDING" || r.status === "PROCESSING").length;
    const failed = reviews.data.filter((r) => r.status === "FAILED").length;
    const withRisk = reviews.data.filter((r) => r.riskScore != null);
    const avgRisk = withRisk.reduce((sum, r) => sum + (r.riskScore ?? 0), 0) / (withRisk.length || 1);

    const sevenDaysAgo = now - 7 * 86400000;
    const fourteenDaysAgo = now - 14 * 86400000;
    const thisWeek = reviews.data.filter((r) => new Date(r.createdAt).getTime() >= sevenDaysAgo);
    const lastWeek = reviews.data.filter((r) => { const t = new Date(r.createdAt).getTime(); return t >= fourteenDaysAgo && t < sevenDaysAgo; });
    const thisWeekCompleted = thisWeek.filter((r) => r.status === "COMPLETED").length;
    const lastWeekCompleted = lastWeek.filter((r) => r.status === "COMPLETED").length;

    const totalTrend: "up" | "down" | "neutral" = thisWeek.length > lastWeek.length ? "up" : thisWeek.length < lastWeek.length ? "down" : "neutral";
    const completedTrend: "up" | "down" | "neutral" = thisWeekCompleted > lastWeekCompleted ? "up" : thisWeekCompleted < lastWeekCompleted ? "down" : "neutral";
    const totalDiff = thisWeek.length - lastWeek.length;
    const completedDiff = thisWeekCompleted - lastWeekCompleted;

    const days = 7;
    const totalBuckets = Array.from({ length: days }, () => 0);
    const completedBuckets = Array.from({ length: days }, () => 0);
    const pendingBuckets = Array.from({ length: days }, () => 0);
    const riskBuckets: number[][] = Array.from({ length: days }, () => []);

    reviews.data.forEach((r) => {
      const age = Math.floor((now - new Date(r.createdAt).getTime()) / 86400000);
      if (age < days) {
        const idx = days - 1 - age;
        totalBuckets[idx]++;
        if (r.status === "COMPLETED") completedBuckets[idx]++;
        if (r.status === "PENDING" || r.status === "PROCESSING") pendingBuckets[idx]++;
        if (r.riskScore != null) riskBuckets[idx].push(r.riskScore);
      }
    });

    const riskSparkline = riskBuckets.map((bucket) => bucket.length > 0 ? bucket.reduce((a, b) => a + b, 0) / bucket.length : 0);

    return {
      total, completed, pending, failed,
      avgRisk: Math.round(avgRisk * 10) / 10,
      totalTrend, completedTrend,
      totalTrendLabel: totalDiff === 0 ? "No change" : `${totalDiff > 0 ? "+" : ""}${totalDiff} this week`,
      completedTrendLabel: completedDiff === 0 ? "No change" : `${completedDiff > 0 ? "+" : ""}${completedDiff} this week`,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalSparkline: totalBuckets,
      completedSparkline: completedBuckets,
      pendingSparkline: pendingBuckets,
      riskSparkline,
    };
  }, [reviews.data, currentTime]);

  const statusCounts = useMemo(() => {
    if (!reviews.data) return { ALL: 0, PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0 };
    return {
      ALL: reviews.data.length,
      PENDING: reviews.data.filter((r) => r.status === "PENDING").length,
      PROCESSING: reviews.data.filter((r) => r.status === "PROCESSING").length,
      COMPLETED: reviews.data.filter((r) => r.status === "COMPLETED").length,
      FAILED: reviews.data.filter((r) => r.status === "FAILED").length,
    };
  }, [reviews.data]);

  const filtered = useMemo(() => {
    if (!reviews.data) return [];
    let result = [...reviews.data];
    if (statusFilter !== "ALL") result = result.filter((r) => r.status === statusFilter);
    if (repoFilter !== "ALL") result = result.filter((r) => r.repositoryId === repoFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.prTitle.toLowerCase().includes(q) || r.repository.fullName.toLowerCase().includes(q) || r.prNumber.toString().includes(q) || (r.summary && r.summary.toLowerCase().includes(q)));
    }
    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "date": return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "risk": return dir * ((a.riskScore ?? -1) - (b.riskScore ?? -1));
        case "status": { const order = { FAILED: 0, PROCESSING: 1, PENDING: 2, COMPLETED: 3 }; return dir * ((order[a.status as ReviewStatus] ?? 0) - (order[b.status as ReviewStatus] ?? 0)); }
        case "repo": return dir * a.repository.fullName.localeCompare(b.repository.fullName);
        default: return 0;
      }
    });
    return result;
  }, [reviews.data, statusFilter, repoFilter, search, sortKey, sortDir]);

  const hasFilters = statusFilter !== "ALL" || repoFilter !== "ALL" || search.trim() !== "";
  const clearFilters = useCallback(() => { setSearch(""); setStatusFilter("ALL"); setRepoFilter("ALL"); }, []);
  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }, [sortKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); document.getElementById("review-search")?.focus(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (reviews.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4"><Skeleton className="size-12 rounded-2xl" /><div className="space-y-1.5"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-72" /></div></div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="rounded-xl border bg-card p-4 sm:p-5 space-y-3"><div className="flex items-center justify-between"><Skeleton className="h-3 w-16 rounded" /><Skeleton className="size-10 rounded-xl" /></div><div className="space-y-1.5"><Skeleton className="h-8 w-14 rounded-md" /><Skeleton className="h-3 w-24 rounded" /></div></div>))}
        </div>
        <div className="flex gap-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-8 w-24 rounded-full" />))}</div>
        <Skeleton className="h-12 rounded-xl" />
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<ReviewCardSkeleton key={i} viewMode="list" />))}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ReviewsHeader stats={stats} />

      {reviews.data && reviews.data.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-1">
          <div className="flex-1 max-w-md">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 opacity-70">Risk Distribution</p>
            <RiskDistributionBar reviews={reviews.data} />
          </div>
          <div className="flex items-center gap-5 sm:gap-8 sm:ml-4">
            {[{ label: "Repositories", value: repos.data?.length ?? 0 }, { label: "Completed", value: stats?.completed ?? 0 }, { label: "In Progress", value: stats?.pending ?? 0 }].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-xl font-bold text-foreground tabular-nums">{value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && stats.total > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} icon={BarChart3} color="bg-primary" subtitle={`${stats.completed} completed`} trend={stats.totalTrend} trendLabel={stats.totalTrendLabel} sparklineData={stats.totalSparkline} />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="bg-emerald-500" subtitle={stats.total > 0 ? `${stats.completionRate}% success rate` : undefined} trend={stats.completedTrend} trendLabel={stats.completedTrendLabel} sparklineData={stats.completedSparkline} progress={stats.completionRate} />
          <StatCard label="In Progress" value={stats.pending} icon={Loader2} color="bg-blue-500" subtitle="Pending & processing" live={stats.pending > 0} sparklineData={stats.pendingSparkline} />
          <StatCard label="Avg. Risk" value={stats.avgRisk} icon={stats.avgRisk <= 30 ? ShieldCheck : stats.avgRisk <= 60 ? ShieldAlert : ShieldX} color={stats.avgRisk <= 30 ? "bg-emerald-500" : stats.avgRisk <= 60 ? "bg-amber-500" : "bg-red-500"} subtitle={`${getRiskLevel(stats.avgRisk).label} risk overall`} decimals={1} sparklineData={stats.riskSparkline} progress={stats.avgRisk} />
        </div>
      )}

      <ReviewsFilters
        search={search} onSearchChange={setSearch}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
        repoFilter={repoFilter} onRepoChange={setRepoFilter}
        sortKey={sortKey} sortDir={sortDir} onToggleSort={toggleSort}
        viewMode={viewMode} onViewModeChange={setViewMode}
        statusCounts={statusCounts}
        repos={repos.data}
        hasFilters={hasFilters} onClearFilters={clearFilters}
      />

      {hasFilters && filtered.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
          <p className="text-xs text-muted-foreground">Showing <span className="font-semibold text-foreground">{filtered.length}</span> of <span className="font-semibold text-foreground">{reviews.data?.length ?? 0}</span> reviews</p>
        </div>
      )}

      {filtered.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((review, i) => (<ReviewCard key={review.id} review={{ ...review, createdAt: review.createdAt as unknown as string, repository: review.repository }} index={i} viewMode={viewMode} />))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((review, i) => (<ReviewCard key={review.id} review={{ ...review, createdAt: review.createdAt as unknown as string, repository: review.repository }} index={i} viewMode={viewMode} />))}
          </div>
        )
      ) : (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      )}

      {filtered.length > 0 && filtered.length >= 50 && (
        <div className="text-center py-6"><p className="text-xs text-muted-foreground">Showing latest 50 reviews</p></div>
      )}
    </div>
  );
}
