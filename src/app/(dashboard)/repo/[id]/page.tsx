"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  GitPullRequest,
  GitMerge,
  GitCommit,
  Clock,
  FileText,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  GitBranch,
  Globe,
  Lock,
  Search,
  Calendar,
  TrendingUp,
  Activity,
  Eye,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CircleDot,
  Bug,
  Shield,
  Zap,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { CodeTimeline } from "@/components/code-timeline";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function RepositoryDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [prState, setPrState] = useState<"open" | "closed" | "all">("open");
  const [searchQuery, setSearchQuery] = useState("");

  const repository = trpc.repository.list.useQuery(undefined, {
    select: (repos) => repos.find((r) => r.id === id),
  });

  const pullRequests = trpc.pullRequest.list.useQuery(
    { repositoryId: id, state: prState },
    { enabled: !!id },
  );

  // Fetch all PRs for accurate count calculations (not filtered by state)
  const allPullRequests = trpc.pullRequest.list.useQuery(
    { repositoryId: id, state: "all" },
    { enabled: !!id },
  );

  const filteredPRs = useMemo(() => {
    if (!pullRequests.data) return [];
    if (!searchQuery.trim()) return pullRequests.data;
    const query = searchQuery.toLowerCase();
    return pullRequests.data.filter(
      (pr) =>
        pr.title.toLowerCase().includes(query) ||
        pr.author.login.toLowerCase().includes(query) ||
        pr.headRef.toLowerCase().includes(query) ||
        pr.baseRef.toLowerCase().includes(query),
    );
  }, [pullRequests.data, searchQuery]);

  const prCounts = {
    open: allPullRequests.data?.filter((pr) => pr.state === "open").length ?? 0,
    closed:
      allPullRequests.data?.filter((pr) => pr.state === "closed").length ?? 0,
    all: allPullRequests.data?.length ?? 0,
  };

  const stats = useMemo(() => {
    if (!allPullRequests.data || allPullRequests.data.length === 0) return null;
    const totalAdditions = allPullRequests.data.reduce(
      (sum, pr) => sum + pr.additions,
      0,
    );
    const totalDeletions = allPullRequests.data.reduce(
      (sum, pr) => sum + pr.deletions,
      0,
    );
    const totalFiles = allPullRequests.data.reduce(
      (sum, pr) => sum + pr.changedFiles,
      0,
    );
    return { totalAdditions, totalDeletions, totalFiles };
  }, [allPullRequests.data]);

  if (repository.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!repository.data) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <GitBranch className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium">Repository not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This repository may have been disconnected.
          </p>
          <Link href="/repo" className="mt-6 inline-block">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Back to repositories
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href={"/repo"}>
            <Button variant={"outline"} size={"icon"} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">
                {repository.data.name}
              </h1>
              <Badge variant={"outline"} className="gap-1">
                {repository.data.private ? (
                  <>
                    <Lock className="size-3" />
                    Private
                  </>
                ) : (
                  <>
                    <Globe className="size-3" />
                    Public
                  </>
                )}
              </Badge>
            </div>
            <a
              href={repository.data.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 mt-1"
            >
              {repository.data.fullName}
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={"ghost"}
            size={"icon-sm"}
            onClick={() => pullRequests.refetch()}
            disabled={pullRequests.isFetching}
          >
            <RefreshCw
              className={cn(
                "size-4",
                pullRequests.isFetching && "animate-spin",
              )}
            />
          </Button>
        </div>
      </div>

      {/* Repository Meta Info */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="size-4" />
              Created {formatDate(repository.data.createdAt.toString())}
            </span>
            <span className="flex items-center gap-2">
              <RefreshCw className="size-4" />
              Updated {formatDate(repository.data.updatedAt.toString())}
            </span>
          </div>
          <a
            href={repository.data.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View on GitHub
            <ExternalLink className="size-3" />
          </a>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 pb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
              <GitPullRequest className="size-4" />
              Open PRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {prCounts.open}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active pull requests
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 pb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600 flex items-center gap-2">
              <GitMerge className="size-4" />
              Merged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {prCounts.closed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Closed pull requests
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 pb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <TrendingUp className="size-4" />
              Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              +{stats?.totalAdditions ?? 0}
              <span className="text-red-500 ml-1">
                -{stats?.totalDeletions ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lines changed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 pb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
              <Activity className="size-4" />
              Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {stats?.totalFiles ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Files modified</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="border-b border-border/60 w-full">
          <div className="flex items-center gap-1">
            {(["open", "closed", "all"] as const).map((state) => (
              <button
                key={state}
                onClick={() => setPrState(state)}
                className={cn(
                  "relative px-4 py-2.5 text-sm font-medium transition-colors",
                  prState === state
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="flex items-center gap-2">
                  {state === "open" && (
                    <GitPullRequest className="size-4 text-emerald-500" />
                  )}
                  {state === "closed" && (
                    <GitMerge className="size-4 text-purple-500" />
                  )}
                  {state === "all" && (
                    <GitBranch className="size-4 text-muted-foreground" />
                  )}
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-xs rounded-md tabular-nums",
                      prState === state
                        ? "bg-foreground/10 text-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {prCounts[state]}
                  </span>
                </span>
                {prState === state && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search pull requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {/* Pull Requests List */}
      <div className="space-y-3">
        {pullRequests.isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : pullRequests.error ? (
          <Card className="border-destructive/50">
            <CardContent className="py-12 text-center">
              <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="size-6 text-destructive" />
              </div>
              <p className="mt-4 font-medium text-destructive">
                Failed to load pull requests.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {pullRequests.error.message}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => pullRequests.refetch()}
              >
                <RefreshCw className="size-4 mr-2" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : filteredPRs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
                <GitPullRequest className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">
                {searchQuery
                  ? "No matching pull requests"
                  : "No pull requests found."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : prState === "all"
                    ? "This repository has no pull requests yet."
                    : `No ${prState} pull requests found.`}
              </p>
              {searchQuery && (
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPRs.map((pr) => (
            <PullRequestCard key={pr.id} pr={pr} repositoryId={id} />
          ))
        )}
      </div>

      {/* Commit Timeline */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2">
          <GitCommit className="size-5" />
          Commit History
        </h2>
        <CodeTimeline repositoryId={id} />
      </div>

      {/* Developer Credit */}
      <div className="mt-8 pt-6 border-t border-border/30 text-center">
        <p className="text-sm text-muted-foreground">
          Developed by{" "}
          <a
            href="mailto:m07hamedreda25@gmail.com"
            className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
          >
            Mohamed Reda
          </a>{" "}
          -{" "}
          <a
            href="mailto:m07hamedreda25@gmail.com"
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            m07hamedreda25@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

interface PullRequestCardProps {
  pr: {
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
      severityCounts?: { critical: number; high: number; medium: number; low: number };
      categories?: string[];
      createdAt: Date;
    } | null;
  };
  repositoryId: string;
}

function getRiskBadgeConfig(score: number) {
  if (score < 25)
    return {
      label: "Low Risk",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      icon: ShieldCheck,
      dot: "bg-emerald-500",
    };
  if (score < 50)
    return {
      label: "Medium Risk",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      icon: CircleDot,
      dot: "bg-amber-500",
    };
  if (score < 75)
    return {
      label: "High Risk",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      icon: ShieldAlert,
      dot: "bg-orange-500",
    };
  return {
    label: "Critical Risk",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    icon: ShieldX,
    dot: "bg-red-500",
  };
}

function getCategoryTagConfig(category: string) {
  switch (category) {
    case "bug":
      return { icon: Bug, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" };
    case "security":
      return { icon: Shield, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" };
    case "performance":
      return { icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" };
    default:
      return { icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-muted border-border/40" };
  }
}

function PullRequestCard({ pr, repositoryId }: PullRequestCardProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const isMerged = pr.state === "closed" && pr.mergedAt !== null;
  const hasReview = !!pr.review;
  const hasCompletedReview = hasReview && pr.review?.status === "COMPLETED";

  const riskConfig = hasCompletedReview && pr.review?.riskScore != null
    ? getRiskBadgeConfig(pr.review.riskScore)
    : null;

  const severityCounts = pr.review?.severityCounts;
  const totalIssues = severityCounts
    ? severityCounts.critical + severityCounts.high + severityCounts.medium + severityCounts.low
    : 0;

  const categories = pr.review?.categories ?? [];

  // Code churn bar
  const totalChurn = pr.additions + pr.deletions;
  const addPct = totalChurn > 0 ? Math.round((pr.additions / totalChurn) * 100) : 50;

  // Determine card border color based on risk (if reviewed) or state
  const borderColor = hasCompletedReview && pr.review?.riskScore != null
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
        {/* Main Row */}
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

                {/* Risk Score Badge — CodeRabbit style */}
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
                    <span className="font-bold tabular-nums">{pr.review.riskScore}</span>
                  </div>
                )}

                {/* Review status badge (when not completed) */}
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
                    <AvatarImage src={pr.author.avatarUrl} alt={pr.author.login} />
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                      {pr.author.login?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground/80">{pr.author.login}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {timeAgo}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] bg-muted/40 px-2 py-0.5 rounded border border-border/30">
                  <GitBranch className="size-3 text-muted-foreground/60" />
                  <span className="text-foreground/60">{pr.baseRef}</span>
                  <span className="text-muted-foreground/40">←</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{pr.headRef}</span>
                </span>
              </div>

              {/* AI Walkthrough Summary — CodeRabbit/Sourcery style */}
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
                        <Badge variant="secondary" className="text-[9px] h-3.5 px-1 font-medium">
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

              {/* Severity Chips — Sourcery/CodeRabbit style */}
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

              {/* Category Tags from review */}
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
              <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                {/* Code Churn Bar */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1 text-xs font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{pr.additions}</span>
                    <span className="text-muted-foreground/50">/</span>
                    <span className="text-red-600 dark:text-red-400 font-semibold">-{pr.deletions}</span>
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

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <a href={pr.htmlUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs gap-1.5">
                      <ExternalLink className="size-3.5" />
                      GitHub
                    </Button>
                  </a>
                  <Link href={`/repo/${repositoryId}/pr/${pr.number}`}>
                    <Button
                      size="sm"
                      className={cn(
                        "h-8 px-3 text-xs gap-1.5 transition-all",
                        hasCompletedReview
                          ? "variant-outline border-primary/20 hover:bg-primary/5"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/25",
                      )}
                      variant={hasCompletedReview ? "outline" : "default"}
                    >
                      {pr.review?.status === "PROCESSING" ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Analyzing…
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
  };

  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className={cn("size-3", config.spin && "animate-spin")} />
      {config.label}
    </Badge>
  );
}
