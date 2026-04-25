"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DropdownSelect, SelectItem } from "@/components/ui/select";
import {
  Search, X, Activity, FolderGit2, ShieldCheck, ShieldAlert, ShieldX,
  CircleDot, BarChart3, Calendar, Flame, LayoutList, LayoutGrid,
  CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { type ReviewStatus, type SortKey, type SortDir, type ViewMode } from "@/features/review/types/dashboard";
import { getRiskLevel } from "@/features/review/utils/dashboard-helpers";
import { ActivitySparkline, RiskDistributionBar, StatProgressRing } from "@/features/review/components/dashboard/chart-components";
import { StatCard } from "@/features/review/components/dashboard/stat-card";
import { StatusTabs, EmptyState } from "@/features/review/components/dashboard/controls";
import { ReviewCard, ReviewCardSkeleton } from "@/features/review/components/dashboard/review-card";

export default function ReviewsPage() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [repoFilter, setRepoFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const reviews = trpc.review.list.useQuery({ limit: 50 });
  const repos = trpc.repository.list.useQuery();

  useGSAP(
    () => {
      if (!headerRef.current) return;
      gsap.fromTo(headerRef.current, { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
    },
    { scope: headerRef },
  );

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
    const lastWeek = reviews.data.filter((r) => {
      const t = new Date(r.createdAt).getTime();
      return t >= fourteenDaysAgo && t < sevenDaysAgo;
    });

    const thisWeekCompleted = thisWeek.filter((r) => r.status === "COMPLETED").length;
    const lastWeekCompleted = lastWeek.filter((r) => r.status === "COMPLETED").length;

    const totalTrend: "up" | "down" | "neutral" =
      thisWeek.length > lastWeek.length ? "up" : thisWeek.length < lastWeek.length ? "down" : "neutral";
    const completedTrend: "up" | "down" | "neutral" =
      thisWeekCompleted > lastWeekCompleted ? "up" : thisWeekCompleted < lastWeekCompleted ? "down" : "neutral";

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

    const riskSparkline = riskBuckets.map((bucket) =>
      bucket.length > 0 ? bucket.reduce((a, b) => a + b, 0) / bucket.length : 0,
    );

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

  const activityData = useMemo(() => {
    if (!reviews.data) return [];
    const days = 14;
    const buckets = Array.from({ length: days }, () => 0);
    reviews.data.forEach((r) => {
      const age = Math.floor((currentTime - new Date(r.createdAt).getTime()) / 86400000);
      if (age < days) buckets[days - 1 - age]++;
    });
    return buckets;
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
      result = result.filter(
        (r) =>
          r.prTitle.toLowerCase().includes(q) ||
          r.repository.fullName.toLowerCase().includes(q) ||
          r.prNumber.toString().includes(q) ||
          (r.summary && r.summary.toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "date": return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "risk": return dir * ((a.riskScore ?? -1) - (b.riskScore ?? -1));
        case "status": {
          const order = { FAILED: 0, PROCESSING: 1, PENDING: 2, COMPLETED: 3 };
          return dir * ((order[a.status as ReviewStatus] ?? 0) - (order[b.status as ReviewStatus] ?? 0));
        }
        case "repo": return dir * a.repository.fullName.localeCompare(b.repository.fullName);
        default: return 0;
      }
    });
    return result;
  }, [reviews.data, statusFilter, repoFilter, search, sortKey, sortDir]);

  const hasFilters = statusFilter !== "ALL" || repoFilter !== "ALL" || search.trim() !== "";

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("ALL");
    setRepoFilter("ALL");
  }, []);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else { setSortKey(key); setSortDir("desc"); }
    },
    [sortKey],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("review-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (reviews.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/40 bg-linear-to-br from-card/90 via-card/70 to-card/50 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="size-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-8 w-14 rounded-md" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <ReviewCardSkeleton key={i} viewMode="list" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div ref={headerRef}>
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-linear-to-br from-card/80 via-card/60 to-transparent p-6 backdrop-blur-sm">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 size-40 rounded-full bg-primary/3 blur-2xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-lg shadow-primary/5">
                <Activity className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Review History</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats
                    ? `${stats.total} review${stats.total !== 1 ? "s" : ""} across ${repos.data?.length ?? 0} repositories`
                    : "Track all your AI code reviews in one place"}
                </p>
                {reviews.data && reviews.data.length > 0 && (
                  <div className="mt-3 hidden sm:block">
                    <RiskDistributionBar reviews={reviews.data} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {activityData.length > 0 && activityData.some((v) => v > 0) && (
                <div className="hidden md:block">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">Last 14 days</p>
                  <div className="h-10 w-32 text-primary">
                    <ActivitySparkline data={activityData} />
                  </div>
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
                <Link href="/repo">
                  <FolderGit2 className="size-4" />
                  Repositories
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {stats && stats.total > 0 && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} icon={BarChart3} color="bg-primary" subtitle={`${stats.completed} completed`} delay={0.05} trend={stats.totalTrend} trendLabel={stats.totalTrendLabel} sparklineData={stats.totalSparkline} />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="bg-emerald-500" subtitle={stats.total > 0 ? `${stats.completionRate}% success rate` : undefined} delay={0.1} trend={stats.completedTrend} trendLabel={stats.completedTrendLabel} sparklineData={stats.completedSparkline} progress={stats.completionRate} />
          <StatCard label="In Progress" value={stats.pending} icon={Loader2} color="bg-blue-500" subtitle="Pending & processing" delay={0.15} live={stats.pending > 0} sparklineData={stats.pendingSparkline} />
          <StatCard
            label="Avg. Risk"
            value={stats.avgRisk}
            icon={stats.avgRisk <= 3 ? ShieldCheck : stats.avgRisk <= 6 ? ShieldAlert : ShieldX}
            color={stats.avgRisk <= 3 ? "bg-emerald-500" : stats.avgRisk <= 6 ? "bg-amber-500" : "bg-red-500"}
            subtitle={`${getRiskLevel(stats.avgRisk).label} risk overall`}
            delay={0.2}
            decimals={1}
            sparklineData={stats.riskSparkline}
            progress={stats.avgRisk * 10}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <StatusTabs active={statusFilter} onChange={setStatusFilter} counts={statusCounts} />
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5 bg-muted/30">
          <button onClick={() => setViewMode("list")} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all", viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <LayoutList className="size-3.5" />List
          </button>
          <button onClick={() => setViewMode("grid")} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all", viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <LayoutGrid className="size-3.5" />Grid
          </button>
        </div>
      </div>

      <Card className="relative z-20 border-border/50 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input id="review-search" placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-16 h-9 text-sm bg-background/50" />
              {search ? (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="size-4" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-[10px]">Ctrl</span>K
                </kbd>
              )}
            </div>
            <DropdownSelect value={repoFilter} onValueChange={(v) => setRepoFilter(v)} className="w-full sm:w-44 h-9 text-sm bg-background/50" placeholder="All Repositories">
              <SelectItem value="ALL">All Repositories</SelectItem>
              {repos.data?.map((repo) => (
                <SelectItem key={repo.id} value={repo.id}>
                  <span className="truncate">{repo.name}</span>
                </SelectItem>
              ))}
            </DropdownSelect>
            <div className="flex gap-1 items-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mr-1 hidden lg:block">Sort</span>
              {(
                [
                  { key: "date", label: "Date", icon: Calendar },
                  { key: "risk", label: "Risk", icon: Flame },
                  { key: "status", label: "Status", icon: CircleDot },
                  { key: "repo", label: "Repo", icon: FolderGit2 },
                ] as { key: SortKey; label: string; icon: React.ElementType }[]
              ).map(({ key, label, icon: SortIcon }) => (
                <Button key={key} variant={sortKey === key ? "secondary" : "ghost"} size="sm" className={cn("h-8 px-2 text-[11px] gap-1", sortKey === key && "font-semibold shadow-sm")} onClick={() => toggleSort(key)} title={`Sort by ${label}`}>
                  <SortIcon className="size-3.5" />
                  <span className="hidden xl:inline">{label}</span>
                  {sortKey === key && <span className="text-[9px]">{sortDir === "desc" ? "↓" : "↑"}</span>}
                </Button>
              ))}
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1" onClick={clearFilters}>
                <X className="size-3.5" />Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {hasFilters && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span> of {reviews.data?.length ?? 0} reviews
          </p>
        </div>
      )}

      {filtered.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((review, i) => (
              <ReviewCard key={review.id} review={{ ...review, createdAt: review.createdAt as unknown as string, repository: review.repository }} index={i} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((review, i) => (
              <ReviewCard key={review.id} review={{ ...review, createdAt: review.createdAt as unknown as string, repository: review.repository }} index={i} viewMode={viewMode} />
            ))}
          </div>
        )
      ) : (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      )}

      {filtered.length > 0 && filtered.length >= 50 && (
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">Showing latest 50 reviews</p>
        </div>
      )}
    </div>
  );
}
