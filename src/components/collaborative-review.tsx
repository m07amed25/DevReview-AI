
"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Wifi,
  WifiOff,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  Circle,
} from "lucide-react";
import {
  DropdownSelect,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  isAdmin?: boolean;
  prFiles?: string[];
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
  isAdmin,
  prFiles = [],
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

  return (
    <div className="space-y-4">
      {/* ── Header: Presence + Stats ── */}
      <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md ring-1 ring-primary/20">
                  <MessageCircle className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight">Discussion</h3>
              </div>
              <Badge variant="secondary" className="tabular-nums text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {activeThreads.length} open
              </Badge>
              {resolvedThreads.length > 0 && (
                <Badge
                  variant="outline"
                  className="tabular-nums text-xs cursor-pointer bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                  onClick={() => setShowResolved((v) => !v)}
                >
                  <CheckCircle2 className="size-3.5 mr-1" />
                  {resolvedThreads.length} resolved
                </Badge>
              )}
            </div>

            {/* Presence Avatars */}
            <PresenceAvatars members={members} myId={myId} isAdmin={isAdmin} />
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
          className="gap-2 w-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 group transition-all duration-300 h-10"
          onClick={() => setNewThread({ file: "", line: 0 })}
        >
          <MessageCircle className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
          prFiles={prFiles}
        />
      )}

      {/* ── Active Threads ── */}
      {threadsQuery.isLoading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading discussions…
        </div>
      ) : activeThreads.length === 0 && resolvedThreads.length === 0 ? (
        <Card className="border-dashed bg-muted/30 border-primary/20">
          <CardContent className="py-16 text-center flex flex-col items-center justify-center">
            <div className="relative mb-5 group cursor-default">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                <MessageCircle className="size-8 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
            </div>
            <p className="text-base font-semibold text-foreground tracking-tight">
              No discussions yet
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mt-2 leading-relaxed">
              Start a thread to collaborate, ask questions, or suggest improvements.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
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
              currentUserId={currentUserId}
              currentUserName={currentUserName}
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
  isAdmin,
}: {
  members: PresenceMember[];
  myId: string | null;
  isAdmin?: boolean;
}) {
  if (members.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md border border-border/50 shadow-sm">
        <WifiOff className="size-3.5" />
        <span className="font-medium">Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-card px-3 py-1.5 rounded-full border border-border shadow-sm ring-1 ring-background/5">
      <div className="flex items-center gap-2 text-xs font-medium">
        <div className="relative flex items-center justify-center size-4">
          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-30" />
          <Wifi className="size-3.5 text-emerald-500 relative z-10" />
        </div>
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
          <div className="size-7 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[10px] font-semibold text-muted-foreground shadow-sm">
            +{members.length - 5}
          </div>
        )}
      </div>
      <div className="h-4 w-px bg-border/60 mx-1" />
      {isAdmin ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors tabular-nums focus:outline-none flex items-center gap-1 cursor-pointer">
              {members.length} online
              <ChevronDown className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2" sideOffset={8}>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Online Members
            </div>
            <div className="space-y-1">
              {members.map((m) => (
                <DropdownMenuItem key={m.id} className="gap-2.5 rounded-md px-2 py-1.5 focus:bg-muted cursor-default">
                  <Avatar className="size-5 shrink-0">
                    <AvatarImage src={m.info.image ?? undefined} />
                    <AvatarFallback className="text-[8px] bg-primary/10">
                      {m.info.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate">
                    {m.info.name} {m.id === myId && <span className="text-muted-foreground opacity-70">(you)</span>}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
          {members.length} online
        </span>
      )}
    </div>
  );
}

function NewThreadForm({
  reviewId,
  onCancel,
  onCreated,
  currentUserId,
  currentUserName,
  triggerTyping,
  prFiles,
}: {
  reviewId: string;
  onCancel: () => void;
  onCreated: () => void;
  currentUserId: string;
  currentUserName: string;
  triggerTyping: (userId: string, name: string) => void;
  prFiles: string[];
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
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-sm font-semibold text-foreground tracking-tight">
              Start a New Discussion
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:bg-muted"
              onClick={onCancel}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground/50 z-10">
                <FileCode2 className="size-4" />
              </div>
              <DropdownSelect
                value={file}
                onValueChange={setFile}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border shadow-sm text-foreground bg-background focus:ring-2 focus:ring-primary/30 transition-shadow transition-colors"
                placeholder="File path (optional)"
              >
                <option value="general">General (No specific file)</option>
                {prFiles.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </DropdownSelect>
            </div>
            <div className="relative w-28">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground/50 text-sm font-mono">:</span>
              <input
                type="number"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder="Line"
                className="w-full h-9 pl-7 pr-3 text-sm rounded-lg border border-border shadow-sm bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow transition-colors"
              />
            </div>
          </div>

          <div className="relative group">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                triggerTyping(currentUserId, currentUserName);
              }}
              placeholder="Write your comment…"
              rows={3}
              className="w-full px-4 py-3 text-sm rounded-lg border border-border shadow-sm bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow transition-colors resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              className="gap-2 shadow-sm px-6 font-medium"
              disabled={!content.trim() || createThread.isPending}
            >
              {createThread.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Start Discussion
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
  currentUserId,
  currentUserName,
  triggerTyping,
}: {
  thread: Thread;
  currentUserId: string;
  currentUserName: string;
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
        "overflow-hidden transition-all duration-300",
        thread.resolved
          ? "border-emerald-500/20 bg-emerald-500/5 opacity-80"
          : "border-border/50 shadow-sm hover:shadow-md",
        expanded && !thread.resolved ? "ring-1 ring-primary/20 shadow-md" : ""
      )}
    >
      {/* Thread Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:bg-muted/40"
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
        <span className={cn("text-sm truncate flex-1 transition-colors", expanded ? "text-foreground font-medium" : "text-foreground/80")}>
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
          <div className="divide-y divide-border/50 bg-background/50">
            {thread.comments.map((comment) => (
              <div
                key={comment.id}
                className="px-5 py-4 flex gap-3.5 group/comment transition-colors hover:bg-muted/20"
              >
                <Avatar className="size-8 shrink-0 shadow-sm mt-0.5 ring-1 ring-border/50">
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
                  <p className="text-sm text-foreground/90 leading-relaxed mt-1.5 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-5 py-3 bg-muted/30 flex items-center gap-2 border-t backdrop-blur-sm">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs gap-1.5 font-medium shadow-sm transition-all hover:bg-secondary/80"
              onClick={() => setShowReply((v) => !v)}
            >
              <MessageCircle className="size-3.5" />
              Reply
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5 font-medium shadow-sm transition-all",
                thread.resolved
                  ? "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 border-amber-500/20"
                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/20",
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
