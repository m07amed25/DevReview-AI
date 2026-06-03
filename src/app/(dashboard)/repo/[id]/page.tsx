"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { usePrivateChannel } from "@/lib/pusher/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  GitPullRequest,
  GitMerge,
  GitCommit,
  RefreshCw,
  XCircle,
  GitBranch,
  Globe,
  Lock,
  Search,
  ExternalLink,
  Database,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeTimeline } from "@/features/code-timeline";
import { DiagramPanel } from "@/features/review/components/diagram-panel";
import { PullRequestCard } from "@/features/repo/components/pull-request-card";
import { AutoReviewToggle } from "@/features/settings/components/auto-review-toggle";
import { BranchProtectionCard } from "@/features/repo/components/branch-protection-card";
import { RulesManagerCard } from "@/features/settings/components/rules-manager-card";

type PageProps = { params: Promise<{ id: string }> };

export default function RepositoryDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [prState, setPrState] = useState<"open" | "closed" | "all">("open");
  const [searchQuery, setSearchQuery] = useState("");

  const repository = trpc.repository.list.useQuery(undefined, {
    select: (repos) => repos.find((r) => r.id === id),
  });

  const allPullRequests = trpc.pullRequest.list.useQuery(
    { repositoryId: id, state: "all" },
    {
      enabled: !!id,
      refetchInterval: (query) => {
        const { data } = query.state;
        if (data?.some((pr) => pr.review?.status === "PROCESSING" || pr.review?.status === "PENDING")) return 3000;
        return false;
      },
    },
  );

  const utils = trpc.useUtils();
  const hasEntityFiles = trpc.diagram.hasEntityFiles.useQuery(
    { repositoryId: id },
    { enabled: !!id, staleTime: 5 * 60 * 1000 },
  );

  const diagrams = trpc.diagram.listForRepository.useQuery(
    { repositoryId: id },
    {
      enabled: !!id && hasEntityFiles.data !== false,
      refetchInterval: (query) => {
        const { data } = query.state;
        if (data?.some((d) => d.status === "PENDING")) return 3000;
        return false;
      },
    },
  );

  const requestDiagram = trpc.diagram.requestDiagram.useMutation({
    onSuccess: () => void diagrams.refetch(),
  });

  usePrivateChannel<{ diagramId: string; status: string }>(
    id ? `private-repository-${id}` : null,
    "diagram.updated",
    () => { void utils.diagram.listForRepository.invalidate({ repositoryId: id }); },
  );

  const filteredPRs = useMemo(() => {
    const source = allPullRequests.data ?? [];
    const byState = prState === "all" ? source : source.filter((pr) => pr.state === prState);
    if (!searchQuery.trim()) return byState;
    const q = searchQuery.toLowerCase();
    return byState.filter((pr) =>
      pr.title.toLowerCase().includes(q) || pr.author.login.toLowerCase().includes(q) ||
      pr.headRef.toLowerCase().includes(q) || pr.baseRef.toLowerCase().includes(q),
    );
  }, [allPullRequests.data, prState, searchQuery]);

  const prCounts = {
    open: allPullRequests.data?.filter((pr) => pr.state === "open").length ?? 0,
    closed: allPullRequests.data?.filter((pr) => pr.state === "closed").length ?? 0,
    all: allPullRequests.data?.length ?? 0,
  };

  const stats = useMemo(() => {
    if (!allPullRequests.data?.length) return null;
    return {
      additions: allPullRequests.data.reduce((s, pr) => s + pr.additions, 0),
      deletions: allPullRequests.data.reduce((s, pr) => s + pr.deletions, 0),
      files: allPullRequests.data.reduce((s, pr) => s + pr.changedFiles, 0),
    };
  }, [allPullRequests.data]);

  if (repository.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        </div>
      </div>
    );
  }

  if (!repository.data) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto size-10 rounded-md bg-muted flex items-center justify-center mb-3">
          <GitBranch className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Repository not found</p>
        <p className="text-xs text-muted-foreground mt-1">This repository may have been disconnected.</p>
        <Link href="/repo" className="mt-4 inline-block">
          <Button variant="outline" size="sm"><ArrowLeft className="size-3.5 mr-1.5" />Back to repositories</Button>
        </Link>
      </div>
    );
  }

  const repo = repository.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/repo">
            <Button variant="outline" size="icon" className="size-8 shrink-0">
              <ArrowLeft className="size-3.5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight">{repo.name}</h1>
              <Badge variant="outline" className="gap-1 text-xs">
                {repo.private ? <><Lock className="size-3" />Private</> : <><Globe className="size-3" />Public</>}
              </Badge>
            </div>
            <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mt-0.5">
              {repo.fullName}<ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => allPullRequests.refetch()} disabled={allPullRequests.isFetching} className="shrink-0 h-8 w-8 p-0">
          <RefreshCw className={cn("size-3.5", allPullRequests.isFetching && "animate-spin")} />
        </Button>
      </div>

      {/* Inline stats (compact, not hero cards) */}
      {stats && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-mono"><span className="text-emerald-500">+{stats.additions}</span> <span className="text-destructive">-{stats.deletions}</span></span>
          <span className="font-mono">{stats.files} files</span>
          <span className="font-mono">{prCounts.all} PRs</span>
        </div>
      )}

      {/* PR filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="border-b border-border w-full">
          <div className="flex items-center gap-0.5">
            {(["open", "closed", "all"] as const).map((state) => (
              <button
                key={state}
                onClick={() => setPrState(state)}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  prState === state ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="flex items-center gap-1.5">
                  {state === "open" && <GitPullRequest className="size-3.5 text-emerald-500" />}
                  {state === "closed" && <GitMerge className="size-3.5 text-purple-500" />}
                  {state === "all" && <GitBranch className="size-3.5" />}
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                  <span className={cn("font-mono text-xs tabular-nums", prState === state ? "text-foreground" : "text-muted-foreground")}>{prCounts[state]}</span>
                </span>
                {prState === state && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input placeholder="Search PRs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>
      </div>

      {/* PR List */}
      <div className="space-y-2">
        {allPullRequests.isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)
        ) : allPullRequests.error ? (
          <div className="py-12 text-center border border-destructive/30 rounded-md">
            <div className="mx-auto size-10 rounded-md bg-destructive/10 flex items-center justify-center mb-3">
              <XCircle className="size-5 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">Failed to load pull requests</p>
            <p className="text-xs text-muted-foreground mt-1">{allPullRequests.error?.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => allPullRequests.refetch()}>
              <RefreshCw className="size-3.5 mr-1.5" />Retry
            </Button>
          </div>
        ) : filteredPRs.length === 0 ? (
          <div className="py-12 text-center border border-border rounded-md">
            <div className="mx-auto size-10 rounded-md bg-muted flex items-center justify-center mb-3">
              <GitPullRequest className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{searchQuery ? "No matching pull requests" : "No pull requests"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? `No results for "${searchQuery}"` : prState === "all" ? "This repository has no pull requests yet." : `No ${prState} pull requests.`}
            </p>
            {searchQuery && <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSearchQuery("")}>Clear search</Button>}
          </div>
        ) : (
          filteredPRs.map((pr) => <PullRequestCard key={pr.id} pr={pr} repositoryId={id} />)
        )}
      </div>

      {/* Settings & Tools */}
      <Tabs defaultValue="automation" className="mt-2">
        <TabsList>
          <TabsTrigger value="automation" className="gap-1.5 text-sm">
            <GitBranch className="size-3.5" />Automation
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5 text-sm">
            <ShieldCheck className="size-3.5" />Rules
          </TabsTrigger>
          {hasEntityFiles.data !== false && (
            <TabsTrigger value="entity" className="gap-1.5 text-sm">
              <Database className="size-3.5" />Entity
            </TabsTrigger>
          )}
          <TabsTrigger value="history" className="gap-1.5 text-sm">
            <GitCommit className="size-3.5" />History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AutoReviewToggle repositoryId={id} repoFullName={repo.fullName ?? undefined} />
            <BranchProtectionCard repositoryId={id} repoFullName={repo.fullName ?? undefined} />
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <RulesManagerCard repositoryId={id} />
        </TabsContent>

        {hasEntityFiles.data !== false && (
          <TabsContent value="entity" className="mt-4">
            <DiagramPanel diagrams={diagrams.data ?? []} repositoryId={id} onRequestDiagram={(type) => requestDiagram.mutate({ repositoryId: id, type })} />
          </TabsContent>
        )}

        <TabsContent value="history" className="mt-4">
          <CodeTimeline repositoryId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
