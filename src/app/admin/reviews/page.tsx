"use client";

import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  GitBranch,
  MoreHorizontal,
  Eye,
  Copy,
} from "lucide-react";

type StatusFilter = "ALL" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
type SortBy = "createdAt" | "riskScore" | "prNumber";
type SortOrder = "asc" | "desc";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "warning" | "info" | "destructive";
    icon: React.ElementType;
  }
> = {
  COMPLETED: { label: "Completed", variant: "success", icon: CheckCircle2 },
  PENDING: { label: "Pending", variant: "warning", icon: Clock },
  PROCESSING: { label: "Processing", variant: "info", icon: Loader2 },
  FAILED: { label: "Failed", variant: "destructive", icon: AlertCircle },
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "FAILED", label: "Failed" },
];

function RiskScoreBar({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-xs text-muted-foreground">—</span>;

  const color =
    score >= 70
      ? "bg-red-500"
      : score >= 40
        ? "bg-amber-500"
        : "bg-emerald-500";

  const textColor =
    score >= 70
      ? "text-red-600 dark:text-red-400"
      : score >= 40
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
        {score}
      </span>
    </div>
  );
}

function FeedbackIndicator({ feedbacks }: { feedbacks: { rating: number }[] }) {
  const ups = feedbacks.filter((f) => f.rating === 1).length;
  const downs = feedbacks.filter((f) => f.rating === -1).length;

  if (ups === 0 && downs === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {ups > 0 && (
        <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400">
          <ThumbsUp className="h-3 w-3" />
          {ups}
        </span>
      )}
      {downs > 0 && (
        <span className="inline-flex items-center gap-0.5 text-xs text-red-500 dark:text-red-400">
          <ThumbsDown className="h-3 w-3" />
          {downs}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;

  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon
        className={`h-3 w-3 ${status === "PROCESSING" ? "animate-spin" : ""}`}
      />
      {config.label}
    </Badge>
  );
}

function SortButton({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  field: SortBy;
  currentSort: SortBy;
  currentOrder: SortOrder;
  onSort: (field: SortBy) => void;
}) {
  const isActive = currentSort === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      {isActive ? (
        currentOrder === "desc" ? (
          <ChevronDown className="h-3 w-3 text-foreground" />
        ) : (
          <ChevronUp className="h-3 w-3 text-foreground" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

function ReviewExpandedRow({
  review,
}: {
  review: {
    summary?: string | null;
    error?: string | null;
    qualityMetrics?: unknown;
    prUrl: string;
  };
}) {
  const metrics = review.qualityMetrics as Record<string, number> | null;

  return (
    <div className="border-t bg-muted/30 px-6 py-4 space-y-3">
      {review.summary && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Summary
          </p>
          <p className="text-sm leading-relaxed line-clamp-4">
            {review.summary}
          </p>
        </div>
      )}

      {review.error && (
        <div>
          <p className="text-xs font-medium text-destructive mb-1">Error</p>
          <pre className="text-xs bg-destructive/5 border border-destructive/20 rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-mono">
            {review.error}
          </pre>
        </div>
      )}

      {metrics && Object.keys(metrics).length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Quality Metrics
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center gap-1.5 rounded-md bg-background border px-2.5 py-1"
              >
                <span className="text-xs text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className="text-xs font-semibold tabular-nums">
                  {typeof value === "number" ? value.toFixed(1) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <a
          href={review.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View on GitHub
        </a>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(inputVal);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputVal]);

  const { data, isLoading, refetch } = trpc.admin.getReviews.useQuery({
    page,
    limit: 20,
    status,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const deleteReview = trpc.admin.deleteReview.useMutation({
    onSuccess: () => void refetch(),
  });

  const handleStatusChange = (val: StatusFilter) => {
    setStatus(val);
    setPage(1);
    setExpandedId(null);
  };

  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const totalAll = useMemo(() => {
    if (!data?.statusBreakdown) return 0;
    const b = data.statusBreakdown;
    return b.COMPLETED + b.PENDING + b.PROCESSING + b.FAILED;
  }, [data?.statusBreakdown]);

  const getTabCount = (tab: StatusFilter) => {
    if (!data?.statusBreakdown) return undefined;
    if (tab === "ALL") return totalAll;
    return data.statusBreakdown[tab];
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ─── Header ─── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">
            Manage and inspect all PR reviews across the platform
          </p>
        </div>

        {/* ─── Search + Sort controls ─── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="review-search"
              placeholder="Search PR title, repo, or user…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="pl-9"
            />
          </div>
          {inputVal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setInputVal("");
                setSearch("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* ─── Status Tabs ─── */}
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.value;
            const count = getTabCount(tab.value);
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusChange(tab.value)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {count !== undefined && (
                  <span
                    className={`tabular-nums text-xs ${
                      isActive
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Table Card ─── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Review List</CardTitle>
                <CardDescription>
                  {data ? (
                    <>
                      Showing {Math.min((page - 1) * 20 + 1, data.total)}–
                      {Math.min(page * 20, data.total)} of {data.total} reviews
                    </>
                  ) : (
                    "Loading…"
                  )}
                </CardDescription>
              </div>
              <div className="hidden items-center gap-4 sm:flex">
                <SortButton
                  label="Date"
                  field="createdAt"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortButton
                  label="Risk"
                  field="riskScore"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortButton
                  label="PR #"
                  field="prNumber"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            {isLoading ? (
              <div className="space-y-px">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {data?.reviews.map((review) => {
                  const isExpanded = expandedId === review.id;

                  return (
                    <div key={review.id}>
                      <div
                        className={`flex items-center gap-4 px-6 py-4 transition-colors cursor-pointer hover:bg-muted/30 ${
                          isExpanded ? "bg-muted/20" : ""
                        }`}
                        onClick={() =>
                          setExpandedId(isExpanded ? null : review.id)
                        }
                      >
                        {/* User Avatar */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 shrink-0">
                              {review.user.image && (
                                <AvatarImage
                                  src={review.user.image}
                                  alt={review.user.name ?? ""}
                                />
                              )}
                              <AvatarFallback className="text-xs">
                                {(review.user.name ?? review.user.email)
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{review.user.name ?? review.user.email}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* PR Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-sm">
                              {review.prTitle ?? `PR #${review.prNumber}`}
                            </p>
                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                              #{review.prNumber}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="truncate max-w-[200px]">
                              {review.repository.fullName}
                            </span>
                            <span className="text-border">·</span>
                            <span>
                              {new Date(review.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            {review._count.threads > 0 && (
                              <>
                                <span className="text-border">·</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <MessageSquare className="h-3 w-3" />
                                  {review._count.threads}
                                </span>
                              </>
                            )}
                            {review._count.childReviews > 0 && (
                              <>
                                <span className="text-border">·</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <GitBranch className="h-3 w-3" />
                                  {review._count.childReviews} re-review
                                  {review._count.childReviews > 1 ? "s" : ""}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Feedback */}
                        <div className="hidden lg:block">
                          <FeedbackIndicator feedbacks={review.feedbacks} />
                        </div>

                        {/* Risk Score */}
                        <div className="hidden sm:block">
                          <RiskScoreBar score={review.riskScore} />
                        </div>

                        {/* Status */}
                        <StatusBadge status={review.status} />

                        {/* Expand indicator */}
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={review.repository.private}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(review.prUrl, "_blank");
                              }}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View on GitHub
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  `/repo/${review.repository.id}/review/${review.id}`,
                                  "_blank",
                                );
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Review
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                void navigator.clipboard.writeText(review.id);
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Review
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent
                                onClick={(e) => e.stopPropagation()}
                              >
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete review?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Permanently delete review for{" "}
                                    <strong>
                                      {review.prTitle ??
                                        `PR #${review.prNumber}`}
                                    </strong>{" "}
                                    in{" "}
                                    <strong>
                                      {review.repository.fullName}
                                    </strong>
                                    . This will also remove all associated
                                    threads, feedback, and GitHub comments. This
                                    action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() =>
                                      deleteReview.mutate({
                                        reviewId: review.id,
                                      })
                                    }
                                  >
                                    {deleteReview.isPending
                                      ? "Deleting…"
                                      : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Expanded detail panel */}
                      {isExpanded && <ReviewExpandedRow review={review} />}
                    </div>
                  );
                })}

                {data?.reviews.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No reviews found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search
                        ? "Try adjusting your search or filters"
                        : "No reviews match the current filter"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Pagination ─── */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {data.pages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
