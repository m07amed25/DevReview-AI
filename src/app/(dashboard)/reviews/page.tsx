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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DropdownSelect, SelectItem } from "@/components/ui/select";
import {
  Search,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
  FolderGit2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CircleDot,
  BarChart3,
  Calendar,
  ChevronRight,
  Sparkles,
  Eye,
  Flame,
  Zap,
  LayoutList,
  LayoutGrid,
  RefreshCw,
  Filter,
  GitPullRequest,
} from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

type ReviewStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
type SortKey = "date" | "risk" | "status" | "repo";
type SortDir = "asc" | "desc";
type ViewMode = "list" | "grid";

interface ReviewComment {
  severity: "critical" | "warning" | "info" | "suggestion";
}

const STATUS_CONFIG: Record<
  ReviewStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    ring: string;
    dot: string;
    gradient: string;
  }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    dot: "bg-amber-500",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  PROCESSING: {
    label: "Processing",
    icon: Loader2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
    dot: "bg-blue-500",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
    dot: "bg-red-500",
    gradient: "from-red-500/20 to-red-600/5",
  },
};

function getRiskLevel(score: number) {
  if (score <= 3)
    return {
      label: "Low",
      color: "text-emerald-500",
      bg: "bg-emerald-500",
      glow: "shadow-emerald-500/20",
    };
  if (score <= 6)
    return {
      label: "Medium",
      color: "text-amber-500",
      bg: "bg-amber-500",
      glow: "shadow-amber-500/20",
    };
  return {
    label: "High",
    color: "text-red-500",
    bg: "bg-red-500",
    glow: "shadow-red-500/20",
  };
}

function AnimatedCounter({
  value,
  className,
  decimals = 0,
}: {
  value: number;
  className?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obj = { val: prevValue.current };
    gsap.to(obj, {
      val: value,
      duration: 1,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent =
          decimals > 0
            ? obj.val.toFixed(decimals)
            : Math.round(obj.val).toString();
      },
    });
    prevValue.current = value;
  }, [value, decimals]);

  return (
    <span ref={ref} className={className}>
      {decimals > 0 ? value.toFixed(decimals) : value}
    </span>
  );
}

function MiniRiskGauge({ score, size = 44 }: { score: number; size?: number }) {
  const risk = getRiskLevel(score);
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 10) * circumference;
  const gaugeRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!gaugeRef.current) return;
    gsap.fromTo(
      gaugeRef.current,
      { strokeDashoffset: circumference },
      {
        strokeDashoffset: offset,
        duration: 1,
        delay: 0.3,
        ease: "power2.out",
      },
    );
  }, [offset, circumference]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 36 36"
        style={{ width: size, height: size }}
        className="-rotate-90"
      >
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-muted/20"
        />
        <circle
          ref={gaugeRef}
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          className={risk.color}
        />
      </svg>
      <span
        className={cn(
          "absolute text-[10px] font-bold tabular-nums",
          risk.color,
        )}
      >
        {score}
      </span>
    </div>
  );
}

function ActivitySparkline({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (v / max) * 80 - 10;
    return `${x},${y}`;
  });
  const lineRef = useRef<SVGPolylineElement>(null);

  useEffect(() => {
    if (!lineRef.current) return;
    const length = lineRef.current.getTotalLength();
    gsap.fromTo(
      lineRef.current,
      { strokeDasharray: length, strokeDashoffset: length },
      { strokeDashoffset: 0, duration: 1.5, ease: "power2.out" },
    );
  }, []);

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("w-full h-full", className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points.join(" ")} 100,100`}
        fill="url(#sparkFill)"
        className="text-primary"
      />
      <polyline
        ref={lineRef}
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
    </svg>
  );
}

function SeverityDonut({ comments }: { comments: ReviewComment[] }) {
  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0, suggestion: 0 };
    comments.forEach((cm) => {
      if (cm.severity in c) c[cm.severity as keyof typeof c]++;
    });
    return c;
  }, [comments]);

  const total = comments.length;
  if (total === 0) return null;

  const segments = [
    { count: counts.critical, color: "#ef4444", label: "critical" },
    { count: counts.warning, color: "#f59e0b", label: "warning" },
    { count: counts.info, color: "#3b82f6", label: "info" },
    { count: counts.suggestion, color: "#10b981", label: "suggestion" },
  ].filter((s) => s.count > 0);

  const r = 10;
  const circumference = 2 * Math.PI * r;
  let cumulativeOffset = 0;

  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="size-6 -rotate-90">
        {segments.map((seg) => {
          const segLen = (seg.count / total) * circumference;
          const el = (
            <circle
              key={seg.label}
              cx="12"
              cy="12"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="3"
              strokeDasharray={`${segLen} ${circumference - segLen}`}
              strokeDashoffset={-cumulativeOffset}
              strokeLinecap="butt"
            />
          );
          cumulativeOffset += segLen;
          return el;
        })}
      </svg>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground tabular-nums">
        {counts.critical > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="size-1.5 rounded-full bg-red-500" />
            {counts.critical}
          </span>
        )}
        {counts.warning > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="size-1.5 rounded-full bg-amber-500" />
            {counts.warning}
          </span>
        )}
        {counts.info > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="size-1.5 rounded-full bg-blue-500" />
            {counts.info}
          </span>
        )}
        {counts.suggestion > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {counts.suggestion}
          </span>
        )}
      </div>
    </div>
  );
}

function relativeTime(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isRecentlyCompleted(date: string | Date) {
  return Date.now() - new Date(date).getTime() < 3600000;
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
    );
  }, []);

  return (
    <div ref={containerRef}>
      <Card className="border-dashed border-2 border-muted-foreground/15 bg-linear-to-b from-muted/30 to-transparent">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl scale-150" />
            <div className="absolute inset-0 rounded-full bg-primary/3 blur-xl scale-125 animate-pulse" />
            <div className="relative flex size-24 items-center justify-center rounded-2xl bg-linear-to-br from-muted/80 to-muted/30 ring-1 ring-muted-foreground/10 backdrop-blur-sm">
              {hasFilters ? (
                <Filter className="size-10 text-muted-foreground/40" />
              ) : (
                <div className="relative">
                  <GitPullRequest className="size-10 text-muted-foreground/40" />
                  <Sparkles className="absolute -top-1 -right-1 size-4 text-primary/50 animate-pulse" />
                </div>
              )}
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground/80">
            {hasFilters ? "No matching reviews" : "No reviews yet"}
          </h3>
          <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
            {hasFilters
              ? "Try adjusting your filters or search query to find what you're looking for."
              : "Start reviewing pull requests from your repositories. AI-powered code reviews will appear here once triggered."}
          </p>
          {hasFilters ? (
            <Button variant="outline" className="mt-6 gap-2" onClick={onClear}>
              <RefreshCw className="size-4" />
              Clear Filters
            </Button>
          ) : (
            <Button asChild className="mt-8 gap-2 shadow-lg shadow-primary/10">
              <Link href="/repo">
                <FolderGit2 className="size-4" />
                Browse Repositories
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  delay = 0,
  decimals = 0,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  delay?: number;
  decimals?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 20, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        delay,
        ease: "back.out(1.7)",
      },
    );
  }, [delay]);

  return (
    <div ref={cardRef} style={{ opacity: 0 }}>
      <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        {/* Background glow accent */}
        <div
          className={cn(
            "absolute -right-4 -top-4 size-20 rounded-full opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20",
            color,
          )}
        />
        <div className="relative flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <AnimatedCounter
                value={value}
                className="text-2xl font-bold tabular-nums tracking-tight"
                decimals={decimals}
              />
            </div>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground leading-tight">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
              color,
            )}
          >
            <Icon className="size-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTabs({
  active,
  onChange,
  counts,
}: {
  active: ReviewStatus | "ALL";
  onChange: (status: ReviewStatus | "ALL") => void;
  counts: Record<ReviewStatus | "ALL", number>;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <button
        onClick={() => onChange("ALL")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
          active === "ALL"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        )}
      >
        All
        <span
          className={cn(
            "tabular-nums rounded-full px-1.5 py-0.5 text-[10px] leading-none",
            active === "ALL"
              ? "bg-background/20 text-background"
              : "bg-muted text-muted-foreground",
          )}
        >
          {counts.ALL}
        </span>
      </button>
      {(Object.keys(STATUS_CONFIG) as ReviewStatus[]).map((status) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        const isActive = active === status;
        return (
          <button
            key={status}
            onClick={() => onChange(status)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ring-1",
              isActive
                ? cn(config.bg, config.color, config.ring, "shadow-sm")
                : "ring-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <Icon
              className={cn(
                "size-3",
                status === "PROCESSING" && isActive && "animate-spin",
              )}
            />
            {config.label}
            {counts[status] > 0 && (
              <span
                className={cn(
                  "tabular-nums rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                  isActive
                    ? cn(config.bg, config.color)
                    : "bg-muted text-muted-foreground",
                )}
              >
                {counts[status]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function RiskDistributionBar({
  reviews,
}: {
  reviews: { riskScore?: number | null }[];
}) {
  const distribution = useMemo(() => {
    const d = { low: 0, medium: 0, high: 0 };
    reviews.forEach((r) => {
      if (r.riskScore == null) return;
      if (r.riskScore <= 3) d.low++;
      else if (r.riskScore <= 6) d.medium++;
      else d.high++;
    });
    return d;
  }, [reviews]);

  const total = distribution.low + distribution.medium + distribution.high;
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-muted-foreground font-medium shrink-0">
        Risk
      </span>
      <div className="flex h-2 flex-1 max-w-40 overflow-hidden rounded-full bg-muted/30">
        {distribution.low > 0 && (
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${(distribution.low / total) * 100}%` }}
          />
        )}
        {distribution.medium > 0 && (
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${(distribution.medium / total) * 100}%` }}
          />
        )}
        {distribution.high > 0 && (
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${(distribution.high / total) * 100}%` }}
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
        <span className="flex items-center gap-0.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {distribution.low}
        </span>
        <span className="flex items-center gap-0.5">
          <span className="size-1.5 rounded-full bg-amber-500" />
          {distribution.medium}
        </span>
        <span className="flex items-center gap-0.5">
          <span className="size-1.5 rounded-full bg-red-500" />
          {distribution.high}
        </span>
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  index,
  viewMode,
}: {
  review: {
    id: string;
    repositoryId: string;
    prNumber: number;
    prTitle: string;
    prUrl: string;
    status: string;
    summary?: string | null;
    riskScore?: number | null;
    comments?: unknown;
    error?: string | null;
    createdAt: string | Date;
    repository: {
      id: string;
      name: string;
      fullName: string;
      private: boolean;
    };
  };
  index: number;
  viewMode: ViewMode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const status = review.status as ReviewStatus;
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const comments = (
    Array.isArray(review.comments) ? review.comments : []
  ) as ReviewComment[];
  const recent =
    status === "COMPLETED" && isRecentlyCompleted(review.createdAt);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 15, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        delay: Math.min(index * 0.04, 0.4),
        ease: "power2.out",
      },
    );
  }, [index]);

  // Grid
  if (viewMode === "grid") {
    return (
      <div ref={cardRef} style={{ opacity: 0 }}>
        <Link
          href={`/repo/${review.repositoryId}/pr/${review.prNumber}`}
          className="group block h-full"
        >
          <Card
            className={cn(
              "relative h-full overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300",
              "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
              recent && "ring-1 ring-emerald-500/30",
            )}
          >
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-1 bg-linear-to-r",
                config.gradient,
              )}
            />
            <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/3 group-hover:to-transparent transition-all duration-500" />

            <CardContent className="relative p-4 pt-5 flex flex-col h-full">
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="shrink-0 font-mono text-[10px] px-1.5 py-0 h-5"
                >
                  #{review.prNumber}
                </Badge>
                {status === "COMPLETED" && review.riskScore != null ? (
                  <MiniRiskGauge score={review.riskScore} size={36} />
                ) : (
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg ring-1",
                      config.bg,
                      config.ring,
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        "size-4",
                        config.color,
                        status === "PROCESSING" && "animate-spin",
                      )}
                    />
                  </div>
                )}
              </div>

              <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                {review.prTitle}
              </h3>

              {status === "COMPLETED" && review.summary && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                  {review.summary}
                </p>
              )}

              {status === "FAILED" && review.error && (
                <p className="text-[11px] text-red-400/80 line-clamp-2 mb-3 flex items-start gap-1">
                  <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                  {review.error}
                </p>
              )}

              <div className="flex-1" />

              <div className="space-y-2 pt-3 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <FolderGit2 className="size-3" />
                    <span className="truncate max-w-24">
                      {review.repository.name}
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {relativeTime(review.createdAt)}
                  </span>
                </div>
                {status === "COMPLETED" && comments.length > 0 && (
                  <SeverityDonut comments={comments} />
                )}
              </div>

              {recent && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] px-1.5 py-0 gap-1">
                    <Zap className="size-2.5" />
                    New
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  // List
  return (
    <div ref={cardRef} style={{ opacity: 0 }}>
      <Link
        href={`/repo/${review.repositoryId}/pr/${review.prNumber}`}
        className="group block"
      >
        <Card
          className={cn(
            "relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300",
            "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5",
            recent && "ring-1 ring-emerald-500/30",
          )}
        >
          {/* Status accent line */}
          <div
            className={cn(
              "absolute left-0 top-0 h-full w-0.75 transition-all duration-300 group-hover:w-1",
              config.dot,
            )}
          />
          {/* Hover glow */}
          <div className="absolute inset-0 bg-linear-to-r from-primary/0 to-primary/0 group-hover:from-primary/2 group-hover:to-transparent transition-all duration-500" />

          <CardContent className="relative p-4 pl-5 sm:p-5 sm:pl-6">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Left icon / gauge */}
              <div className="hidden sm:block shrink-0 pt-0.5">
                {status === "COMPLETED" && review.riskScore != null ? (
                  <MiniRiskGauge score={review.riskScore} />
                ) : (
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl ring-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md",
                      config.bg,
                      config.ring,
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        "size-5",
                        config.color,
                        status === "PROCESSING" && "animate-spin",
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="shrink-0 font-mono text-[10px] px-1.5 py-0 h-5"
                      >
                        #{review.prNumber}
                      </Badge>
                      <h3 className="text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors truncate">
                        {review.prTitle}
                      </h3>
                      {recent && (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] px-1.5 py-0 gap-1 animate-pulse">
                          <Zap className="size-2.5" />
                          New
                        </Badge>
                      )}
                    </div>
                    {/* Meta */}
                    <div className="mt-1 flex items-center gap-2.5 flex-wrap text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FolderGit2 className="size-3 shrink-0" />
                        <span className="truncate max-w-40">
                          {review.repository.fullName}
                        </span>
                      </span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Calendar className="size-3 shrink-0" />
                        {relativeTime(review.createdAt)}
                      </span>
                      {status === "COMPLETED" && comments.length > 0 && (
                        <>
                          <span className="text-muted-foreground/30">|</span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <Eye className="size-3 shrink-0" />
                            {comments.length} issue
                            {comments.length !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 text-[11px] font-medium ring-1",
                        config.color,
                        config.bg,
                        config.ring,
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          "size-3",
                          status === "PROCESSING" && "animate-spin",
                        )}
                      />
                      {config.label}
                    </Badge>
                    {status === "COMPLETED" && review.riskScore != null && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 text-[11px] font-medium ring-1",
                          getRiskLevel(review.riskScore).color,
                          `${getRiskLevel(review.riskScore).bg}/10`,
                        )}
                      >
                        {getRiskLevel(review.riskScore).label} Risk
                      </Badge>
                    )}
                  </div>
                </div>

                {status === "COMPLETED" && review.summary && (
                  <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed pr-4">
                    {review.summary}
                  </p>
                )}
                {status === "FAILED" && review.error && (
                  <p className="text-xs text-red-400/80 line-clamp-1 flex items-center gap-1">
                    <AlertTriangle className="size-3 shrink-0" />
                    {review.error}
                  </p>
                )}

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "sm:hidden gap-1 text-[10px] font-medium ring-1",
                        config.color,
                        config.bg,
                        config.ring,
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          "size-3",
                          status === "PROCESSING" && "animate-spin",
                        )}
                      />
                      {config.label}
                    </Badge>
                    {status === "COMPLETED" && comments.length > 0 && (
                      <SeverityDonut comments={comments} />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                    <span>View details</span>
                    <ChevronRight className="size-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function ReviewCardSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "grid") {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-12 rounded-md" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="pt-2 border-t border-border/30 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 pl-6">
        <div className="flex items-start gap-4">
          <Skeleton className="hidden sm:block size-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-12 rounded-md" />
              <Skeleton className="h-4 w-52" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-full max-w-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

  useEffect(() => {
    if (!headerRef.current) return;
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -15 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
    );
  }, []);

  const stats = useMemo(() => {
    if (!reviews.data) return null;
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

    return {
      total,
      completed,
      pending,
      failed,
      avgRisk: Math.round(avgRisk * 10) / 10,
    };
  }, [reviews.data]);

  const [currentTime] = useState(() => Date.now());

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
      return {
        ALL: 0,
        PENDING: 0,
        PROCESSING: 0,
        COMPLETED: 0,
        FAILED: 0,
      };
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

    if (statusFilter !== "ALL") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (repoFilter !== "ALL") {
      result = result.filter((r) => r.repositoryId === repoFilter);
    }
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
        case "risk": {
          const aR = a.riskScore ?? -1;
          const bR = b.riskScore ?? -1;
          return dir * (aR - bR);
        }
        case "status": {
          const order = {
            FAILED: 0,
            PROCESSING: 1,
            PENDING: 2,
            COMPLETED: 3,
          };
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
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
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
            <Skeleton key={i} className="h-24 rounded-xl" />
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
      <div ref={headerRef} style={{ opacity: 0 }}>
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-linear-to-br from-card/80 via-card/60 to-transparent p-6 backdrop-blur-sm">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 size-40 rounded-full bg-primary/3 blur-2xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-lg shadow-primary/5">
                <Activity className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Review History
                </h1>
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
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">
                    Last 14 days
                  </p>
                  <div className="h-10 w-32 text-primary">
                    <ActivitySparkline data={activityData} />
                  </div>
                </div>
              )}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
              >
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
          <StatCard
            label="Total"
            value={stats.total}
            icon={BarChart3}
            color="bg-primary"
            subtitle={`${stats.completed} completed`}
            delay={0.05}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            color="bg-emerald-500"
            subtitle={
              stats.total > 0
                ? `${Math.round((stats.completed / stats.total) * 100)}% success rate`
                : undefined
            }
            delay={0.1}
          />
          <StatCard
            label="In Progress"
            value={stats.pending}
            icon={Loader2}
            color="bg-blue-500"
            subtitle="Pending & processing"
            delay={0.15}
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
            delay={0.2}
            decimals={1}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <StatusTabs
          active={statusFilter}
          onChange={setStatusFilter}
          counts={statusCounts}
        />
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5 bg-muted/30">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutList className="size-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
              viewMode === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-3.5" />
            Grid
          </button>
        </div>
      </div>

      <Card className="relative z-20 border-border/50 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="review-search"
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-16 h-9 text-sm bg-background/50"
              />
              {search ? (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-[10px]">Ctrl</span>K
                </kbd>
              )}
            </div>

            {/* Repo filter */}
            <DropdownSelect
              value={repoFilter}
              onValueChange={(v) => setRepoFilter(v)}
              className="w-full sm:w-44 h-9 text-sm bg-background/50"
              placeholder="All Repositories"
            >
              <SelectItem value="ALL">All Repositories</SelectItem>
              {repos.data?.map((repo) => (
                <SelectItem key={repo.id} value={repo.id}>
                  <span className="truncate">{repo.name}</span>
                </SelectItem>
              ))}
            </DropdownSelect>

            {/* Sort buttons */}
            <div className="flex gap-1 items-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mr-1 hidden lg:block">
                Sort
              </span>
              {(
                [
                  { key: "date", label: "Date", icon: Calendar },
                  { key: "risk", label: "Risk", icon: Flame },
                  { key: "status", label: "Status", icon: CircleDot },
                  { key: "repo", label: "Repo", icon: FolderGit2 },
                ] as {
                  key: SortKey;
                  label: string;
                  icon: React.ElementType;
                }[]
              ).map(({ key, label, icon: SortIcon }) => (
                <Button
                  key={key}
                  variant={sortKey === key ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 px-2 text-[11px] gap-1",
                    sortKey === key && "font-semibold shadow-sm",
                  )}
                  onClick={() => toggleSort(key)}
                  title={`Sort by ${label}`}
                >
                  <SortIcon className="size-3.5" />
                  <span className="hidden xl:inline">{label}</span>
                  {sortKey === key && (
                    <span className="text-[9px]">
                      {sortDir === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={clearFilters}
              >
                <X className="size-3.5" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {hasFilters && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            of {reviews.data?.length ?? 0} reviews
          </p>
        </div>
      )}

      {filtered.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="space-y-2.5">
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
 