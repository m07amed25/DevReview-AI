"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSeverityStyles, getCategoryIcon } from "./helpers";
import { ConfidenceBadge } from "./quality-metrics-card";
import type { ReviewComment } from "./types";

export function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "critical":
      return <ShieldX className="size-4 text-red-500" />;
    case "high":
      return <ShieldAlert className="size-4 text-orange-500" />;
    case "medium":
      return <AlertTriangle className="size-4 text-amber-500" />;
    default:
      return <Info className="size-4 text-slate-400 dark:text-slate-500" />;
  }
}

export function FileGroup({
  file,
  comments,
  allExpanded,
  expandKey,
}: {
  file: string;
  comments: ReviewComment[];
  allExpanded: boolean | null;
  expandKey: number;
}) {
  const [open, setOpen] = useState(true);
  const pathParts = file.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-1 w-full text-left"
      >
        {open ? (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground" />
        )}
        <FolderOpen className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground">
          {directory && <span className="opacity-50">{directory}/</span>}
          <span className="font-semibold text-foreground">{fileName}</span>
        </span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {comments.length}
        </Badge>
      </button>
      {open && (
        <div className="space-y-2 pl-1">
          {comments.map((comment, index) => (
            <CommentCard
              key={`${comment.file}:${comment.line}:${index}`}
              comment={comment}
              index={index}
              forceExpanded={allExpanded}
              expandKey={expandKey}
            />
          ))}
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
}: {
  comment: ReviewComment;
  index: number;
  forceExpanded?: boolean | null;
  expandKey?: number;
}) {
  const [expanded, setExpanded] = useState(index < 3);

  useEffect(() => {
    if (forceExpanded !== null && forceExpanded !== undefined) {
      setExpanded(forceExpanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandKey]);

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

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        severityConfig.borderHover,
        expanded && severityConfig.activeBorder,
      )}
    >
      <div className={cn("h-0.5 w-full", severityConfig.bar)} />
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
              )}
            >
              {comment.message}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyLocation();
              }}
              className="group/file inline-flex items-center gap-1.5 text-xs font-mono rounded-md px-2.5 py-1.5 -ml-2.5 bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <FileCode2 className="size-3.5 shrink-0" />
              {directory && (
                <span className="opacity-50 truncate max-w-37.5">
                  {directory}/
                </span>
              )}
              <span className="font-semibold text-foreground">{fileName}</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-primary font-bold">{comment.line}</span>
              {copied ? (
                <Check className="size-3.5 text-emerald-500 ml-1" />
              ) : (
                <Copy className="size-3.5 opacity-0 group-hover/file:opacity-100 transition-opacity ml-1" />
              )}
            </button>
          </div>
        </div>
      </div>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          expanded && comment.suggestion
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {comment.suggestion && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              <div className="ml-11 rounded-xl bg-linear-to-br from-emerald-500/8 to-emerald-600/4 border border-emerald-500/15 p-4 sm:p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Lightbulb className="size-3.5 text-emerald-500" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Suggestion
                  </span>
                  <ArrowRight className="size-3 text-emerald-500/50" />
                </div>
                <p className="text-sm leading-relaxed text-foreground/85 pl-9.5">
                  {comment.suggestion}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
