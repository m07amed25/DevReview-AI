import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GitPullRequest,
  GitMerge,
  XCircle,
  ExternalLink,
  Calendar,
  GitBranch,
  FileText,
  Sparkles,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CircleDot,
  Bug,
  Shield,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BookMarked,
  RefreshCw,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export interface PullRequestCardData {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  htmlUrl: string;
  author: { login: string; avatarUrl: string };
  headRef: string;
  baseRef: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  mergedAt: string | null;
  review: {
    status: string;
    summary?: string | null;
    riskScore?: number | null;
    severityCounts?: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    categories?: string[];
    createdAt: Date;
  } | null;
}

function getRiskBadgeConfig(score: number) {
  if (score < 25)
    return {
      label: "Low Risk",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      icon: ShieldCheck,
    };
  if (score < 50)
    return {
      label: "Medium Risk",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      icon: CircleDot,
    };
  if (score < 75)
    return {
      label: "High Risk",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      icon: ShieldAlert,
    };
  return {
    label: "Critical Risk",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    icon: ShieldX,
  };
}

function getCategoryTagConfig(category: string) {
  switch (category) {
    case "bug":
      return {
        icon: Bug,
        color: "text-red-500",
        bg: "bg-red-500/10 border-red-500/20",
      };
    case "security":
      return {
        icon: Shield,
        color: "text-orange-500",
        bg: "bg-orange-500/10 border-orange-500/20",
      };
    case "performance":
      return {
        icon: Zap,
        color: "text-blue-500",
        bg: "bg-blue-500/10 border-blue-500/20",
      };
    case "custom-rule":
      return {
        icon: BookMarked,
        color: "text-violet-500",
        bg: "bg-violet-500/10 border-violet-500/20",
      };
    default:
      return {
        icon: AlertTriangle,
        color: "text-muted-foreground",
        bg: "bg-muted border-border/40",
      };
  }
}

function ReviewStatusBadge({ status }: { status: string }) {
  const config = {
    COMPLETED: {
      icon: CheckCircle,
      label: "Reviewed",
      className:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    PROCESSING: {
      icon: Loader2,
      label: "Analyzing",
      className:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      spin: true,
    },
    PENDING: {
      icon: Clock,
      label: "Queued",
      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    FAILED: {
      icon: XCircle,
      label: "Failed",
      className:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
  }[status] ?? {
    icon: Clock,
    label: "Pending",
    className: "bg-muted text-muted-foreground",
    spin: false,
  };

  const Icon = config.icon;
  return (
    <Badge className={config.className}>
      <Icon
        className={cn(
          "size-3",
          "spin" in config && config.spin && "animate-spin",
        )}
      />
      {config.label}
    </Badge>
  );
}

export function PullRequestCard({
  pr,
  repositoryId,
}: {
  pr: PullRequestCardData;
  repositoryId: string;
}) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const isMerged = pr.state === "closed" && pr.mergedAt !== null;
  const hasReview = !!pr.review;
  const hasCompletedReview = hasReview && pr.review?.status === "COMPLETED";
  const riskConfig =
    hasCompletedReview && pr.review?.riskScore != null
      ? getRiskBadgeConfig(pr.review.riskScore)
      : null;
  const severityCounts = pr.review?.severityCounts;
  const totalIssues = severityCounts
    ? severityCounts.critical +
      severityCounts.high +
      severityCounts.medium +
      severityCounts.low
    : 0;
  const categories = pr.review?.categories ?? [];
  const totalChurn = pr.additions + pr.deletions;
  const addPct =
    totalChurn > 0 ? Math.round((pr.additions / totalChurn) * 100) : 50;

  const borderColor =
    hasCompletedReview && pr.review?.riskScore != null
      ? pr.review.riskScore >= 75
        ? "border-l-red-500"
        : pr.review.riskScore >= 50
          ? "border-l-orange-500"
          : pr.review.riskScore >= 25
            ? "border-l-amber-500"
            : "border-l-emerald-500"
      : isMerged
        ? "border-l-purple-500"
        : pr.state === "closed"
          ? "border-l-red-500"
          : "border-l-emerald-500";

  const timeAgo = useMemo(() => {
    const now = new Date();
    const created = new Date(pr.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(pr.createdAt);
  }, [pr.createdAt]);

  return (
    <Card
      className={cn(
        "group transition-all duration-200 hover:shadow-lg border-l-4 overflow-hidden",
        borderColor,
        "hover:shadow-primary/5",
      )}
    >
      <CardContent className="p-0">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* State Icon */}
            <div className="mt-0.5 shrink-0">
              {isMerged ? (
                <div className="p-2 rounded-full bg-purple-500/10 ring-2 ring-purple-500/20">
                  <GitMerge className="size-4 text-purple-500" />
                </div>
              ) : pr.state === "closed" ? (
                <div className="p-2 rounded-full bg-red-500/10 ring-2 ring-red-500/20">
                  <XCircle className="size-4 text-red-500" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/20">
                  <GitPullRequest className="size-4 text-emerald-500" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-2.5">
              {/* Title Row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <Link
                    href={`/repo/${repositoryId}/pr/${pr.number}`}
                    className="font-semibold hover:text-primary transition-colors text-base group-hover:underline decoration-primary/30 underline-offset-4 line-clamp-1"
                  >
                    {pr.title}
                  </Link>
                  {pr.draft && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shrink-0"
                    >
                      Draft
                    </Badge>
                  )}
                </div>
                {riskConfig && pr.review?.riskScore != null && (
                  <div
                    className={cn(
                      "flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full border text-xs font-semibold",
                      riskConfig.bg,
                      riskConfig.color,
                    )}
                  >
                    <riskConfig.icon className="size-3.5" />
                    <span>{riskConfig.label}</span>
                    <span className="font-bold tabular-nums">
                      {pr.review.riskScore}
                    </span>
                  </div>
                )}
                {hasReview && !hasCompletedReview && (
                  <ReviewStatusBadge status={pr.review!.status} />
                )}
              </div>

              {/* Meta Row */}
              <div className="flex items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground flex-wrap">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border/50 font-medium text-foreground/70">
                  #{pr.number}
                </span>
                <span className="flex items-center gap-1.5">
                  <Avatar className="size-4 ring-1 ring-background shadow-sm">
                    <AvatarImage
                      src={pr.author.avatarUrl}
                      alt={pr.author.login}
                    />
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                      {pr.author.login?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground/80">
                    {pr.author.login}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {timeAgo}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] bg-muted/40 px-2 py-0.5 rounded border border-border/30 max-w-[180px] sm:max-w-none truncate">
                  <GitBranch className="size-3 text-muted-foreground/60 shrink-0" />
                  <span className="text-foreground/60 truncate">{pr.baseRef}</span>
                  <span className="text-muted-foreground/40 shrink-0">←</span>
                  <span className="text-emerald-600 dark:text-emerald-400 truncate">
                    {pr.headRef}
                  </span>
                </span>
              </div>

              {/* AI Summary */}
              {hasCompletedReview && pr.review?.summary && (
                <div className="rounded-lg border border-primary/15 bg-primary/[0.03] p-3">
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 size-5 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                      <Sparkles className="size-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                          AI Walkthrough
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[9px] h-3.5 px-1 font-medium"
                        >
                          Auto-generated
                        </Badge>
                      </div>
                      <p
                        className={cn(
                          "text-xs leading-relaxed text-foreground/75",
                          !summaryExpanded && "line-clamp-2",
                        )}
                      >
                        {pr.review.summary}
                      </p>
                      {pr.review.summary.length > 120 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setSummaryExpanded((v) => !v);
                          }}
                          className="flex items-center gap-0.5 text-[10px] text-primary/60 hover:text-primary mt-1 transition-colors"
                        >
                          {summaryExpanded ? (
                            <>
                              <ChevronDown className="size-3" /> Show less
                            </>
                          ) : (
                            <>
                              <ChevronRight className="size-3" /> Show more
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Severity Chips */}
              {hasCompletedReview && severityCounts && totalIssues > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mr-0.5">
                    Issues:
                  </span>
                  {severityCounts.critical > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                      <span className="size-1.5 rounded-full bg-red-500 inline-block" />
                      {severityCounts.critical} Critical
                    </span>
                  )}
                  {severityCounts.high > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
                      <span className="size-1.5 rounded-full bg-orange-500 inline-block" />
                      {severityCounts.high} High
                    </span>
                  )}
                  {severityCounts.medium > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                      <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                      {severityCounts.medium} Medium
                    </span>
                  )}
                  {severityCounts.low > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-400">
                      <span className="size-1.5 rounded-full bg-slate-400 inline-block" />
                      {severityCounts.low} Low
                    </span>
                  )}
                </div>
              )}

              {/* Category Tags */}
              {hasCompletedReview && categories.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {categories.slice(0, 4).map((cat) => {
                    const cfg = getCategoryTagConfig(cat);
                    const CatIcon = cfg.icon;
                    return (
                      <span
                        key={cat}
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize",
                          cfg.bg,
                          cfg.color,
                        )}
                      >
                        <CatIcon className="size-2.5" />
                        {cat}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Bottom Row: Code Churn + Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1 text-xs font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{pr.additions}
                    </span>
                    <span className="text-muted-foreground/50">/</span>
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      -{pr.deletions}
                    </span>
                  </div>
                  <div className="w-16 h-1.5 rounded-full overflow-hidden bg-muted flex">
                    <div
                      className="h-full bg-emerald-500 rounded-l-full transition-all"
                      style={{ width: `${addPct}%` }}
                    />
                    <div
                      className="h-full bg-red-500 rounded-r-full transition-all"
                      style={{ width: `${100 - addPct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="size-3" />
                    <span>{pr.changedFiles} files</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={pr.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full sm:w-auto px-2.5 text-xs gap-1.5"
                    >
                      <ExternalLink className="size-3.5" />
                      GitHub
                    </Button>
                  </a>
                  <Link href={`/repo/${repositoryId}/pr/${pr.number}`} className="flex-1 sm:flex-none">
                    <Button
                      size="sm"
                      className={cn(
                        "h-8 w-full sm:w-auto px-3 text-xs gap-1.5 transition-all",
                        hasCompletedReview ||
                          pr.review?.status === "PENDING" ||
                          pr.review?.status === "PROCESSING"
                          ? "variant-outline border-primary/20 hover:bg-primary/5"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/25",
                      )}
                      variant={
                        hasCompletedReview ||
                        pr.review?.status === "PENDING" ||
                        pr.review?.status === "PROCESSING"
                          ? "outline"
                          : "default"
                      }
                    >
                      {pr.review?.status === "PROCESSING" ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Analyzing…
                        </>
                      ) : pr.review?.status === "PENDING" ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Queued…
                        </>
                      ) : pr.review?.status === "FAILED" ? (
                        <>
                          <RefreshCw className="size-3.5" />
                          Retry Review
                        </>
                      ) : hasCompletedReview ? (
                        <>
                          <Eye className="size-3.5" />
                          View Review
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5" />
                          Start Review
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
