"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DropdownSelect, SelectItem } from "@/components/ui/select";
import {
  Search,
  X,
  FolderGit2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CircleDot,
  BarChart3,
  Calendar,
  Flame,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ReviewStatus,
  type SortKey,
  type SortDir,
  type ViewMode,
} from "@/features/review/types/dashboard";
import { getRiskLevel } from "@/features/review/utils/dashboard-helpers";
import {
  ActivitySparkline,
  RiskDistributionBar,
  StatProgressRing,
} from "@/features/review/components/dashboard/chart-components";
import { StatCard } from "@/features/review/components/dashboard/stat-card";
import {
  StatusTabs,
  EmptyState,
} from "@/features/review/components/dashboard/controls";
import {
  ReviewCard,
  ReviewCardSkeleton,
} from "@/features/review/components/dashboard/review-card";

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

  const [currentTime] = useState(() => Date.now());

  const stats = useMemo(() => {
    if (!reviews.data) return null;
    const now = currentTime;
    const total = reviews.data.length;
    const completed = reviews.data.filter(
      (r) => r.status === "COMPLETED",
    ).length;
    const pending = reviews.data.filter(
      (r) => r.status === "PENDING" || r.status === "PROCESSING",
    ).length;
    const failed = reviews.data.filter((r) => r.status === "FAILED").length;
    const withRisk = reviews.data.filter((r) => r.riskScore != null);
    const avgRisk =
      withRisk.reduce((sum, r) => sum + (r.riskScore ?? 0), 0) /
      (withRisk.length || 1);

    const sevenDaysAgo = now - 7 * 86400000;
    const fourteenDaysAgo = now - 14 * 86400000;
    const thisWeek = reviews.data.filter(
      (r) => new Date(r.createdAt).getTime() >= sevenDaysAgo,
    );
    const lastWeek = reviews.data.filter((r) => {
      const t = new Date(r.createdAt).getTime();
      return t >= fourteenDaysAgo && t < sevenDaysAgo;
    });

    const thisWeekCompleted = thisWeek.filter(
      (r) => r.status === "COMPLETED",
    ).length;
    const lastWeekCompleted = lastWeek.filter(
      (r) => r.status === "COMPLETED",
    ).length;

    const totalTrend: "up" | "down" | "neutral" =
      thisWeek.length > lastWeek.length
        ? "up"
        : thisWeek.length < lastWeek.length
          ? "down"
          : "neutral";
    const completedTrend: "up" | "down" | "neutral" =
      thisWeekCompleted > lastWeekCompleted
        ? "up"
        : thisWeekCompleted < lastWeekCompleted
          ? "down"
          : "neutral";

    const totalDiff = thisWeek.length - lastWeek.length;
    const completedDiff = thisWeekCompleted - lastWeekCompleted;

    const days = 7;
    const totalBuckets = Array.from({ length: days }, () => 0);
    const completedBuckets = Array.from({ length: days }, () => 0);
    const pendingBuckets = Array.from({ length: days }, () => 0);
    const riskBuckets: number[][] = Array.from({ length: days }, () => []);

    reviews.data.forEach((r) => {
      const age = Math.floor(
        (now - new Date(r.createdAt).getTime()) / 86400000,
      );
      if (age < days) {
        const idx = days - 1 - age;
        totalBuckets[idx]++;
        if (r.status === "COMPLETED") completedBuckets[idx]++;
        if (r.status === "PENDING" || r.status === "PROCESSING")
          pendingBuckets[idx]++;
        if (r.riskScore != null) riskBuckets[idx].push(r.riskScore);
      }
    });

    const riskSparkline = riskBuckets.map((bucket) =>
      bucket.length > 0 ? bucket.reduce((a, b) => a + b, 0) / bucket.length : 0,
    );

    return {
      total,
      completed,
      pending,
      failed,
      avgRisk: Math.round(avgRisk * 10) / 10,
      totalTrend,
      completedTrend,
      totalTrendLabel:
        totalDiff === 0
          ? "No change"
          : `${totalDiff > 0 ? "+" : ""}${totalDiff} this week`,
      completedTrendLabel:
        completedDiff === 0
          ? "No change"
          : `${completedDiff > 0 ? "+" : ""}${completedDiff} this week`,
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
      const age = Math.floor(
        (currentTime - new Date(r.createdAt).getTime()) / 86400000,
      );
      if (age < days) buckets[days - 1 - age]++;
    });
    return buckets;
  }, [reviews.data, currentTime]);

  const statusCounts = useMemo(() => {
    if (!reviews.data)
      return { ALL: 0, PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0 };
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
    if (statusFilter !== "ALL")
      result = result.filter((r) => r.status === statusFilter);
    if (repoFilter !== "ALL")
      result = result.filter((r) => r.repositoryId === repoFilter);
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
        case "date":
          return (
            dir *
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
        case "risk":
          return dir * ((a.riskScore ?? -1) - (b.riskScore ?? -1));
        case "status": {
          const order = { FAILED: 0, PROCESSING: 1, PENDING: 2, COMPLETED: 3 };
          return (
            dir *
            ((order[a.status as ReviewStatus] ?? 0) -
              (order[b.status as ReviewStatus] ?? 0))
          );
        }
        case "repo":
          return (
            dir * a.repository.fullName.localeCompare(b.repository.fullName)
          );
        default:
          return 0;
      }
    });
    return result;
  }, [reviews.data, statusFilter, repoFilter, search, sortKey, sortDir]);

  const hasFilters =
    statusFilter !== "ALL" || repoFilter !== "ALL" || search.trim() !== "";

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("ALL");
    setRepoFilter("ALL");
  }, []);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortKey(key);
        setSortDir("desc");
      }
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
            <div
              key={i}
              className="rounded-xl border bg-card p-4 sm:p-5 space-y-3"
            >
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
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ReviewCardSkeleton key={i} viewMode="list" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-5 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/3 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
              <BarChart3 className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Code Reviews
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground font-medium flex items-center gap-2">
                {stats && stats.pending > 0 && (
                  <span className="flex size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
                )}
                {stats
                  ? `${stats.total} review${stats.total !== 1 ? "s" : ""} · ${stats.completed} completed · ${stats.pending} in progress`
                  : "Review history and insights"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 shrink-0 h-9 rounded-lg border-border/60 hover:bg-muted/60"
            >
              <Link href="/repo">
                <FolderGit2 className="size-4 text-muted-foreground" />
                Manage Repos
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {reviews.data && reviews.data.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-1">
          <div className="flex-1 max-w-md">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 opacity-70">
              Risk Distribution
            </p>
            <RiskDistributionBar reviews={reviews.data} />
          </div>
          <div className="flex items-center gap-5 sm:gap-8 sm:ml-4">
            {[
              { label: "Repositories", value: repos.data?.length ?? 0 },
              { label: "Completed", value: stats?.completed ?? 0 },
              { label: "In Progress", value: stats?.pending ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-xl font-bold text-foreground tabular-nums">
                  {value}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mt-0.5">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && stats.total > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={BarChart3}
            color="bg-primary"
            subtitle={`${stats.completed} completed`}
            trend={stats.totalTrend}
            trendLabel={stats.totalTrendLabel}
            sparklineData={stats.totalSparkline}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            color="bg-emerald-500"
            subtitle={
              stats.total > 0
                ? `${stats.completionRate}% success rate`
                : undefined
            }
            trend={stats.completedTrend}
            trendLabel={stats.completedTrendLabel}
            sparklineData={stats.completedSparkline}
            progress={stats.completionRate}
          />
          <StatCard
            label="In Progress"
            value={stats.pending}
            icon={Loader2}
            color="bg-blue-500"
            subtitle="Pending & processing"
            live={stats.pending > 0}
            sparklineData={stats.pendingSparkline}
          />
          <StatCard
            label="Avg. Risk"
            value={stats.avgRisk}
            icon={
              stats.avgRisk <= 3
                ? ShieldCheck
                : stats.avgRisk <= 6
                  ? ShieldAlert
                  : ShieldX
            }
            color={
              stats.avgRisk <= 3
                ? "bg-emerald-500"
                : stats.avgRisk <= 6
                  ? "bg-amber-500"
                  : "bg-red-500"
            }
            subtitle={`${getRiskLevel(stats.avgRisk).label} risk overall`}
            decimals={1}
            sparklineData={stats.riskSparkline}
            progress={stats.avgRisk * 10}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card/80 backdrop-blur-sm border rounded-xl p-3 shadow-sm">
        <StatusTabs
          active={statusFilter}
          onChange={setStatusFilter}
          counts={statusCounts}
        />

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-1 gap-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center justify-center size-7 rounded-md transition-all duration-150",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              title="List view"
            >
              <LayoutList className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center justify-center size-7 rounded-md transition-all duration-150",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm border border-border/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              title="Grid view"
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <Card className="shadow-none border-border/50 bg-card/50">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
              <Input
                id="review-search"
                placeholder="Search by title, repo, or PR #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-16 h-9 text-sm bg-background shadow-none border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/40"
              />
              {search ? (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-[10px]">Ctrl</span>K
                </kbd>
              )}
            </div>
            <DropdownSelect
              value={repoFilter}
              onValueChange={(v) => setRepoFilter(v)}
              className="w-full sm:w-48 h-9 text-sm bg-background shadow-none border-border/50"
              placeholder="Filter by repository"
            >
              <SelectItem value="ALL">All Repositories</SelectItem>
              {repos.data?.map((repo) => (
                <SelectItem key={repo.id} value={repo.id}>
                  <span className="truncate">{repo.name}</span>
                </SelectItem>
              ))}
            </DropdownSelect>
            <div className="flex gap-1 items-center bg-muted/30 p-1 rounded-lg border border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold px-1.5 hidden lg:block">
                Sort
              </span>
              {(
                [
                  { key: "date", label: "Date", icon: Calendar },
                  { key: "risk", label: "Risk", icon: Flame },
                  { key: "status", label: "Status", icon: CircleDot },
                ] as { key: SortKey; label: string; icon: React.ElementType }[]
              ).map(({ key, label, icon: SortIcon }) => (
                <Button
                  key={key}
                  variant={sortKey === key ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-[11px] gap-1.5 rounded-md transition-all duration-150",
                    sortKey === key
                      ? "bg-background text-foreground shadow-sm font-bold border border-border/40"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => toggleSort(key)}
                >
                  <SortIcon
                    className={cn(
                      "size-3",
                      sortKey === key
                        ? "text-primary"
                        : "text-muted-foreground/50",
                    )}
                  />
                  <span>{label}</span>
                  {sortKey === key && (
                    <span className="text-primary/60">
                      {sortDir === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </Button>
              ))}
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1 transition-colors"
                onClick={clearFilters}
              >
                <X className="size-3" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {hasFilters && filtered.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {reviews.data?.length ?? 0}
            </span>{" "}
            reviews
          </p>
        </div>
      )}

      {filtered.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((review, i) => (
              <ReviewCard
                key={review.id}
                review={{
                  ...review,
                  createdAt: review.createdAt as unknown as string,
                  repository: review.repository,
                }}
                index={i}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((review, i) => (
              <ReviewCard
                key={review.id}
                review={{
                  ...review,
                  createdAt: review.createdAt as unknown as string,
                  repository: review.repository,
                }}
                index={i}
                viewMode={viewMode}
              />
            ))}
          </div>
        )
      ) : (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      )}

      {filtered.length > 0 && filtered.length >= 50 && (
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">
            Showing latest 50 reviews
          </p>
        </div>
      )}
    </div>
  );
}
