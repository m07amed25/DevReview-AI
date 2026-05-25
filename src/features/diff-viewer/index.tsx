"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Minus,
  Search,
  X,
  Eye,
  EyeOff,
  AlignJustify,
  Columns3,
  WrapText,
  Code2,
  ChevronsDownUp,
  ChevronsUpDown,
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

const STATUS_FILTERS: {
  key: FileStatusFilter;
  label: string;
  color: string;
}[] = [
  { key: "all", label: "All", color: "text-[oklch(0.82_0.02_250)] bg-[oklch(0.20_0.02_250)]" },
  { key: "added", label: "Added", color: "text-[oklch(0.55_0.15_155)] bg-[oklch(0.55_0.15_155/0.15)]" },
  { key: "modified", label: "Modified", color: "text-[oklch(0.65_0.15_75)] bg-[oklch(0.65_0.15_75/0.15)]" },
  { key: "removed", label: "Deleted", color: "text-[oklch(0.55_0.2_25)] bg-[oklch(0.55_0.2_25/0.15)]" },
  { key: "renamed", label: "Renamed", color: "text-[oklch(0.62_0.16_250)] bg-[oklch(0.62_0.16_250/0.15)]" },
];

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "h-7 px-2 rounded-[4px] text-xs font-medium flex items-center gap-1.5 transition-colors duration-150 cursor-pointer",
        active
          ? "bg-[oklch(0.20_0.02_250)] text-[oklch(0.82_0.02_250)]"
          : "text-[oklch(0.60_0.03_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)]",
      )}
    >
      {children}
    </button>
  );
}

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
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(
      filteredFiles.length,
      Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + OVERSCAN,
    );
    setVisibleRange({ start: startIndex, end: endIndex });
  }, [filteredFiles.length, useVirtualization]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
    const newRange = useVirtualization
      ? { start: 0, end: 20 }
      : { start: 0, end: filteredFiles.length };
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "e" && !e.ctrlKey && !e.metaKey) {
        setExpandedFiles(new Set(filteredFiles.map((f) => f.filename)));
      } else if (e.key === "c" && !e.ctrlKey && !e.metaKey) {
        setExpandedFiles(new Set());
      } else if (e.key === "w" && !e.ctrlKey && !e.metaKey) {
        setWrapLines((p) => !p);
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("[data-diff-search]")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filteredFiles]);

  const addPercent = totalChanges > 0 ? (totalAdditions / totalChanges) * 100 : 50;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-[0.8125rem] font-medium text-[oklch(0.82_0.02_250)] tabular-nums">
            {files.length} <span className="text-[oklch(0.60_0.03_250)] font-normal">{files.length === 1 ? "file" : "files"}</span>
          </span>
          <span className="h-4 w-px bg-[oklch(0.30_0.02_250)]" />
          <span className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
            <Plus className="size-3 text-[oklch(0.55_0.15_155)]" />
            <span className="text-[oklch(0.55_0.15_155)]">{totalAdditions}</span>
            <Minus className="size-3 text-[oklch(0.55_0.2_25)] ml-1" />
            <span className="text-[oklch(0.55_0.2_25)]">{totalDeletions}</span>
          </span>
          {totalChanges > 0 && (
            <>
              <span className="h-4 w-px bg-[oklch(0.30_0.02_250)] hidden sm:block" />
              <div className="hidden sm:flex w-20 h-1.5 rounded-full overflow-hidden bg-[oklch(0.20_0.02_250)]">
                <div className="h-full bg-[oklch(0.55_0.15_155)]" style={{ width: `${addPercent}%` }} />
                <div className="h-full bg-[oklch(0.55_0.2_25)]" style={{ width: `${100 - addPercent}%` }} />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton active={viewMode === "unified"} onClick={() => setViewMode("unified")} title="Unified view">
            <AlignJustify className="size-3.5" />
            <span className="hidden md:inline">Unified</span>
          </ToolbarButton>
          <ToolbarButton active={viewMode === "split"} onClick={() => setViewMode("split")} title="Split view">
            <Columns3 className="size-3.5" />
            <span className="hidden md:inline">Split</span>
          </ToolbarButton>
          <span className="h-4 w-px bg-[oklch(0.30_0.02_250)] mx-0.5" />
          <ToolbarButton active={syntaxHighlighting} onClick={() => setSyntaxHighlighting(!syntaxHighlighting)} title="Syntax highlighting">
            <Code2 className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton active={wordDiffEnabled} onClick={() => setWordDiffEnabled(!wordDiffEnabled)} title="Word diff">
            {wordDiffEnabled ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          </ToolbarButton>
          <ToolbarButton active={wrapLines} onClick={() => setWrapLines(!wrapLines)} title="Wrap lines">
            <WrapText className="size-3.5" />
          </ToolbarButton>
          <span className="h-4 w-px bg-[oklch(0.30_0.02_250)] mx-0.5 hidden sm:block" />
          <ToolbarButton onClick={() => setExpandedFiles(new Set(filteredFiles.map((f) => f.filename)))} title="Expand all">
            <ChevronsUpDown className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setExpandedFiles(new Set())} title="Collapse all">
            <ChevronsDownUp className="size-3.5" />
          </ToolbarButton>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[oklch(0.40_0.03_250)] pointer-events-none" />
          <Input
            data-diff-search
            placeholder="Filter files…"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-8 pr-7 h-7 text-xs font-mono bg-[oklch(0.16_0.025_250)] border-[oklch(0.30_0.02_250)] rounded-[4px] text-[oklch(0.82_0.02_250)] placeholder:text-[oklch(0.40_0.03_250)] focus:border-[oklch(0.62_0.16_250)] focus:ring-[oklch(0.62_0.16_250/0.4)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[oklch(0.40_0.03_250)] hover:text-[oklch(0.82_0.02_250)] transition-colors duration-150 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map(({ key, label, color }) => {
            const count = statusCounts[key] || 0;
            if (key !== "all" && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "px-2 py-1 rounded-[4px] text-[0.6875rem] font-medium transition-colors duration-150 tabular-nums cursor-pointer",
                  statusFilter === key
                    ? color
                    : "text-[oklch(0.60_0.03_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)]",
                )}
              >
                {label} {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* File list */}
      <div
        ref={containerRef}
        className="border border-[oklch(0.30_0.02_250)] rounded-[6px] overflow-hidden"
        onScroll={handleScroll}
        style={{
          maxHeight: useVirtualization ? "70vh" : "none",
          overflowY: useVirtualization ? "auto" : "visible",
        }}
      >
        {useVirtualization ? (
          <div style={{ height: totalHeight, position: "relative" }}>
            <div style={{ transform: `translateY(${visibleRange.start * ITEM_HEIGHT}px)` }}>
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
        ) : filteredFiles.length === 0 ? (
          <div className="py-10 text-center text-[0.8125rem] text-[oklch(0.60_0.03_250)]">
            <Search className="size-5 mx-auto mb-2 opacity-40" />
            <p>No files match your filter.</p>
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
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center justify-center gap-3 text-[0.6875rem] font-mono text-[oklch(0.40_0.03_250)] pt-1 select-none">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded-[4px] bg-[oklch(0.20_0.02_250)] border border-[oklch(0.30_0.02_250)]">/</kbd>
          search
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded-[4px] bg-[oklch(0.20_0.02_250)] border border-[oklch(0.30_0.02_250)]">e</kbd>
          expand
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded-[4px] bg-[oklch(0.20_0.02_250)] border border-[oklch(0.30_0.02_250)]">c</kbd>
          collapse
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded-[4px] bg-[oklch(0.20_0.02_250)] border border-[oklch(0.30_0.02_250)]">w</kbd>
          wrap
        </span>
      </div>
    </div>
  );
}
