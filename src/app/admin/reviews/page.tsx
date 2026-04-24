"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
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
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

type StatusFilter = "ALL" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PROCESSING:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function RiskBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">—</span>;
  const color =
    score >= 70
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      : score >= 40
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {score}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const { data, isLoading, refetch } = trpc.admin.getReviews.useQuery({
    page,
    limit: 20,
    status,
  });

  const deleteReview = trpc.admin.deleteReview.useMutation({
    onSuccess: () => void refetch(),
  });

  const handleStatusChange = (val: string) => {
    setStatus(val as StatusFilter);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">
          All PR reviews — {data?.total ?? "…"} total
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Status:
        </span>
        <Select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-40"
        >
          <option value="ALL">All</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="FAILED">Failed</option>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review List</CardTitle>
          <CardDescription>
            Page {page} of {data?.pages ?? 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {data?.reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start gap-4 px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {review.prTitle ?? `PR #${review.prNumber}`}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{review.repository.fullName}</span>
                      <span>·</span>
                      <span>{review.user.name ?? review.user.email}</span>
                      <span>·</span>
                      <span>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <RiskBadge score={review.riskScore} />

                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[review.status] ?? ""}`}
                    >
                      {review.status}
                    </span>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          disabled={deleteReview.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete review?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Permanently delete review for{" "}
                            <strong>
                              {review.prTitle ?? `PR #${review.prNumber}`}
                            </strong>
                            . This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() =>
                              deleteReview.mutate({ reviewId: review.id })
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {data?.reviews.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No reviews found.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
