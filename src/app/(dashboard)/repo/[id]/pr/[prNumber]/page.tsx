"use client";

import { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  GitPullRequest,
  GitMerge,
  ExternalLink,
  Clock,
  Plus,
  Minus,
  FileText,
  XCircle,
  Loader2,
  Sparkles,
  GitBranch,
  ArrowRight,
  Wand2,
  ScanSearch,
  MessageCircle,
  Network,
  ArrowLeftRight,
  History,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiffViewer } from "@/features/diff-viewer";
import { ReviewResult } from "@/features/review";
import { CollaborativeReview } from "@/features/collaborative-review";
import { DiagramPanel } from "@/features/review/components/diagram-panel";
import { ReviewDiffPanel } from "@/features/review/components/review-diff-panel";
import { useSession } from "@/lib/auth-client";
import { usePrivateChannel } from "@/lib/pusher/client";
import {
  TabButton,
  StatItem,
  PRStatusBadge,
  ReviewStatusBadge,
} from "@/features/repo/utils/pr-helpers";

type PageProps = { params: Promise<{ id: string; prNumber: string }> };

export default function PullRequestPage({ params }: PageProps) {
  const { id, prNumber } = use(params);
  const prNum = parseInt(prNumber, 10);
  const [activeTab, setActiveTab] = useState<
    "review" | "files" | "discussion" | "diagrams" | "compare"
  >("files");
  const [compareCurrentId, setCompareCurrentId] = useState<string | null>(null);
  const [comparePreviousId, setComparePreviousId] = useState<string | null>(
    null,
  );
  const { data: session } = useSession();

  const pr = trpc.pullRequest.get.useQuery(
    { repositoryId: id, prNumber: prNum },
    { enabled: !!id && !isNaN(prNum) },
  );
  const files = trpc.pullRequest.files.useQuery(
    { repositoryId: id, prNumber: prNum },
    { enabled: !!id && !isNaN(prNum) },
  );

  const createdAt = pr.data?.createdAt;
  const timeAgo = useMemo(() => {
    const date = createdAt ? new Date(createdAt) : null;
    if (!date) return null;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 5) return `${diffWeeks}w ago`;
    return `${diffMonths}mo ago`;
  }, [createdAt]);

  const MAX_POLL_DURATION_MS = 5 * 60 * 1000;
  const pollStartRef = useRef<number | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  const latestReview = trpc.review.getLatestForPR.useQuery(
    { repositoryId: id, prNumber: prNum },
    {
      enabled: !!id && !isNaN(prNum),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "PROCESSING" || status === "PENDING") {
          if (pollStartRef.current === null) pollStartRef.current = Date.now();
          if (Date.now() - pollStartRef.current > MAX_POLL_DURATION_MS) {
            pollStartRef.current = null;
            setPollTimedOut(true);
            return false;
          }
          return 3000;
        }
        pollStartRef.current = null;
        setPollTimedOut(false);
        return false;
      },
    },
  );

  const reviewHistory = trpc.review.listHistoryForPR.useQuery(
    { repositoryId: id, prNumber: prNum },
    { enabled: !!id && !isNaN(prNum) },
  );

  const completedReviews = (reviewHistory.data ?? []).filter(
    (r) => r.status === "COMPLETED",
  );

  const triggerReview = trpc.review.trigger.useMutation({
    onSuccess: () => {
      pollStartRef.current = Date.now();
      setPollTimedOut(false);
      latestReview.refetch();
      reviewHistory.refetch();
      pr.refetch();
    },
  });

  const triggerReReview = () => {
    const parentId = latestReview.data?.id;
    triggerReview.mutate({
      repositoryId: id,
      prNumber: prNum,
      parentReviewId: parentId ?? undefined,
    });
  };

  const isReviewing =
    !pollTimedOut &&
    (latestReview.data?.status === "PROCESSING" ||
      latestReview.data?.status === "PENDING");

  const reviewId = latestReview.data?.id;
  const utils = trpc.useUtils();

  const diagrams = trpc.diagram.listForRepository.useQuery(
    { repositoryId: id },
    {
      enabled: !!id,
      // Poll while any diagram is still generating (Pusher fallback)
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

  // Pusher: invalidate and refetch the full diagram list so definition/nodes/edges are fresh
  usePrivateChannel<{ diagramId: string; status: string }>(
    id ? `private-repository-${id}` : null,
    "diagram.updated",
    () => {
      void utils.diagram.listForRepository.invalidate({ repositoryId: id });
    },
  );

  if (pr.isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <Skeleton className="size-9 sm:size-10 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-2 min-w-0 flex-1">
                <Skeleton className="h-7 w-full max-w-md" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-md shrink-0" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <Skeleton className="h-20 sm:h-24 w-full rounded-xl" />
        <Skeleton className="h-48 sm:h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (pr.isError || !pr.data) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="size-6 text-destructive" />
          </div>
          <p className="mt-4 font-medium text-destructive">
            {pr.error?.message || "Failed to load pull request data."}
          </p>
          <Link href={`/repo/${id}`} className="mt-6 inline-block">
            <Button variant="outline">
              <ArrowLeft className="size-4 mr-2" />
              Back to Repository
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isMerged = pr.data.state === "closed" && pr.data.mergedAt;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Link href={`/repo/${id}`} className="shrink-0 mt-0.5 sm:mt-1">
          <Button
            variant="outline"
            size="icon"
            className="size-9 sm:size-10 transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div
                  className={cn(
                    "p-1.5 sm:p-2 rounded-lg shrink-0 mt-0.5",
                    isMerged
                      ? "bg-purple-500/10"
                      : pr.data.state === "closed"
                        ? "bg-red-500/10"
                        : "bg-emerald-500/10",
                  )}
                >
                  {isMerged ? (
                    <GitMerge className="size-4 sm:size-5 text-purple-500" />
                  ) : pr.data.state === "closed" ? (
                    <XCircle className="size-4 sm:size-5 text-red-500" />
                  ) : (
                    <GitPullRequest className="size-4 sm:size-5 text-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-semibold tracking-tight leading-snug wrap-break-word">
                    {pr.data.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <PRStatusBadge
                      state={pr.data.state}
                      isMerged={!!isMerged}
                      draft={pr.data.draft}
                    />
                    <span className="text-sm text-muted-foreground font-mono">
                      #{pr.data.number}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <a
              href={pr.data.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 self-start"
            >
              <Button
                className="gap-2 w-full sm:w-auto transition-transform hover:scale-105 active:scale-95"
                variant="outline"
                size="sm"
              >
                <ExternalLink className="size-4" />
                <span>View on GitHub</span>
              </Button>
            </a>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-2">
              <Avatar className="size-5 ring-1 ring-border">
                <AvatarImage src={pr.data.author.avatarUrl} />
                <AvatarFallback className="text-[10px]">
                  {pr.data.author.login.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">
                {pr.data.author.login}
              </span>
            </span>
            {timeAgo && (
              <>
                <span className="text-muted-foreground/30 select-none">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>opened {timeAgo}</span>
                </span>
              </>
            )}
            {pr.data.mergedAt && (
              <>
                <span className="text-muted-foreground/30 select-none">•</span>
                <span className="flex items-center gap-1.5">
                  <GitMerge className="size-3.5 text-purple-500" />
                  <span>merged</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Branch & Stats Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:divide-x divide-border/60">
            <div className="flex-1 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-muted shrink-0">
                  <GitBranch className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    Merge direction
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-sm flex-wrap">
                    <code className="px-1.5 sm:px-2 py-0.5 rounded bg-secondary font-mono text-xs truncate max-w-32 sm:max-w-48">
                      {pr.data.headRef}
                    </code>
                    <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                    <code className="px-1.5 sm:px-2 py-0.5 rounded bg-secondary font-mono text-xs truncate max-w-32 sm:max-w-48">
                      {pr.data.baseRef}
                    </code>
                  </div>
                </div>
              </div>
            </div>
            <Separator className="sm:hidden" />
            <div className="flex items-center justify-around sm:justify-start gap-4 sm:gap-6 px-3 sm:px-6 py-3 sm:py-4 shrink-0">
              <StatItem
                icon={Plus}
                value={pr.data.additions}
                label="Added"
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-500/10"
              />
              <StatItem
                icon={Minus}
                value={pr.data.deletions}
                label="Removed"
                colorClass="text-red-600 dark:text-red-400"
                bgClass="bg-red-500/10"
              />
              <StatItem
                icon={FileText}
                value={pr.data.changedFiles}
                label="Files"
                colorClass="text-muted-foreground"
                bgClass="bg-muted"
              />
            </div>
          </div>
          <div className="border-t border-border/60 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 bg-muted/30">
            <ReviewStatusBadge
              status={
                pollTimedOut ? "TIMED_OUT" : (latestReview.data?.status ?? null)
              }
              completedAt={
                latestReview.data?.status === "COMPLETED"
                  ? latestReview.data.createdAt
                  : null
              }
            />
            {isReviewing ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                <span>Working…</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={triggerReReview}
                disabled={triggerReview.isPending}
                className="gap-1.5 h-auto py-1.5 px-3 text-xs"
              >
                {triggerReview.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : latestReview.data ? (
                  <RefreshCw className="size-3.5" />
                ) : (
                  <Wand2 className="size-3.5" />
                )}
                {pollTimedOut
                  ? "Retry Review"
                  : latestReview.data
                    ? "Re-review"
                    : "Run AI Review"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border/60">
        <div className="flex items-center gap-1">
          <TabButton
            active={activeTab === "review"}
            onClick={() => setActiveTab("review")}
            icon={ScanSearch}
            label="Review"
            count={
              latestReview.data?.status === "COMPLETED" &&
              Array.isArray(latestReview.data.comments)
                ? latestReview.data.comments.length
                : 0
            }
          />
          <TabButton
            active={activeTab === "files"}
            onClick={() => setActiveTab("files")}
            icon={FileText}
            label="Files changed"
            count={files.data?.length ?? 0}
          />
          <TabButton
            active={activeTab === "discussion"}
            onClick={() => setActiveTab("discussion")}
            icon={MessageCircle}
            label="Discussion"
          />
          {completedReviews.length >= 2 && (
            <TabButton
              active={activeTab === "compare"}
              onClick={() => {
                setActiveTab("compare");
                // Auto-select the two most recent completed reviews
                if (!compareCurrentId && completedReviews.length >= 2) {
                  setCompareCurrentId(completedReviews[0].id);
                  setComparePreviousId(completedReviews[1].id);
                }
              }}
              icon={ArrowLeftRight}
              label="Compare"
            />
          )}
          <TabButton
            active={activeTab === "diagrams"}
            onClick={() => setActiveTab("diagrams")}
            icon={Network}
            label="Diagrams"
            count={diagrams.data?.length ?? 0}
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "files" && (
        <div>
          {files.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : files.error ? (
            <Card className="border-destructive/50">
              <CardContent className="py-12 text-center">
                <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="size-6 text-destructive" />
                </div>
                <p className="mt-4 font-medium text-destructive">
                  No files changed.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {files.error?.message || "Failed to load changed files."}
                </p>
              </CardContent>
            </Card>
          ) : files.data && files.data.length > 0 ? (
            <DiffViewer files={files.data} />
          ) : null}
        </div>
      )}
      {activeTab === "review" && (
        <div>
          {latestReview.data ? (
            <ReviewResult
              review={latestReview.data}
              onRetry={triggerReReview}
              isRetrying={triggerReview.isPending}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 sm:py-20 text-center flex flex-col items-center">
                <div className="relative mx-auto mb-6">
                  <div className="size-16 sm:size-20 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/5">
                    <ScanSearch className="size-8 sm:size-10 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <Sparkles className="size-3 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">
                  No reviews yet
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Run an AI-powered review to get instant feedback on code
                  quality, potential bugs, and suggested improvements.
                </p>
                <Button
                  className="mt-6 gap-2 transition-transform hover:scale-105 active:scale-95"
                  onClick={triggerReReview}
                  disabled={triggerReview.isPending || isReviewing}
                >
                  {triggerReview.isPending || isReviewing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Wand2 className="size-4" />
                  )}
                  {triggerReview.isPending || isReviewing
                    ? "Starting review…"
                    : "Run AI Review"}
                </Button>
                <p className="mt-3 text-xs text-muted-foreground/60">
                  Typically completes in under a minute
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {activeTab === "compare" && (
        <div className="space-y-4">
          {/* Review History Timeline + Selector */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <History className="size-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">
                    Review History
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Select two reviews to compare
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Current (newer) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Current (newer)
                  </label>
                  <select
                    value={compareCurrentId ?? ""}
                    onChange={(e) =>
                      setCompareCurrentId(e.target.value || null)
                    }
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select review…</option>
                    {completedReviews.map((r) => (
                      <option key={r.id} value={r.id}>
                        {new Date(r.createdAt).toLocaleString()} — Risk:{" "}
                        {r.riskScore ?? "N/A"}
                        {r.parentReviewId ? " (re-review)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Previous (older) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Previous (older)
                  </label>
                  <select
                    value={comparePreviousId ?? ""}
                    onChange={(e) =>
                      setComparePreviousId(e.target.value || null)
                    }
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select review…</option>
                    {completedReviews
                      .filter((r) => r.id !== compareCurrentId)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {new Date(r.createdAt).toLocaleString()} — Risk:{" "}
                          {r.riskScore ?? "N/A"}
                          {r.parentReviewId ? " (re-review)" : ""}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diff Panel */}
          {compareCurrentId && comparePreviousId ? (
            <ReviewDiffPanel
              reviewId={compareCurrentId}
              compareReviewId={comparePreviousId}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="size-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  Select two reviews above to see what changed
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {activeTab === "diagrams" && (
        <DiagramPanel
          diagrams={diagrams.data ?? []}
          repositoryId={id}
          onRequestDiagram={(type) =>
            requestDiagram.mutate({ repositoryId: id, prNumber: prNum, type })
          }
        />
      )}
      {activeTab === "discussion" && latestReview.data && session?.user && (
        <CollaborativeReview
          reviewId={latestReview.data.id}
          currentUserId={session.user.id}
          currentUserName={session.user.name}
          isAdmin={Boolean(pr.data?.isAdmin)}
          prFiles={files.data?.map((f) => f.filename) || []}
        />
      )}
      {activeTab === "discussion" && (!latestReview.data || !session?.user) && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageCircle className="size-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {!latestReview.data
                ? "Run an AI review first to start a discussion"
                : "Sign in to participate in discussions"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
