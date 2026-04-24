"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  GitPullRequest,
  GitMerge,
  GitCommit,
  Clock,
  RefreshCw,
  XCircle,
  GitBranch,
  Globe,
  Lock,
  Search,
  Calendar,
  TrendingUp,
  Activity,
  ExternalLink,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { CodeTimeline } from "@/features/code-timeline";
import { PullRequestCard } from "./pull-request-card";

type PageProps = { params: Promise<{ id: string }> };

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
  const allPullRequests = trpc.pullRequest.list.useQuery(
    { repositoryId: id, state: "all" },
    { enabled: !!id },
  );

  const filteredPRs = useMemo(() => {
    if (!pullRequests.data) return [];
    if (!searchQuery.trim()) return pullRequests.data;
    const q = searchQuery.toLowerCase();
    return pullRequests.data.filter(
      (pr) =>
        pr.title.toLowerCase().includes(q) ||
        pr.author.login.toLowerCase().includes(q) ||
        pr.headRef.toLowerCase().includes(q) ||
        pr.baseRef.toLowerCase().includes(q),
    );
  }, [pullRequests.data, searchQuery]);

  const prCounts = {
    open: allPullRequests.data?.filter((pr) => pr.state === "open").length ?? 0,
    closed:
      allPullRequests.data?.filter((pr) => pr.state === "closed").length ?? 0,
    all: allPullRequests.data?.length ?? 0,
  };

  const stats = useMemo(() => {
    if (!allPullRequests.data?.length) return null;
    return {
      totalAdditions: allPullRequests.data.reduce(
        (s, pr) => s + pr.additions,
        0,
      ),
      totalDeletions: allPullRequests.data.reduce(
        (s, pr) => s + pr.deletions,
        0,
      ),
      totalFiles: allPullRequests.data.reduce(
        (s, pr) => s + pr.changedFiles,
        0,
      ),
    };
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

  const repo = repository.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/repo">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">
                {repo.name}
              </h1>
              <Badge variant="outline" className="gap-1">
                {repo.private ? (
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
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 mt-1"
            >
              {repo.fullName}
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => pullRequests.refetch()}
          disabled={pullRequests.isFetching}
        >
          <RefreshCw
            className={cn("size-4", pullRequests.isFetching && "animate-spin")}
          />
        </Button>
      </div>

      {/* Meta info */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="size-4" />
              Created {formatDate(repo.createdAt.toString())}
            </span>
            <span className="flex items-center gap-2">
              <RefreshCw className="size-4" />
              Updated {formatDate(repo.updatedAt.toString())}
            </span>
          </div>
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View on GitHub
            <ExternalLink className="size-3" />
          </a>
        </CardContent>
      </Card>

      {/* Stats Cards */}
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

      {/* Filters */}
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

      {/* PR List */}
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

    </div>
  );
}
