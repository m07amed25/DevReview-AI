"use client";

import { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle,
  Loader2,
  Sparkles,
  GitBranch,
  ArrowRight,
  Wand2,
  ScanSearch,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiffViewer } from "@/components/diff-viewer";
import { ReviewResult } from "@/components/review-result";
import { CollaborativeReview } from "@/components/collaborative-review";
import { useSession } from "@/lib/auth-client";

type PageProps = {
  params: Promise<{
    id: string;
    prNumber: string;
  }>;
};

export default function PullRequestPage({ params }: PageProps) {
  const { id, prNumber } = use(params);
  const prNum = parseInt(prNumber, 10);
  const [activeTab, setActiveTab] = useState<"review" | "files" | "discussion">(
    "files",
  );

  const { data: session } = useSession();

  const pr = trpc.pullRequest.get.useQuery(
    {
      repositoryId: id,
      prNumber: prNum,
    },
    {
      enabled: !!id && !isNaN(prNum),
    },
  );

  const files = trpc.pullRequest.files.useQuery(
    {
      repositoryId: id,
      prNumber: prNum,
    },
    {
      enabled: !!id && !isNaN(prNum),
    },
  );

  const createdAt = pr.data?.createdAt;
  const timeAgo = useMemo(() => {
    const date = createdAt ? new Date(createdAt) : null;
    if (!date) return null;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
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

  // Track when polling started to enforce a max polling duration (5 min)
  const MAX_POLL_DURATION_MS = 5 * 60 * 1000;
  const pollStartRef = useRef<number | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  const latestReview = trpc.review.getLatestForPR.useQuery(
    {
      repositoryId: id,
      prNumber: prNum,
    },
    {
      enabled: !!id && !isNaN(prNum),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "PROCESSING" || status === "PENDING") {
          // Start tracking poll time on first poll
          if (pollStartRef.current === null) {
            pollStartRef.current = Date.now();
          }
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


  const triggerReview = trpc.review.trigger.useMutation({
    onSuccess: () => {
      // Reset poll timer and timeout state for the new review
      pollStartRef.current = Date.now();
      setPollTimedOut(false);
      latestReview.refetch();
      pr.refetch();
    },
  });

  const isReviewing =
    !pollTimedOut &&
    (latestReview.data?.status === "PROCESSING" ||
      latestReview.data?.status === "PENDING");

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
            <Button variant={"outline"}>
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
      {/* ── Header section ── */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Link href={`/repo/${id}`} className="shrink-0 mt-0.5 sm:mt-1">
          <Button
            variant={"outline"}
            size={"icon"}
            className="size-9 sm:size-10 transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Title row */}
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
                variant={"outline"}
                size={"sm"}
              >
                <ExternalLink className="size-4" />
                <span>View on GitHub</span>
              </Button>
            </a>
          </div>

          {/* Meta row: author + date */}
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

      {/* ── Branch & stats card ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Top row: Branch + Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:divide-x divide-border/60">
            {/* Branch info */}
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

            {/* Stats */}
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

          {/* Bottom row: Review status */}
          <div className="border-t border-border/60 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 bg-muted/30">
            <ReviewStatusBadge
              status={pollTimedOut ? "TIMED_OUT" : (latestReview.data?.status ?? null)}
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
                size={"sm"}
                onClick={() => {
                  triggerReview.mutate({
                    repositoryId: id,
                    prNumber: prNum,
                  });
                }}
                disabled={triggerReview.isPending}
                className="gap-1.5 h-auto py-1.5 px-3 text-xs"
              >
                {triggerReview.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Wand2 className="size-3.5" />
                )}
                {pollTimedOut ? "Retry Review" : latestReview.data ? "Re-run Review" : "Run AI Review"}
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
              latestReview.data?.status === "COMPLETED"
                ? Array.isArray(latestReview.data.comments)
                  ? latestReview.data.comments.length
                  : 0
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
              onRetry={() =>
                triggerReview.mutate({
                  repositoryId: id,
                  prNumber: prNum,
                })
              }
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
                  onClick={() =>
                    triggerReview.mutate({
                      repositoryId: id,
                      prNumber: prNum,
                    })
                  }
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

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "px-1.5 py-0.5 text-xs rounded-md tabular-nums",
            active
              ? "bg-foreground/10 text-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}

function StatItem({
  icon: Icon,
  value,
  label,
  colorClass,
  bgClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label?: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded-md", bgClass)}>
        <Icon className={cn("size-3.5", colorClass)} />
      </div>
      <div className="leading-tight">
        <p className={cn("text-sm font-semibold tabular-nums", colorClass)}>
          {value.toLocaleString()}
        </p>
        {label && (
          <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
            {label}
          </p>
        )}
      </div>
    </div>
  );
}

function PRStatusBadge({
  state,
  isMerged,
  draft,
}: {
  state: string;
  isMerged: boolean;
  draft: boolean;
}) {
  if (draft) {
    return (
      <Badge variant={"secondary"} className="gap-1">
        <Sparkles />
        Draft
      </Badge>
    );
  }

  if (isMerged) {
    return (
      <Badge
        variant={"secondary"}
        className="bg-purple-600/10 dark:text-purple-400 border-purple-600/20 border"
      >
        <GitMerge className="size-3" />
        Merged
      </Badge>
    );
  }

  if (state === "closed") {
    return (
      <Badge variant={"secondary"} className="gap-1">
        <XCircle className="size-3" />
        Closed
      </Badge>
    );
  }

  if (state === "open") {
    return (
      <Badge
        variant={"secondary"}
        className="bg-emerald-600/10 dark:text-emerald-400 border-emerald-600/20 border"
      >
        <GitMerge className="size-3" />
        Open
      </Badge>
    );
  }
}

function ReviewStatusBadge({
  status,
  completedAt,
}: {
  status: string | null;
  completedAt?: Date | null;
}) {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!status) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border bg-muted text-muted-foreground"
      >
        <Clock className="h-3 w-3" />
        Not reviewed
      </Badge>
    );
  }

  const config = {
    COMPLETED: {
      icon: CheckCircle,
      label: completedAt
        ? `AI Review completed · ${getTimeAgo(completedAt)}`
        : "AI Review completed",
      className:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    PROCESSING: {
      icon: Loader2,
      label: "Analyzing code…",
      className:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      spin: true,
    },
    PENDING: {
      icon: Clock,
      label: "Queued for review",
      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    FAILED: {
      icon: XCircle,
      label: "Review failed",
      className:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    TIMED_OUT: {
      icon: Clock,
      label: "Review timed out — tap retry",
      className:
        "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    },
  }[status] ?? {
    icon: Clock,
    label: "Not reviewed",
    className: "bg-muted text-muted-foreground",
  };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border whitespace-nowrap", config.className)}
    >
      <Icon className={cn("h-3 w-3", config.spin && "animate-spin")} />
      {config.label}
    </Badge>
  );
}
