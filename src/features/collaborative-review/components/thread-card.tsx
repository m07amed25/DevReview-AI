"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Trash2,
  RotateCcw,
  Loader2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "./helpers";

interface ThreadComment {
  id: string;
  content: string;
  createdAt: string | Date;
  user: { id: string; name: string; image?: string | null };
}

interface Thread {
  id: string;
  file: string;
  line: number;
  resolved: boolean;
  createdAt: string | Date;
  comments: ThreadComment[];
}

interface ThreadCardProps {
  thread: Thread;
  currentUserId: string;
  currentUserName: string;
  triggerTyping: (userId: string, name: string) => void;
}

export function ThreadCard({
  thread,
  currentUserId,
  currentUserName,
  triggerTyping,
}: ThreadCardProps) {
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
        expanded && !thread.resolved ? "ring-1 ring-primary/20 shadow-md" : "",
      )}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:bg-muted/40"
      >
        {expanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
        )}
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
        <span
          className={cn(
            "text-sm truncate flex-1 transition-colors",
            expanded ? "text-foreground font-medium" : "text-foreground/80",
          )}
        >
          {firstComment?.content.slice(0, 100)}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {thread.resolved && (
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          )}
          <Badge variant="secondary" className="text-[10px] tabular-nums">
            {thread.comments.length}
          </Badge>
        </div>
      </button>

      {expanded && (
        <div className="border-t">
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
          <div className="px-5 py-3 bg-muted/30 flex items-center gap-2 border-t backdrop-blur-sm">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs gap-1.5 font-medium shadow-sm"
              onClick={() => setShowReply((v) => !v)}
            >
              <MessageCircle className="size-3.5" />
              Reply
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs gap-1.5 font-medium shadow-sm",
                thread.resolved
                  ? "text-amber-600 hover:bg-amber-500/10 border-amber-500/20"
                  : "text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20",
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
