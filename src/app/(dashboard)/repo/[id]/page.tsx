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
  Clock,
  Plus,
  Minus,
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
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

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
    open: pullRequests.data?.filter((pr) => pr.state === "open").length ?? 0,
    closed:
      pullRequests.data?.filter((pr) => pr.state === "closed").length ?? 0,
    all: pullRequests.data?.length ?? 0,
  };

  const stats = useMemo(() => {
    if (!pullRequests.data || pullRequests.data.length === 0) return null;
    const totalAdditions = pullRequests.data.reduce(
      (sum, pr) => sum + pr.additions,
      0,
    );
    const totalDeletions = pullRequests.data.reduce(
      (sum, pr) => sum + pr.deletions,
      0,
    );
    const totalFiles = pullRequests.data.reduce(
      (sum, pr) => sum + pr.changedFiles,
      0,
    );
    return { totalAdditions, totalDeletions, totalFiles };
  }, [pullRequests.data]);

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
          <Link href="/repos" className="mt-6 inline-block">
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
          <Link href={"/repos"}>
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
    review: { status: string; createdAt: Date } | null;
  };
  repositoryId: string;
}

function PullRequestCard({ pr, repositoryId }: PullRequestCardProps) {
  const isMerged = pr.state === "closed" && pr.mergedAt !== null;

  return (
    <Card className="group hover:border-border transition-all duration-200 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="mt-1">
              {isMerged ? (
                <GitMerge className="size-5 text-purple-500" />
              ) : pr.state === "closed" ? (
                <XCircle className="size-5 text-red-500" />
              ) : (
                <GitPullRequest className="size-5 text-emerald-500" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/repos/${repositoryId}/pr/${pr.number}`}
                  className="font-medium hover:text-primary transition-colors line-clamp-1 text-base"
                >
                  {pr.title}
                </Link>
                {pr.draft && (
                  <Badge variant={"secondary"} className="text-xs">
                    Draft
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-x-4 gap-y-2 text-sm text-muted-foreground flex-wrap">
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                  #{pr.number}
                </span>
                <span className="flex items-center gap-1.5">
                  <Avatar className="size-5 ring-1 ring-border">
                    <AvatarImage
                      src={pr.author.avatarUrl}
                      alt={pr.author.login}
                    />
                    <AvatarFallback className="text-[10px]">
                      {pr.author.login?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">
                    {pr.author.login}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {formatDate(pr.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm pt-1">
                <code className="px-2.5 py-1 rounded-md bg-muted/50 text-xs font-mono text-muted-foreground flex items-center truncate border border-border/50">
                  <GitBranch className="mr-1.5 size-3 text-muted-foreground/70" />
                  {pr.baseRef}
                  <ArrowLeft className="mx-2 size-3 text-muted-foreground/50" />
                  {pr.headRef}
                </code>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Plus className="size-3.5" />
                    <span className="tabular-nums">{pr.additions}</span>
                  </span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                    <Minus className="size-3.5" />
                    <span className="tabular-nums">{pr.deletions}</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="size-3.5" />
                    <span className="tabular-nums">{pr.changedFiles}</span>
                    <span className="text-xs">files</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {pr.review && <ReviewStatusBadge status={pr.review.status} />}
            <Link href={`/repos/${repositoryId}/pr/${pr.number}`}>
              <Button
                variant={pr.review ? "outline" : "default"}
                size="sm"
                className="min-w-[80px]"
              >
                {pr.review ? "View" : "Review"}
              </Button>
            </Link>
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
