"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FileMinus,
  FileEdit,
  FileText,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DiffFile, ViewMode, parsePatch, groupLines } from "./diff-algorithm";
import { getLanguageInfo } from "./language-map";
import { DiffContentUnified } from "./diff-content-unified";
import { DiffContentSplit } from "./diff-content-split";

function getStatusIcon(status: string) {
  switch (status) {
    case "added":
      return FilePlus;
    case "removed":
      return FileMinus;
    case "modified":
    case "changed":
    case "renamed":
      return FileEdit;
    default:
      return FileText;
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case "added":
      return {
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    case "removed":
      return { color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" };
    case "modified":
    case "changed":
      return {
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
      };
    case "renamed":
      return {
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10",
      };
    default:
      return { color: "text-muted-foreground", bg: "bg-muted" };
  }
}

function DiffContentRouter({
  patch,
  viewMode,
  wordDiffEnabled,
  wrapLines,
  enableSyntaxHighlighting,
  language,
}: {
  patch: string;
  viewMode: ViewMode;
  wordDiffEnabled: boolean;
  wrapLines: boolean;
  enableSyntaxHighlighting?: boolean;
  language?: string;
}) {
  const hunks = useMemo(() => parsePatch(patch), [patch]);
  const groups = useMemo(() => groupLines(hunks), [hunks]);
  if (viewMode === "split")
    return (
      <DiffContentSplit
        groups={groups}
        wordDiffEnabled={wordDiffEnabled}
        wrapLines={wrapLines}
        enableSyntaxHighlighting={enableSyntaxHighlighting}
        language={language}
      />
    );
  return (
    <DiffContentUnified
      groups={groups}
      wordDiffEnabled={wordDiffEnabled}
      wrapLines={wrapLines}
      enableSyntaxHighlighting={enableSyntaxHighlighting}
      language={language}
    />
  );
}

export function DiffFileCard({
  file,
  expanded,
  onToggle,
  viewMode,
  wordDiffEnabled,
  wrapLines,
  enableSyntaxHighlighting = true,
}: {
  file: DiffFile;
  expanded: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
  wordDiffEnabled: boolean;
  wrapLines: boolean;
  enableSyntaxHighlighting?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const statusIcon = getStatusIcon(file.status);
  const statusConfig = getStatusConfig(file.status);
  const langInfo = getLanguageInfo(file.filename);

  const copyFilename = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file.filename);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pathParts = file.filename.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow duration-200",
        expanded && "shadow-sm",
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors",
          "hover:bg-muted/50 group",
          expanded &&
            "sticky top-0 z-10 bg-card border-b border-border/30 backdrop-blur-sm",
        )}
      >
        <div className="shrink-0 transition-transform duration-200">
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className={cn("p-1.5 rounded-md shrink-0", statusConfig.bg)}>
          {React.createElement(statusIcon, {
            className: cn("size-4", statusConfig.color),
          })}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {directory && (
            <span className="text-sm text-muted-foreground font-mono truncate">
              {directory}/
            </span>
          )}
          <span className="text-sm font-medium font-mono truncate">
            {fileName}
          </span>
          {langInfo && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0",
                langInfo.color,
              )}
            >
              {langInfo.lang}
            </span>
          )}
          {file.previousFilename && (
            <Badge variant="outline" className="text-xs shrink-0">
              ← {file.previousFilename.split("/").pop()}
            </Badge>
          )}
          {file.changes > 300 && (
            <Badge
              variant="outline"
              className="text-[10px] shrink-0 gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            >
              <AlertCircle className="size-3" />
              Large diff
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div
            role="button"
            tabIndex={-1}
            onClick={copyFilename}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="hidden sm:flex items-center gap-0.5">
            {Array.from({ length: Math.min(5, file.additions) }).map((_, i) => (
              <div
                key={`add-${i}`}
                className="w-1.5 h-3 rounded-sm bg-emerald-500"
              />
            ))}
            {Array.from({ length: Math.min(5, file.deletions) }).map((_, i) => (
              <div
                key={`del-${i}`}
                className="w-1.5 h-3 rounded-sm bg-red-500"
              />
            ))}
            {file.additions + file.deletions === 0 && (
              <div className="w-1.5 h-3 rounded-sm bg-muted-foreground/30" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              +{file.additions}
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">
              -{file.deletions}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <CardContent className="p-0 border-t border-border/60">
          {file.patch ? (
            <DiffContentRouter
              patch={file.patch}
              viewMode={viewMode}
              wordDiffEnabled={wordDiffEnabled}
              wrapLines={wrapLines}
              enableSyntaxHighlighting={enableSyntaxHighlighting}
              language={langInfo?.lang.toLowerCase()}
            />
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <FileText className="size-8 mx-auto mb-2 opacity-50" />
              <p>No diff available for this file.</p>
              <p className="text-xs mt-1">
                Binary file or too large to display.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
