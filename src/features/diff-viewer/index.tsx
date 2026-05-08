"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Minus,
  FolderTree,
  Search,
  X,
  Eye,
  EyeOff,
  AlignJustify,
  Columns3,
  WrapText,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DiffFile,
  ViewMode,
  FileStatusFilter,
} from "./components/diff-algorithm";
import { DiffFileCard } from "./components/file-card";

export type { DiffFile, ViewMode };

interface DiffViewerProps {
  files: DiffFile[];
}

const STATUS_FILTER_CONFIGS: Record<
  FileStatusFilter,
  { label: string; activeClass: string }
> = {
  all: { label: "All", activeClass: "bg-primary/10 text-primary" },
  added: {
    label: "Added",
    activeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  modified: {
    label: "Modified",
    activeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  removed: {
    label: "Deleted",
    activeClass: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  renamed: {
    label: "Renamed",
    activeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
};

export function DiffViewer({ files }: DiffViewerProps) {
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);
  const totalChanges = totalAdditions + totalDeletions;

  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(files.slice(0, 3).map((f) => f.filename)),
  );
  const [viewMode, setViewMode] = useState<ViewMode>("unified");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FileStatusFilter>("all");
  const [wordDiffEnabled, setWordDiffEnabled] = useState(true);
  const [wrapLines, setWrapLines] = useState(false);
  const [syntaxHighlighting, setSyntaxHighlighting] = useState(true);
  const [isLoading] = useState(false);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: files.length };
    for (const f of files) {
      const normalized = f.status === "changed" ? "modified" : f.status;
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
    return counts;
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        searchQuery === "" ||
        f.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const normalized = f.status === "changed" ? "modified" : f.status;
      const matchesStatus =
        statusFilter === "all" || normalized === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [files, searchQuery, statusFilter]);

  const VIRTUALIZATION_THRESHOLD = 50;
  const ITEM_HEIGHT = 80;
  const OVERSCAN = 5;
  const useVirtualization = filteredFiles.length > VIRTUALIZATION_THRESHOLD;

  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: useVirtualization ? 20 : filteredFiles.length,
  });

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !useVirtualization) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN,
    );
    const endIndex = Math.min(
      filteredFiles.length,
      Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + OVERSCAN,
    );
    setVisibleRange({ start: startIndex, end: endIndex });
  }, [filteredFiles.length, useVirtualization]);

  // Reset scroll position and recalculate visible range when filters change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    // Update visible range based on current virtualization mode
    const newRange = useVirtualization
      ? { start: 0, end: 20 }
      : { start: 0, end: filteredFiles.length };
    // Use setTimeout to avoid setState during render
    setTimeout(() => setVisibleRange(newRange), 0);
  }, [filteredFiles.length, searchQuery, statusFilter, useVirtualization]);

  const visibleFiles = useVirtualization
    ? filteredFiles.slice(visibleRange.start, visibleRange.end)
    : filteredFiles;
  const totalHeight = filteredFiles.length * ITEM_HEIGHT;

  const toggleFile = useCallback((fileKey: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileKey)) next.delete(fileKey);
      else next.add(fileKey);
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (useVirtualization && containerRef.current) {
        const { scrollTop } = containerRef.current;
        const currentIndex = Math.round(scrollTop / ITEM_HEIGHT);
        if (e.key === "ArrowDown" && currentIndex < filteredFiles.length - 1) {
          e.preventDefault();
          containerRef.current.scrollTo({
            top: (currentIndex + 1) * ITEM_HEIGHT,
            behavior: "smooth",
          });
        } else if (e.key === "ArrowUp" && currentIndex > 0) {
          e.preventDefault();
          containerRef.current.scrollTo({
            top: (currentIndex - 1) * ITEM_HEIGHT,
            behavior: "smooth",
          });
        } else if (e.key === "Home") {
          e.preventDefault();
          containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        } else if (e.key === "End") {
          e.preventDefault();
          containerRef.current.scrollTo({
            top: filteredFiles.length * ITEM_HEIGHT,
            behavior: "smooth",
          });
        }
      }
      if (e.key === "e" && !e.ctrlKey && !e.metaKey) {
        setExpandedFiles(new Set(filteredFiles.map((f) => f.filename)));
      } else if (e.key === "w" && !e.ctrlKey && !e.metaKey) {
        setWrapLines((p) => !p);
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("[data-diff-search]")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filteredFiles, useVirtualization]);

  const addPercent =
    totalChanges > 0 ? (totalAdditions / totalChanges) * 100 : 50;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* Header stats + view mode toggles */}
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderTree className="size-4 text-primary" />
              </div>
              <div>
                <span className="text-base font-semibold tabular-nums">
                  {files.length}
                </span>
                <span className="text-sm text-muted-foreground ml-1.5">
                  {files.length === 1 ? "file" : "files"} changed
                </span>
              </div>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                <Plus className="size-3.5" />
                <span className="tabular-nums">{totalAdditions}</span>
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-sm">
                <Minus className="size-3.5" />
                <span className="tabular-nums">{totalDeletions}</span>
              </span>
            </div>
            {totalChanges > 0 && (
              <>
                <div className="h-5 w-px bg-border hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden flex">
                    {/* Dynamic width calculated at runtime */}
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${addPercent}%` }}
                    />
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${100 - addPercent}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "unified" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none gap-1.5 text-xs h-8 px-2 sm:px-3"
                onClick={() => setViewMode("unified")}
                title="Unified view"
              >
                <AlignJustify className="size-3.5" />
                <span className="hidden md:inline">Unified</span>
              </Button>
              <Button
                variant={viewMode === "split" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none gap-1.5 text-xs h-8 px-2 sm:px-3"
                onClick={() => setViewMode("split")}
                title="Side-by-side view"
              >
                <Columns3 className="size-3.5" />
                <span className="hidden md:inline">Split</span>
              </Button>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <Button
              variant={syntaxHighlighting ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5 text-xs h-8 px-2 sm:px-3"
              onClick={() => setSyntaxHighlighting(!syntaxHighlighting)}
              title="Toggle syntax highlighting"
            >
              <Code2 className="size-3.5" />
              <span className="hidden lg:inline">Syntax</span>
            </Button>
            <Button
              variant={wordDiffEnabled ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5 text-xs h-8 px-2 sm:px-3"
              onClick={() => setWordDiffEnabled(!wordDiffEnabled)}
              title="Toggle word-level diff highlighting"
            >
              {wordDiffEnabled ? (
                <Eye className="size-3.5" />
              ) : (
                <EyeOff className="size-3.5" />
              )}
              <span className="hidden lg:inline">Word diff</span>
            </Button>
            <Button
              variant={wrapLines ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5 text-xs h-8 px-2 sm:px-3"
              onClick={() => setWrapLines(!wrapLines)}
              title="Toggle line wrapping"
            >
              <WrapText className="size-3.5" />
              <span className="hidden lg:inline">Wrap</span>
            </Button>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-2 sm:px-3 hidden sm:inline-flex"
              onClick={() =>
                setExpandedFiles(new Set(filteredFiles.map((f) => f.filename)))
              }
            >
              Expand all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-2 sm:px-3 hidden sm:inline-flex"
              onClick={() => setExpandedFiles(new Set())}
            >
              Collapse all
            </Button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-50 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              data-diff-search
              placeholder="Filter files…"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-9 pr-8 h-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {(
              [
                "all",
                "added",
                "modified",
                "removed",
                "renamed",
              ] as FileStatusFilter[]
            ).map((status) => {
              const count = statusCounts[status] || 0;
              if (status !== "all" && count === 0) return null;
              const cfg = STATUS_FILTER_CONFIGS[status];
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-colors",
                    statusFilter === status
                      ? cfg.activeClass
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  {cfg.label}
                  <span className="ml-1 tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* File Cards - Virtualized for large datasets */}
      {/* Dynamic styles for virtualization performance - inline styles required for runtime values */}
      <div
        ref={containerRef}
        className="space-y-3"
        onScroll={handleScroll}
        style={{
          maxHeight: useVirtualization ? "70vh" : "none",
          overflowY: useVirtualization ? "auto" : "visible",
        }}
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 border rounded-lg"
              >
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : useVirtualization ? (
          <React.Fragment>
            {/* Dynamic virtualization layout - inline styles required for performance */}
            <div style={{ height: totalHeight, position: "relative" }}>
              <div
                style={{
                  transform: `translateY(${visibleRange.start * ITEM_HEIGHT}px)`,
                }}
              >
              {visibleFiles.map((file) => (
                <DiffFileCard
                  key={file.filename}
                  file={file}
                  expanded={expandedFiles.has(file.filename)}
                  onToggle={() => toggleFile(file.filename)}
                  viewMode={viewMode}
                  wordDiffEnabled={wordDiffEnabled}
                  wrapLines={wrapLines}
                  enableSyntaxHighlighting={syntaxHighlighting}
                />
              ))}
            </div>
          </div>
          </React.Fragment>
        ) : (
          <>
            {filteredFiles.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Search className="size-8 mx-auto mb-2 opacity-50" />
                <p>No files match your filter criteria.</p>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <DiffFileCard
                  key={file.filename}
                  file={file}
                  expanded={expandedFiles.has(file.filename)}
                  onToggle={() => toggleFile(file.filename)}
                  viewMode={viewMode}
                  wordDiffEnabled={wordDiffEnabled}
                  wrapLines={wrapLines}
                  enableSyntaxHighlighting={syntaxHighlighting}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Keyboard Shortcut Hints */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground/60 pt-2 select-none flex-wrap">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/50">
            /
          </kbd>
          <span className="hidden sm:inline">Search</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/50">
            E
          </kbd>
          <span className="hidden sm:inline">Expand</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/50">
            W
          </kbd>
          <span className="hidden sm:inline">Wrap</span>
        </span>
      </div>
    </div>
  );
}
