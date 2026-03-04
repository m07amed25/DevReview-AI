"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  PusherProvider,
  usePresenceChannel,
  useChannelEvent,
  useTypingIndicator,
  PUSHER_EVENTS,
  type PresenceMember,
} from "@/lib/pusher/client";
import { reviewChannel } from "@/server/pusher";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Send,
  CheckCircle2,
  RotateCcw,
  Trash2,
  FileCode2,
  Users,
  Wifi,
  WifiOff,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────
interface ThreadComment {
  id: string;
  content: string;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface Thread {
  id: string;
  file: string;
  line: number;
  resolved: boolean;
  createdAt: string | Date;
  comments: ThreadComment[];
}

interface CollaborativeReviewProps {
  reviewId: string;
  currentUserId: string;
  currentUserName: string;
}

// ─── Main Component (wrapped in PusherProvider) ────────────────────
export function CollaborativeReview(props: CollaborativeReviewProps) {
  return (
    <PusherProvider>
      <CollaborativeReviewInner {...props} />
    </PusherProvider>
  );
}

function CollaborativeReviewInner({
  reviewId,
  currentUserId,
  currentUserName,
}: CollaborativeReviewProps) {
  const channelName = reviewChannel(reviewId);
  const { members, myId } = usePresenceChannel(channelName);
  const { typingNames, triggerTyping } = useTypingIndicator(channelName);
  const [showResolved, setShowResolved] = useState(false);
  const [newThread, setNewThread] = useState<{
    file: string;
    line: number;
  } | null>(null);

  // Fetch threads
  const threadsQuery = trpc.collaboration.getThreads.useQuery(
    { reviewId },
    { refetchOnWindowFocus: false },
  );
  const threads: Thread[] = (threadsQuery.data ?? []) as Thread[];

  // ─── Real-time event handlers ──────────────────────────────────
  useChannelEvent<Thread>(channelName, PUSHER_EVENTS.THREAD_CREATED, () => {
    threadsQuery.refetch();
  });

  useChannelEvent(channelName, PUSHER_EVENTS.COMMENT_ADDED, () => {
    threadsQuery.refetch();
  });

  useChannelEvent(channelName, PUSHER_EVENTS.COMMENT_DELETED, () => {
    threadsQuery.refetch();
  });

  useChannelEvent(channelName, PUSHER_EVENTS.THREAD_RESOLVED, () => {
    threadsQuery.refetch();
  });

  useChannelEvent(channelName, PUSHER_EVENTS.THREAD_REOPENED, () => {
    threadsQuery.refetch();
  });

  const activeThreads = threads.filter((t) => !t.resolved);
  const resolvedThreads = threads.filter((t) => t.resolved);

  const otherMembers = members.filter((m) => m.id !== myId);

  return (
    <div className="space-y-4">
      {/* ── Header: Presence + Stats ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Discussion</h3>
              </div>
              <Badge variant="secondary" className="tabular-nums text-xs">
                {activeThreads.length} open
              </Badge>
              {resolvedThreads.length > 0 && (
                <Badge
                  variant="outline"
                  className="tabular-nums text-xs text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => setShowResolved((v) => !v)}
                >
                  <CheckCircle2 className="size-3 mr-1 text-emerald-500" />
                  {resolvedThreads.length} resolved
                </Badge>
              )}
            </div>

            {/* Presence Avatars */}
            <PresenceAvatars members={members} myId={myId} />
          </div>

          {/* Typing Indicator */}
          {typingNames.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <Circle
                    key={i}
                    className="size-1.5 fill-current"
                    style={{
                      animation: `typingDot 1.4s ease-in-out infinite`,
                      animationDelay: `${i * 160}ms`,
                    }}
                  />
                ))}
              </div>
              <span>
                {typingNames.length === 1
                  ? `${typingNames[0]} is typing…`
                  : `${typingNames.slice(0, -1).join(", ")} and ${typingNames[typingNames.length - 1]} are typing…`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── New Thread Button ── */}
      {!newThread && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full border-dashed"
          onClick={() => setNewThread({ file: "", line: 0 })}
        >
          <MessageCircle className="size-3.5" />
          Start a Discussion Thread
        </Button>
      )}

      {/* ── New Thread Form ── */}
      {newThread && (
        <NewThreadForm
          reviewId={reviewId}
          onCancel={() => setNewThread(null)}
          onCreated={() => {
            setNewThread(null);
            threadsQuery.refetch();
          }}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          triggerTyping={triggerTyping}
        />
      )}

      {/* ── Active Threads ── */}
      {threadsQuery.isLoading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading discussions…
        </div>
      ) : activeThreads.length === 0 && resolvedThreads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageCircle className="size-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No discussions yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Start a thread to collaborate on this review
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              reviewId={reviewId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              channelName={channelName}
              triggerTyping={triggerTyping}
            />
          ))}
        </div>
      )}

      {/* ── Resolved Threads (collapsible) ── */}
      {showResolved && resolvedThreads.length > 0 && (
        <div className="space-y-3 opacity-60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <CheckCircle2 className="size-3" />
            <span className="font-medium">Resolved</span>
          </div>
          {resolvedThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              reviewId={reviewId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              channelName={channelName}
              triggerTyping={triggerTyping}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes typingDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ─── Presence Avatars ──────────────────────────────────────────────
function PresenceAvatars({
  members,
  myId,
}: {
  members: PresenceMember[];
  myId: string | null;
}) {
  if (members.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <WifiOff className="size-3" />
        Offline
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wifi className="size-3 text-emerald-500" />
        <Users className="size-3" />
      </div>
      <div className="flex -space-x-2">
        {members.slice(0, 5).map((m) => (
          <Avatar
            key={m.id}
            className={cn(
              "size-7 ring-2 ring-background transition-transform hover:scale-110 hover:z-10",
              m.id === myId && "ring-primary/50",
            )}
            title={m.info.name + (m.id === myId ? " (you)" : "")}
          >
            <AvatarImage src={m.info.image ?? undefined} />
            <AvatarFallback className="text-[10px] font-semibold bg-primary/10">
              {m.info.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {members.length > 5 && (
          <div className="size-7 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
            +{members.length - 5}
          </div>
        )}
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {members.length} online
      </span>
    </div>
  );
}

// ─── New Thread Form ───────────────────────────────────────────────
function NewThreadForm({
  reviewId,
  onCancel,
  onCreated,
  currentUserId,
  currentUserName,
  triggerTyping,
}: {
  reviewId: string;
  onCancel: () => void;
  onCreated: () => void;
  currentUserId: string;
  currentUserName: string;
  triggerTyping: (userId: string, name: string) => void;
}) {
  const [file, setFile] = useState("");
  const [line, setLine] = useState("");
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createThread = trpc.collaboration.createThread.useMutation({
    onSuccess: () => onCreated(),
  });

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createThread.mutate({
      reviewId,
      file: file || "general",
      line: parseInt(line) || 0,
      content: content.trim(),
    });
  };

  return (
    <Card className="border-primary/20 shadow-sm shadow-primary/5">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              New Thread
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-7 p-0"
              onClick={onCancel}
            >
              <X className="size-3.5" />
            </Button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={file}
              onChange={(e) => setFile(e.target.value)}
              placeholder="File path (optional)"
              className="flex-1 h-8 px-3 text-xs rounded-md border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="number"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder="Line"
              className="w-20 h-8 px-3 text-xs rounded-md border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              triggerTyping(currentUserId, currentUserName);
            }}
            placeholder="Write your comment…"
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-md border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={!content.trim() || createThread.isPending}
            >
              {createThread.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Submit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Thread Card ───────────────────────────────────────────────────
function ThreadCard({
  thread,
  reviewId,
  currentUserId,
  currentUserName,
  channelName,
  triggerTyping,
}: {
  thread: Thread;
  reviewId: string;
  currentUserId: string;
  currentUserName: string;
  channelName: string;
  triggerTyping: (userId: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(!thread.resolved);
  const [replyContent, setReplyContent] = useState("");
  const [showReply, setShowReply] = useState(false);

  const toggleResolve = trpc.collaboration.toggleResolve.useMutation();
  const addComment = trpc.collaboration.addComment.useMutation({
    onSuccess: () => {
      setReplyContent("");
      setShowReply(false);
    },
  });
  const deleteComment = trpc.collaboration.deleteComment.useMutation();

  const firstComment = thread.comments[0];
  const pathParts = thread.file.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        thread.resolved
          ? "border-emerald-500/10 opacity-70"
          : "border-border/50",
      )}
    >
      {/* Thread Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
        )}

        {/* File/line badge */}
        {thread.file !== "general" && (
          <div className="flex items-center gap-1 text-xs font-mono bg-muted/50 rounded px-2 py-0.5 text-muted-foreground shrink-0">
            <FileCode2 className="size-3" />
            {directory && (
              <span className="opacity-50 max-w-24 truncate">{directory}/</span>
            )}
            <span className="font-semibold text-foreground">{fileName}</span>
            {thread.line > 0 && (
              <>
                <span className="text-muted-foreground">:</span>
                <span className="text-primary font-bold">{thread.line}</span>
              </>
            )}
          </div>
        )}

        {/* First comment preview */}
        <span className="text-sm text-foreground/80 truncate flex-1">
          {firstComment?.content.slice(0, 100)}
        </span>

        {/* Counters */}
        <div className="flex items-center gap-2 shrink-0">
          {thread.resolved && (
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          )}
          <Badge variant="secondary" className="text-[10px] tabular-nums">
            {thread.comments.length}
          </Badge>
        </div>
      </button>

      {/* Thread Content */}
      {expanded && (
        <div className="border-t">
          {/* Comments */}
          <div className="divide-y">
            {thread.comments.map((comment) => (
              <div
                key={comment.id}
                className="px-4 py-3 flex gap-3 group/comment"
              >
                <Avatar className="size-7 shrink-0 mt-0.5">
                  <AvatarImage src={comment.user.image ?? undefined} />
                  <AvatarFallback className="text-[10px] font-semibold bg-primary/10">
                    {comment.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">
                      {comment.user.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(comment.createdAt)}
                    </span>
                    {comment.user.id === currentUserId && (
                      <button
                        className="opacity-0 group-hover/comment:opacity-100 transition-opacity ml-auto"
                        onClick={() =>
                          deleteComment.mutate({ commentId: comment.id })
                        }
                        disabled={deleteComment.isPending}
                      >
                        <Trash2 className="size-3 text-muted-foreground hover:text-destructive transition-colors" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-4 py-2.5 bg-muted/20 flex items-center gap-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setShowReply((v) => !v)}
            >
              <MessageCircle className="size-3" />
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 text-xs gap-1.5",
                thread.resolved
                  ? "text-amber-600 hover:text-amber-700"
                  : "text-emerald-600 hover:text-emerald-700",
              )}
              onClick={() => toggleResolve.mutate({ threadId: thread.id })}
              disabled={toggleResolve.isPending}
            >
              {thread.resolved ? (
                <>
                  <RotateCcw className="size-3" />
                  Reopen
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3" />
                  Resolve
                </>
              )}
            </Button>
          </div>

          {/* Reply form */}
          {showReply && (
            <div className="px-4 py-3 border-t bg-muted/10">
              <div className="flex gap-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => {
                    setReplyContent(e.target.value);
                    triggerTyping(currentUserId, currentUserName);
                  }}
                  placeholder="Write a reply…"
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm rounded-md border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  autoFocus
                />
                <Button
                  size="sm"
                  className="self-end gap-1"
                  disabled={!replyContent.trim() || addComment.isPending}
                  onClick={() =>
                    addComment.mutate({
                      threadId: thread.id,
                      content: replyContent.trim(),
                    })
                  }
                >
                  {addComment.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────
function formatTime(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
