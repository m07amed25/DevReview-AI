"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  FileCode2,
  ShieldX,
  ShieldAlert,
  AlertTriangle,
  Info,
  Lightbulb,
  ArrowRight,
  FolderOpen,
  CheckCircle2,
  MessageSquare,
  Send,
  Loader2,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSeverityStyles, getCategoryIcon } from "./helpers";
import { ConfidenceBadge } from "./quality-metrics-card";
import type { ReviewComment } from "./types";
import { trpc } from "@/lib/trpc/client";

export function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "critical":
      return <ShieldX className="size-4 text-red-500" />;
    case "high":
      return <ShieldAlert className="size-4 text-orange-500" />;
    case "medium":
      return <AlertTriangle className="size-4 text-amber-500" />;
    case "info":
      return <Info className="size-4 text-sky-500" />;
    default:
      return <Info className="size-4 text-slate-400 dark:text-slate-500" />;
  }
}

function InlineAIChat({
  reviewId,
  comment,
}: {
  reviewId: string;
  comment: ReviewComment;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<{ q: string; a: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const askAI = trpc.review.askAI.useMutation({
    onSuccess: ({ answer }) => {
      setThread((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last) updated[updated.length - 1] = { ...last, a: answer };
        return updated;
      });
    },
    onError: () => {
      setThread((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last)
          updated[updated.length - 1] = {
            ...last,
            a: "Sorry, I couldn't generate a response. Please try again.",
          };
        return updated;
      });
    },
  });

  const handleSubmit = () => {
    const q = question.trim();
    if (!q || askAI.isPending) return;
    setThread((prev) => [...prev, { q, a: "" }]);
    setQuestion("");
    askAI.mutate({
      reviewId,
      file: comment.file,
      line: comment.line,
      severity: comment.severity,
      category: comment.category,
      message: comment.message,
      suggestion: comment.suggestion,
      question: q,
    });
  };

  if (!open) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors rounded-md px-2 py-1 hover:bg-primary/5"
      >
        <MessageSquare className="size-3" />
        Ask AI a follow-up
      </button>
    );
  }

  return (
    <div
      className="space-y-3"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {thread.map((item, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mt-0.5 shrink-0">
              You
            </span>
            <p className="text-xs text-foreground/80">{item.q}</p>
          </div>
          {item.a ? (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 size-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="size-3 text-primary" />
              </div>
              <div className="flex-1 min-w-0 prose prose-sm dark:prose-invert max-w-none text-foreground/85 leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-1.5 [&>ul]:pl-4 [&>ol]:my-1.5 [&>ol]:pl-4 [&>li]:my-0.5 [&>pre]:my-2 [&>pre]:rounded-lg [&>pre]:bg-muted/80 [&>pre]:p-3 [&>pre]:overflow-x-auto [&_code]:text-[11px] [&_code]:font-mono [&_:not(pre)>code]:bg-muted/80 [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:text-primary [&_strong]:font-semibold [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline-offset-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {item.a}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Thinking…
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask a follow-up question…"
          disabled={askAI.isPending}
          className="flex-1 text-xs bg-muted/50 rounded-lg px-3 py-2 border border-border/50 outline-none focus:border-primary/30 focus:bg-muted/80 transition-colors disabled:opacity-60"
        />
        <button
          onClick={handleSubmit}
          disabled={!question.trim() || askAI.isPending}
          title="Send question"
          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function FileGroup({
  file,
  comments,
  allExpanded,
  expandKey,
  resolvedKeys,
  onToggleResolved,
  reviewId,
}: {
  file: string;
  comments: ReviewComment[];
  allExpanded: boolean | null;
  expandKey: number;
  resolvedKeys?: Set<string>;
  onToggleResolved?: (key: string) => void;
  reviewId?: string;
}) {
  const [open, setOpen] = useState(true);
  const pathParts = file.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group/folder flex items-center gap-2 px-2.5 py-2 w-full text-left rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex size-5 items-center justify-center">
          {open ? (
            <ChevronDown className="size-3.5 text-muted-foreground transition-transform" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground transition-transform" />
          )}
        </div>
        <FolderOpen className="size-3.5 text-muted-foreground/70" />
        <span className="text-xs font-mono text-muted-foreground flex-1 truncate">
          {directory && <span className="opacity-40">{directory}/</span>}
          <span className="font-semibold text-foreground/90">{fileName}</span>
        </span>
        <Badge
          variant="secondary"
          className="text-[10px] ml-auto tabular-nums shrink-0"
        >
          {comments.length}
        </Badge>
      </button>
      {open && (
        <div className="space-y-2 pl-1">
          {comments.map((comment, index) => {
            const rKey = `${comment.file}:${comment.line}:${comment.severity}:${comment.category ?? ""}`;
            return (
              <CommentCard
                key={`${comment.file}:${comment.line}:${index}`}
                comment={comment}
                index={index}
                forceExpanded={allExpanded}
                expandKey={expandKey}
                resolved={resolvedKeys?.has(rKey)}
                onToggleResolved={
                  onToggleResolved ? () => onToggleResolved(rKey) : undefined
                }
                reviewId={reviewId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CommentCard({
  comment,
  index,
  forceExpanded,
  expandKey,
  resolved,
  onToggleResolved,
  reviewId,
}: {
  comment: ReviewComment;
  index: number;
  forceExpanded?: boolean | null;
  expandKey?: number;
  resolved?: boolean;
  onToggleResolved?: () => void;
  reviewId?: string;
}) {
  const [expanded, setExpanded] = useState(index < 3);

  const [prevExpandKey, setPrevExpandKey] = useState(expandKey);

  if (expandKey !== prevExpandKey) {
    setPrevExpandKey(expandKey);
    if (forceExpanded !== null && forceExpanded !== undefined) {
      setExpanded(forceExpanded);
    }
  }

  const [copied, setCopied] = useState(false);
  const CategoryIcon = getCategoryIcon(comment.category);
  const severityConfig = getSeverityStyles(comment.severity);

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const copyLocation = useCallback(() => {
    navigator.clipboard.writeText(`${comment.file}:${comment.line}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [comment.file, comment.line]);

  const pathParts = comment.file.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  const hasExpandedContent = !!(comment.suggestion || reviewId);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        resolved
          ? "opacity-55 border-emerald-500/20 bg-emerald-500/2"
          : cn(
              "border-border/60 hover:border-border",
              severityConfig.borderHover,
              expanded && severityConfig.activeBorder,
            ),
      )}
    >
      <div
        className={cn(
          "h-[3px] w-full",
          resolved ? "bg-emerald-500/50" : severityConfig.bar,
        )}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={toggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleExpand();
          }
        }}
        className="w-full text-left cursor-pointer group/card"
      >
        <div className="p-4 sm:p-5 flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 size-8 rounded-lg flex items-center justify-center shrink-0",
              severityConfig.iconBg,
            )}
          >
            <SeverityIcon severity={comment.severity} />
          </div>
          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold px-2.5",
                  severityConfig.badge,
                )}
              >
                {comment.severity}
              </Badge>
              {comment.category && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 text-xs font-medium"
                >
                  {React.createElement(CategoryIcon, { className: "size-3" })}
                  {comment.category}
                </Badge>
              )}
              {comment.confidence !== undefined && (
                <ConfidenceBadge confidence={comment.confidence} />
              )}
              <div className="flex-1" />
              {onToggleResolved && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleResolved();
                  }}
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all",
                    resolved
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border/60 bg-transparent text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-600 hover:bg-emerald-500/5",
                  )}
                  title={resolved ? "Mark as unresolved" : "Mark as resolved"}
                >
                  <CheckCircle2 className="size-3" />
                  {resolved ? "Resolved" : "Resolve"}
                </button>
              )}
              <div
                className={cn(
                  "size-6 rounded-md flex items-center justify-center transition-colors",
                  "group-hover/card:bg-muted",
                )}
              >
                {expanded ? (
                  <ChevronDown className="size-4 text-muted-foreground transition-transform" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground transition-transform" />
                )}
              </div>
            </div>
            <p
              className={cn(
                "text-sm leading-relaxed text-foreground/90",
                !expanded && "line-clamp-2",
                resolved && "line-through opacity-60",
              )}
            >
              {comment.message}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyLocation();
              }}
              className="group/file inline-flex items-center gap-1 text-xs font-mono rounded-lg px-2.5 py-1.5 -ml-2.5 bg-muted/40 hover:bg-muted border border-border/40 hover:border-border/80 transition-all text-muted-foreground hover:text-foreground"
            >
              <FileCode2 className="size-3 shrink-0 text-muted-foreground/60" />
              {directory && (
                <span className="opacity-40 truncate max-w-[150px] hidden sm:inline">
                  {directory}/
                </span>
              )}
              <span className="font-semibold text-foreground/90">
                {fileName}
              </span>
              <span className="text-muted-foreground/50">:</span>
              <span className="text-primary font-bold">{comment.line}</span>
              <span className="ml-1 transition-all">
                {copied ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3 opacity-0 group-hover/file:opacity-60 transition-opacity" />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          expanded && hasExpandedContent
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {comment.suggestion && (
            <div className="px-4 sm:px-5 pb-4">
              <div className="ml-11 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="size-6 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Lightbulb className="size-3 text-emerald-500" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Suggested Fix
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/85 pl-8">
                  {comment.suggestion}
                </p>
              </div>
            </div>
          )}
          {reviewId && (
            <div className="px-4 sm:px-5 pb-4">
              <div className="ml-11 rounded-xl bg-muted/20 border border-border/30 p-3.5">
                <InlineAIChat reviewId={reviewId} comment={comment} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
