"use client";

import { useCallback, useTransition, useState } from "react";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
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
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ExternalLink,
  Inbox,
  Star,
  Bug,
  Lightbulb,
  Reply,
  Mail,
  CheckCheck,
  Clock,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type RatingFilter = 1 | -1 | 0;
type ActiveTab = "messages" | "reviews";

function parseCategoryFromMessage(message: string): {
  category: string | null;
  body: string;
} {
  const match = message.match(/^\[([^\]]+)\]\s*/);
  if (match)
    return { category: match[1], body: message.slice(match[0].length) };
  return { category: null, body: message };
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const map: Record<string, { icon: React.ReactNode; className: string }> = {
    "Bug Report": {
      icon: <Bug className="size-2.5" />,
      className: "bg-red-500/10 text-red-600 border-red-500/20",
    },
    Feature: {
      icon: <Lightbulb className="size-2.5" />,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    General: {
      icon: <MessageSquare className="size-2.5" />,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
  };
  const style = map[category] ?? {
    icon: <MessageSquare className="size-2.5" />,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.className}`}
    >
      {style.icon}
      {category}
    </span>
  );
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<ActiveTab>("messages");

  const page = Number(searchParams.get("page")) || 1;
  const rating = (Number(searchParams.get("rating")) || 0) as RatingFilter;

  const { data: reviewData, isLoading: reviewsLoading } =
    trpc.admin.getFeedbacks.useQuery(
      { page, limit: 20, rating },
      { enabled: activeTab === "reviews" },
    );

  const { data: messages, isLoading: messagesLoading } =
    trpc.admin.getSupportMessages.useQuery(undefined, {
      enabled: activeTab === "messages",
    });

  const utils = trpc.useUtils();

  const updateMutation = trpc.admin.updateSupportStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.admin.getSupportMessages.invalidate();
    },
    onError: () => toast.error("Failed to update status"),
  });

  const replyMutation = trpc.admin.replyToSupportMessage.useMutation({
    onSuccess: () => {
      toast.success("Reply sent successfully");
      setReplyTarget(null);
      setReplyText("");
      utils.admin.getSupportMessages.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to send reply"),
  });

  const [replyTarget, setReplyTarget] = useState<{
    id: string;
    email: string;
    message: string;
  } | null>(null);
  const [replyText, setReplyText] = useState("");

  const [, startTransition] = useTransition();

  const updateFilters = useCallback(
    (newPage: number, newRating: RatingFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) params.set("page", newPage.toString());
      else params.delete("page");
      if (newRating !== 0) params.set("rating", newRating.toString());
      else params.delete("rating");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, pathname, router],
  );

  const handleRatingChange = useCallback(
    (val: string) => updateFilters(1, Number(val) as RatingFilter),
    [updateFilters],
  );

  const pendingCount =
    messages?.filter((m) => m.status === "PENDING").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">
          User-submitted messages and PR review sentiment in one place.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        <button
          onClick={() => setActiveTab("messages")}
          className={[
            "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-all",
            activeTab === "messages"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <Inbox className="size-3.5" />
          User Messages
          {pendingCount > 0 && (
            <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={[
            "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-all",
            activeTab === "reviews"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <Star className="size-3.5" />
          PR Review Ratings
        </button>
      </div>

      {/* ── USER MESSAGES TAB ── */}
      {activeTab === "messages" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Inbox className="size-4" />
              Inbox
            </CardTitle>
            <CardDescription>
              Feedback submitted by users via the in-app feedback widget.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {messagesLoading ? (
              <div className="space-y-px">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-6 py-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-14 w-full" />
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-7 w-24" />
                      <Skeleton className="h-7 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="py-24 text-center space-y-3">
                <div className="inline-flex size-12 items-center justify-center rounded-full bg-muted">
                  <Inbox className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">No messages yet</p>
                  <p className="text-sm text-muted-foreground max-w-62.5 mx-auto">
                    Feedback submitted by users will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {messages.map((msg) => {
                  const { category, body } = parseCategoryFromMessage(
                    msg.message,
                  );
                  const isMsgPending = msg.status === "PENDING";
                  return (
                    <div
                      key={msg.id}
                      className="flex flex-col gap-3 p-6 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CategoryBadge category={category} />
                          {msg.email ? (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="size-3" />
                              {msg.email}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Anonymous
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                              isMsgPending
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                            ].join(" ")}
                          >
                            {isMsgPending ? (
                              <Clock className="size-2.5" />
                            ) : (
                              <CheckCheck className="size-2.5" />
                            )}
                            {msg.status}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted/30 px-4 py-3 rounded-lg border border-border/50 text-sm leading-relaxed text-foreground/80">
                        {body}
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        {msg.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() =>
                              setReplyTarget({
                                id: msg.id,
                                email: msg.email!,
                                message: msg.message,
                              })
                            }
                          >
                            <Reply className="size-3" />
                            Reply
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          disabled={updateMutation.isPending}
                          onClick={() =>
                            updateMutation.mutate({
                              id: msg.id,
                              status: isMsgPending ? "RESOLVED" : "PENDING",
                            })
                          }
                        >
                          {isMsgPending ? (
                            <>
                              <CheckCheck className="size-3" />
                              Mark Resolved
                            </>
                          ) : (
                            <>
                              <RotateCcw className="size-3" />
                              Reopen
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── PR REVIEW RATINGS TAB ── */}
      {activeTab === "reviews" && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Rating:
            </span>
            <Select
              value={rating.toString()}
              onChange={(e) => handleRatingChange(e.target.value)}
              className="w-40"
            >
              <option value="0">All Ratings</option>
              <option value="1">Helpful (Up)</option>
              <option value="-1">Not Helpful (Down)</option>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feedback Feed</CardTitle>
              <CardDescription>
                Showing {reviewData?.feedbacks.length ?? 0} of{" "}
                {reviewData?.total ?? 0} total entries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {reviewsLoading ? (
                <div className="space-y-px">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-6 py-8 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {reviewData?.feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="flex flex-col gap-4 p-6 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            {fb.user.image && (
                              <AvatarImage src={fb.user.image} />
                            )}
                            <AvatarFallback>
                              {fb.user.name?.charAt(0) ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">
                              {fb.user.name ?? "Anonymous User"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {fb.user.email}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              fb.rating === 1
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-red-500/10 text-red-600 border-red-500/20"
                            }`}
                          >
                            {fb.rating === 1 ? (
                              <ThumbsUp className="size-3 fill-current" />
                            ) : (
                              <ThumbsDown className="size-3 fill-current" />
                            )}
                            <span>
                              {fb.rating === 1 ? "Helpful" : "Not Helpful"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {fb.comment ? (
                          <div className="bg-muted/30 p-4 rounded-lg border border-border/50 italic text-sm text-foreground/80 leading-relaxed relative">
                            <MessageSquare className="size-4 absolute -top-2 -left-2 text-muted-foreground/30 fill-current" />
                            &quot;{fb.comment}&quot;
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No comment provided.
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Attached Review
                            </span>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/repo/${fb.review.repository.id}/pr/${fb.review.prNumber}`}
                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                              >
                                {fb.review.prTitle ||
                                  `PR #${fb.review.prNumber}`}
                                <ExternalLink className="size-2.5" />
                              </Link>
                              <span className="text-[10px] text-muted-foreground opacity-50">
                                ·
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {fb.review.repository.fullName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {reviewData?.feedbacks.length === 0 && (
                    <div className="py-24 text-center space-y-3">
                      <div className="inline-flex size-12 items-center justify-center rounded-full bg-muted">
                        <MessageSquare className="size-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold">No feedback yet</p>
                        <p className="text-sm text-muted-foreground max-w-62.5 mx-auto">
                          Author feedback will appear here once reviews are
                          rated.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {reviewData && reviewData.pages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => updateFilters(page - 1, rating)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {reviewData.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === reviewData.pages}
                onClick={() => updateFilters(page + 1, rating)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Reply dialog */}
      <Dialog
        open={!!replyTarget}
        onOpenChange={(open) => !open && setReplyTarget(null)}
      >
        <DialogContent className="sm:max-w-137.5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Reply to Feedback
            </DialogTitle>
            <DialogDescription>
              Sending an email reply to <strong>{replyTarget?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Original Message
              </Label>
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground max-h-32 overflow-y-auto italic">
                &quot;{replyTarget?.message}&quot;
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply-text" className="text-sm font-medium">
                Your Response
              </Label>
              <Textarea
                id="reply-text"
                placeholder="Type your reply here…"
                className="min-h-35 resize-none"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setReplyTarget(null)}
              disabled={replyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!replyTarget || !replyText.trim()) return;
                replyMutation.mutate({
                  id: replyTarget.id,
                  email: replyTarget.email,
                  replyMessage: replyText,
                });
              }}
              disabled={replyMutation.isPending || !replyText.trim()}
              className="gap-2"
            >
              {replyMutation.isPending ? (
                "Sending…"
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
