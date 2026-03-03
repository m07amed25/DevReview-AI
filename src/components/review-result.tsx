"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bug,
  Shield,
  Zap,
  Paintbrush,
  Lightbulb,
  FileCode2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  CircleDot,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  Wand2,
  Sparkles,
  AlertTriangle,
  Info,
  TrendingUp,
  ArrowRight,
  Activity,
  Search,
  X,
  ChevronsUpDown,
  ChevronsDownUp,
  Download,
  FolderOpen,
  List,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

// Types
type SortKey = "severity" | "file" | "line" | "category";
type SortDir = "asc" | "desc";
type ViewMode = "list" | "grouped";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface ReviewComment {
  file: string;
  line: number;
  severity: string;
  category?: string;
  message: string;
  suggestion?: string;
}

interface ReviewResultProps {
  review: {
    id: string;
    status: string;
    summary: string | null;
    riskScore: number | null;
    comments: ReviewComment[] | unknown;
    error: string | null;
    createdAt: Date;
  };
  onRetry?: () => void;
  isRetrying?: boolean;
}

function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(undefined);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

export function ReviewResult({
  review,
  onRetry,
  isRetrying,
}: ReviewResultProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeSeverities, setActiveSeverities] = useState<Set<string>>(
    new Set(),
  );
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [allExpanded, setAllExpanded] = useState<boolean | null>(null);
  const [expandKey, setExpandKey] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll("[data-animate-in]");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: "power3.out",
      },
    );
  }, [review.status]);

  if (review.status === "PENDING") {
    return <PendingCard />;
  }

  if (review.status === "PROCESSING") {
    return <ProcessingCard />;
  }

  if (review.status === "FAILED") {
    return (
      <FailedCard
        error={review.error}
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    );
  }

  const comments = Array.isArray(review.comments)
    ? (review.comments as ReviewComment[])
    : [];

  const severityCounts = {
    critical: comments.filter((c) => c.severity === "critical").length,
    high: comments.filter((c) => c.severity === "high").length,
    medium: comments.filter((c) => c.severity === "medium").length,
    low: comments.filter((c) => c.severity === "low").length,
  };

  const totalIssues = comments.length;

  const allCategories = Array.from(
    new Set(comments.map((c) => c.category).filter(Boolean) as string[]),
  );

  const toggleSeverity = (sev: string) => {
    setActiveSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveSeverities(new Set());
    setActiveCategories(new Set());
    setSearchQuery("");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleExpandAll = () => {
    setAllExpanded((prev) => prev !== true);
    setExpandKey((k) => k + 1);
  };

  const filteredComments = comments.filter((c) => {
    if (activeSeverities.size > 0 && !activeSeverities.has(c.severity))
      return false;
    if (
      activeCategories.size > 0 &&
      (!c.category || !activeCategories.has(c.category))
    )
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.message.toLowerCase().includes(q) ||
        c.file.toLowerCase().includes(q) ||
        (c.suggestion?.toLowerCase().includes(q) ?? false) ||
        (c.category?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const sortedComments = [...filteredComments].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "severity":
        cmp =
          (SEVERITY_ORDER[a.severity] ?? 99) -
          (SEVERITY_ORDER[b.severity] ?? 99);
        break;
      case "file":
        cmp = a.file.localeCompare(b.file);
        break;
      case "line":
        cmp = a.line - b.line;
        break;
      case "category":
        cmp = (a.category ?? "").localeCompare(b.category ?? "");
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const groupedByFile = sortedComments.reduce(
    (acc, comment) => {
      const key = comment.file;
      if (!acc[key]) acc[key] = [];
      acc[key].push(comment);
      return acc;
    },
    {} as Record<string, ReviewComment[]>,
  );

  const hasActiveFilters =
    activeSeverities.size > 0 ||
    activeCategories.size > 0 ||
    searchQuery !== "";

  const exportMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# Code Review Report`);
    lines.push("");
    lines.push(`- **Risk Score:** ${review.riskScore ?? "N/A"} / 100`);
    lines.push(`- **Total Issues:** ${totalIssues}`);
    lines.push(`- **Date:** ${new Date(review.createdAt).toLocaleString()}`);
    lines.push("");
    if (review.summary) {
      lines.push(`## AI Summary`);
      lines.push("");
      lines.push(review.summary);
      lines.push("");
    }
    lines.push(`## Severity Breakdown`);
    lines.push("");
    lines.push(`| Severity | Count |`);
    lines.push(`| -------- | ----- |`);
    lines.push(`| Critical | ${severityCounts.critical} |`);
    lines.push(`| High     | ${severityCounts.high} |`);
    lines.push(`| Medium   | ${severityCounts.medium} |`);
    lines.push(`| Low      | ${severityCounts.low} |`);
    lines.push("");
    if (comments.length > 0) {
      lines.push(`## Issues`);
      lines.push("");
      comments.forEach((c, i) => {
        lines.push(
          `### ${i + 1}. [${c.severity.toUpperCase()}] ${c.file}:${c.line}`,
        );
        lines.push("");
        if (c.category) lines.push(`**Category:** ${c.category}`);
        lines.push("");
        lines.push(c.message);
        if (c.suggestion) {
          lines.push("");
          lines.push(`> **Suggestion:** ${c.suggestion}`);
        }
        lines.push("");
        lines.push("---");
        lines.push("");
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `review-${review.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={containerRef} className="space-y-5">
      <div data-animate-in>
        <RiskScoreCard
          score={review.riskScore ?? 0}
          totalIssues={totalIssues}
          createdAt={review.createdAt}
        />
      </div>

      <div data-animate-in className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SeverityStatCard
          label="Critical"
          count={severityCounts.critical}
          icon={XCircle}
          color="red"
          active={activeSeverities.has("critical")}
          onClick={() => toggleSeverity("critical")}
        />
        <SeverityStatCard
          label="High"
          count={severityCounts.high}
          icon={AlertTriangle}
          color="orange"
          active={activeSeverities.has("high")}
          onClick={() => toggleSeverity("high")}
        />
        <SeverityStatCard
          label="Medium"
          count={severityCounts.medium}
          icon={Info}
          color="amber"
          active={activeSeverities.has("medium")}
          onClick={() => toggleSeverity("medium")}
        />
        <SeverityStatCard
          label="Low"
          count={severityCounts.low}
          icon={TrendingUp}
          color="slate"
          active={activeSeverities.has("low")}
          onClick={() => toggleSeverity("low")}
        />
      </div>

      <div data-animate-in>
        <SeverityDistributionBar counts={severityCounts} total={totalIssues} />
      </div>

      {review.summary && (
        <div data-animate-in>
          <AISummaryCard summary={review.summary} />
        </div>
      )}

      {comments.length > 0 ? (
        <div data-animate-in className="space-y-3">
          <CommentsToolbar
            totalComments={comments.length}
            filteredCount={sortedComments.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            allCategories={allCategories}
            activeCategories={activeCategories}
            onToggleCategory={toggleCategory}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            viewMode={viewMode}
            onToggleViewMode={() =>
              setViewMode((m) => (m === "list" ? "grouped" : "list"))
            }
            allExpanded={allExpanded}
            onToggleExpandAll={toggleExpandAll}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onExport={exportMarkdown}
          />
          {sortedComments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="size-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No comments match your filters
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-xs gap-1.5"
                  onClick={clearFilters}
                >
                  <X className="size-3" />
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "list" ? (
            <div className="space-y-2.5">
              {sortedComments.map((comment, index) => (
                <CommentCard
                  key={`${comment.file}:${comment.line}:${index}`}
                  comment={comment}
                  index={index}
                  forceExpanded={allExpanded}
                  expandKey={expandKey}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByFile).map(([file, fileComments]) => (
                <FileGroup
                  key={file}
                  file={file}
                  comments={fileComments}
                  allExpanded={allExpanded}
                  expandKey={expandKey}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        review.status === "COMPLETED" && (
          <div data-animate-in>
            <NoIssuesCard />
          </div>
        )
      )}
    </div>
  );
}

function CommentsToolbar({
  totalComments,
  filteredCount,
  searchQuery,
  onSearchChange,
  allCategories,
  activeCategories,
  onToggleCategory,
  sortKey,
  sortDir,
  onToggleSort,
  viewMode,
  onToggleViewMode,
  allExpanded,
  onToggleExpandAll,
  hasActiveFilters,
  onClearFilters,
  onExport,
}: {
  totalComments: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  allCategories: string[];
  activeCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  allExpanded: boolean | null;
  onToggleExpandAll: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExport: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(searchQuery !== "");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          Review Comments
        </h2>
        <Badge variant="secondary" className="tabular-nums text-xs">
          {filteredCount !== totalComments
            ? `${filteredCount} / ${totalComments}`
            : totalComments}{" "}
          {totalComments === 1 ? "issue" : "issues"}
        </Badge>

        <div className="flex-1" />

        <Button
          variant={searchOpen ? "secondary" : "ghost"}
          size="sm"
          className="size-8 p-0"
          onClick={() => {
            setSearchOpen((o) => !o);
            if (searchOpen) onSearchChange("");
          }}
          title="Search comments"
        >
          <Search className="size-3.5" />
        </Button>

        <Button
          variant={viewMode === "grouped" ? "secondary" : "ghost"}
          size="sm"
          className="size-8 p-0"
          onClick={onToggleViewMode}
          title={viewMode === "list" ? "Group by file" : "List view"}
        >
          {viewMode === "list" ? (
            <FolderOpen className="size-3.5" />
          ) : (
            <List className="size-3.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={onToggleExpandAll}
          title={allExpanded ? "Collapse all" : "Expand all"}
        >
          {allExpanded ? (
            <ChevronsDownUp className="size-3.5" />
          ) : (
            <ChevronsUpDown className="size-3.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={onExport}
          title="Export as Markdown"
        >
          <Download className="size-3.5" />
        </Button>
      </div>

      {searchOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search comments, files, suggestions…"
            className="w-full h-9 pl-9 pr-9 text-sm rounded-lg border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {(["severity", "file", "line", "category"] as SortKey[]).map(
            (key) => (
              <Button
                key={key}
                variant={sortKey === key ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-[11px] gap-1 capitalize"
                onClick={() => onToggleSort(key)}
              >
                {key}
                {sortKey === key && (
                  <ArrowUpDown
                    className={cn(
                      "size-3 transition-transform",
                      sortDir === "desc" && "rotate-180",
                    )}
                  />
                )}
              </Button>
            ),
          )}
        </div>

        {allCategories.length > 0 && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            {allCategories.map((cat) => {
              const CatIcon = getCategoryIcon(cat);
              return (
                <Button
                  key={cat}
                  variant={activeCategories.has(cat) ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-[11px] gap-1.5 capitalize"
                  onClick={() => onToggleCategory(cat)}
                >
                  <CatIcon className="size-3" />
                  {cat}
                </Button>
              );
            })}
          </>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-[11px] gap-1 text-destructive hover:text-destructive"
            onClick={onClearFilters}
          >
            <X className="size-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function FileGroup({
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

function PendingCard() {
  return (
    <Card className="overflow-hidden border-amber-500/20">
      <CardContent className="p-0">
        <div className="relative py-14 px-6">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-500/8 via-transparent to-amber-500/4" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(245,158,11,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(245,158,11,0.08) 0%, transparent 50%)",
            }}
          />

          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div
                className="absolute inset-0 size-16 rounded-2xl bg-amber-500/20 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div className="relative size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center backdrop-blur-sm">
                <Clock className="size-7 text-amber-500" />
              </div>
            </div>

            <h3 className="text-lg font-semibold">Queued for Review</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
              Your code review is in the queue and will be processed shortly.
            </p>

            <div className="flex items-center gap-1.5 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-2 rounded-full bg-amber-500"
                  style={{
                    animation: "pendingBounce 1.4s ease-in-out infinite",
                    animationDelay: `${i * 160}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <style>{`
        @keyframes pendingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Card>
  );
}

function ProcessingCard() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-0">
        <div className="relative py-14 px-6">
          {/* Scanning line animation */}
          <div
            className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent"
            style={{
              animation: "scanLine 2.5s ease-in-out infinite",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

          <div className="relative flex flex-col items-center text-center">
            {/* Animated circular progress */}
            <div className="relative size-20 mb-6">
              <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  strokeWidth="3"
                  className="stroke-muted/40"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="stroke-primary"
                  style={{
                    strokeDasharray: "214",
                    strokeDashoffset: "140",
                    animation: "processingStroke 2s ease-in-out infinite",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles
                  className="size-7 text-primary"
                  style={{
                    animation: "processingPulse 2s ease-in-out infinite",
                  }}
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold">Analysing Code{dots}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
              AI is scanning for bugs, security vulnerabilities, performance
              issues, and style improvements
            </p>

            {/* Progress steps */}
            <div className="flex items-center gap-6 mt-8 text-xs text-muted-foreground">
              {["Parsing", "Analysing", "Reporting"].map((step, i) => (
                <div key={step} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "size-1.5 rounded-full",
                      i === 0
                        ? "bg-primary"
                        : i === 1
                          ? "bg-primary animate-pulse"
                          : "bg-muted-foreground/30",
                    )}
                  />
                  <span className={cn(i <= 1 && "text-foreground")}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes processingStroke {
          0% { stroke-dashoffset: 214; transform: rotate(0deg); }
          50% { stroke-dashoffset: 80; }
          100% { stroke-dashoffset: 214; transform: rotate(360deg); }
        }
        @keyframes processingPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </Card>
  );
}

function FailedCard({
  error,
  onRetry,
  isRetrying,
}: {
  error: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <Card className="overflow-hidden border-destructive/20">
      <CardContent className="p-0">
        <div className="relative py-16 px-6">
          {/* Subtle error pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-red-500/8 via-transparent to-red-500/3" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 20px,
                rgba(239,68,68,0.02) 20px,
                rgba(239,68,68,0.02) 21px
              )`,
            }}
          />

          <div className="relative text-center">
            <div className="mx-auto size-18 rounded-2xl bg-linear-to-br from-destructive/15 to-destructive/5 border border-destructive/20 flex items-center justify-center mb-6 shadow-lg shadow-red-500/5">
              <XCircle className="size-9 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-destructive">
              Analysis Failed
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              {error ||
                "An unexpected error occurred. Please try again or contact support."}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                className="mt-8 gap-2 border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40 transition-all"
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                {isRetrying ? "Retrying…" : "Retry Analysis"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskScoreCard({
  score,
  totalIssues,
  createdAt,
}: {
  score: number;
  totalIssues: number;
  createdAt?: Date;
}) {
  const config = getRiskConfig(score);
  const RiskIcon = config.icon;
  const animatedScore = useAnimatedNumber(score, 1000);

  // SVG circular gauge
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* Background gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 30% 0%, ${config.glowColor}08 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, ${config.glowColor}05 0%, transparent 60%)`,
            }}
          />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              {/* Circular gauge */}
              <div className="relative shrink-0">
                <svg className="size-36 -rotate-90" viewBox="0 0 128 128">
                  {/* Track */}
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    className="stroke-muted/30"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke={config.markerColor}
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset,
                      transition:
                        "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                  {/* Glow filter */}
                  <defs>
                    <filter id="riskGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke={config.markerColor}
                    filter="url(#riskGlow)"
                    opacity="0.3"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset,
                      transition:
                        "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      "text-4xl font-bold tabular-nums tracking-tighter",
                      config.color,
                    )}
                  >
                    {animatedScore}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium -mt-0.5">
                    / 100
                  </span>
                </div>
              </div>

              {/* Right side info */}
              <div className="flex-1 text-center sm:text-left space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center",
                        config.bg,
                      )}
                    >
                      <RiskIcon className={cn("size-4", config.color)} />
                    </div>
                    <h3 className={cn("text-lg font-bold", config.color)}>
                      {config.label}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>

                {/* Mini stats row */}
                <div className="flex items-center gap-4 justify-center sm:justify-start flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Activity className="size-3.5 text-muted-foreground" />
                    <span className="font-semibold tabular-nums">
                      {totalIssues}
                    </span>
                    <span className="text-muted-foreground">
                      {totalIssues === 1 ? "issue" : "issues"} found
                    </span>
                  </div>
                  {createdAt && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span>{timeAgo(createdAt)}</span>
                    </div>
                  )}
                </div>

                {/* Gradient risk bar */}
                <div className="space-y-1.5">
                  <div className="relative h-2 rounded-full overflow-hidden bg-muted/50">
                    <div className="absolute inset-0 rounded-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500 opacity-20" />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500"
                      style={{
                        width: `${score}%`,
                        transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                    <div
                      className="absolute top-1/2 size-3.5 rounded-full bg-background border-2 shadow-md"
                      style={{
                        left: `${Math.min(Math.max(score, 2), 98)}%`,
                        transform: "translateX(-50%) translateY(-50%)",
                        borderColor: config.markerColor,
                        transition: "left 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">
                      Safe
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">
                      Critical
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const SEVERITY_COLORS = {
  red: {
    bg: "bg-red-500/8 dark:bg-red-500/10",
    border: "border-red-500/15 hover:border-red-500/30",
    icon: "text-red-500",
    text: "text-red-600 dark:text-red-400",
    glow: "shadow-red-500/5",
  },
  orange: {
    bg: "bg-orange-500/8 dark:bg-orange-500/10",
    border: "border-orange-500/15 hover:border-orange-500/30",
    icon: "text-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    glow: "shadow-orange-500/5",
  },
  amber: {
    bg: "bg-amber-500/8 dark:bg-amber-500/10",
    border: "border-amber-500/15 hover:border-amber-500/30",
    icon: "text-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    glow: "shadow-amber-500/5",
  },
  slate: {
    bg: "bg-slate-500/8 dark:bg-slate-500/10",
    border: "border-slate-500/15 hover:border-slate-500/30",
    icon: "text-slate-400 dark:text-slate-500",
    text: "text-slate-600 dark:text-slate-400",
    glow: "shadow-slate-500/5",
  },
} as const;

function SeverityStatCard({
  label,
  count,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: keyof typeof SEVERITY_COLORS;
  active?: boolean;
  onClick?: () => void;
}) {
  const c = SEVERITY_COLORS[color];
  const animatedCount = useAnimatedNumber(count, 800);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 cursor-pointer select-none",
        c.border,
        count > 0 && `shadow-lg ${c.glow}`,
        active && "ring-2 ring-primary/30 border-primary/30",
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div
            className={cn(
              "size-8 rounded-lg flex items-center justify-center",
              c.bg,
            )}
          >
            <Icon className={cn("size-4", c.icon)} />
          </div>
          <span
            className={cn(
              "text-2xl font-bold tabular-nums tracking-tight",
              count > 0 ? c.text : "text-muted-foreground/40",
            )}
          >
            {animatedCount}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {active && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
              <Filter className="size-2.5 mr-0.5" />
              Active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityDistributionBar({
  counts,
  total,
}: {
  counts: { critical: number; high: number; medium: number; low: number };
  total: number;
}) {
  if (total === 0) {
    return (
      <Card className="overflow-hidden border-emerald-500/15">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 bg-emerald-500/20 rounded-full overflow-hidden">
              <div
                className="w-full h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ animation: "shimmer 2s ease-in-out infinite" }}
              />
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              All Clear
            </span>
          </div>
        </CardContent>
        <style>{`
          @keyframes shimmer {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
        `}</style>
      </Card>
    );
  }

  const getWidth = (count: number) =>
    Math.max((count / total) * 100, count > 0 ? 4 : 0);

  const segments = [
    {
      key: "critical",
      count: counts.critical,
      color: "bg-red-500",
      label: "Critical",
    },
    { key: "high", count: counts.high, color: "bg-orange-500", label: "High" },
    {
      key: "medium",
      count: counts.medium,
      color: "bg-amber-500",
      label: "Medium",
    },
    {
      key: "low",
      count: counts.low,
      color: "bg-slate-400 dark:bg-slate-500",
      label: "Low",
    },
  ].filter((s) => s.count > 0);

  return (
    <Card className="overflow-hidden">
      <CardContent className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Distribution
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {total} total
          </span>
        </div>
        <div className="h-3 bg-muted/50 rounded-full overflow-hidden flex gap-0.5">
          {segments.map((seg) => (
            <div
              key={seg.key}
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                seg.color,
              )}
              style={{ width: `${getWidth(seg.count)}%` }}
              title={`${seg.label}: ${seg.count}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {segments.map((seg) => (
            <div key={seg.key} className="flex items-center gap-1.5">
              <div className={cn("size-2.5 rounded-full", seg.color)} />
              <span className="text-xs text-muted-foreground">{seg.label}</span>
              <span className="text-xs font-bold tabular-nums">
                {seg.count}
              </span>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                ({Math.round((seg.count / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AISummaryCard({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false);

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-primary/10">
      <CardContent className="p-0">
        <div className="relative">
          {/* Subtle gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-transparent to-primary/2" />

          <div className="relative p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-linear-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    AI Summary
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      Auto-generated
                    </Badge>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 shrink-0"
                    onClick={copySummary}
                    title="Copy summary"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NoIssuesCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current.querySelector("[data-check-icon]"),
      { scale: 0, rotation: -180 },
      {
        scale: 1,
        rotation: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
        delay: 0.2,
      },
    );
  }, []);

  return (
    <Card ref={cardRef} className="overflow-hidden border-emerald-500/20">
      <CardContent className="p-0">
        <div className="relative py-16 px-6">
          {/* Celebration background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-emerald-500/8 via-transparent to-transparent" />
          {/* Decorative circles */}
          <div className="absolute top-6 left-1/4 size-32 rounded-full bg-emerald-500/5 blur-2xl" />
          <div className="absolute bottom-6 right-1/4 size-24 rounded-full bg-emerald-400/5 blur-2xl" />

          <div className="relative text-center">
            <div
              data-check-icon
              className="mx-auto size-20 rounded-2xl bg-linear-to-br from-emerald-500/15 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="size-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              Excellent Code Quality!
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
              No issues were detected in your code. It follows best practices
              and appears to be clean, secure, and well-structured.
            </p>

            {/* Decorative badges */}
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              {["Clean Code", "Secure", "Well-Structured"].map((label) => (
                <Badge
                  key={label}
                  variant="outline"
                  className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                >
                  <CheckCircle2 className="size-3 mr-1" />
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentCard({
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

  // Sync with parent expand/collapse all
  useEffect(() => {
    if (forceExpanded !== null && forceExpanded !== undefined) {
      setExpanded(forceExpanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandKey]);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
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
      {/* Severity accent line at top */}
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
          {/* Severity indicator */}
          <div
            className={cn(
              "mt-0.5 size-8 rounded-lg flex items-center justify-center shrink-0",
              severityConfig.iconBg,
            )}
          >
            <SeverityIcon severity={comment.severity} />
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Header row */}
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
                  {React.createElement(CategoryIcon, {
                    className: "size-3",
                  })}
                  {comment.category}
                </Badge>
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

            {/* Message */}
            <p
              className={cn(
                "text-sm leading-relaxed text-foreground/90",
                !expanded && "line-clamp-2",
              )}
            >
              {comment.message}
            </p>

            {/* File location */}
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

      {/* Suggestion panel */}
      <div
        ref={contentRef}
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

function SeverityIcon({ severity }: { severity: string }) {
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

function getRiskConfig(score: number) {
  if (score < 25) {
    return {
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      markerColor: "#10b981",
      glowColor: "#10b981",
      label: "Low Risk",
      description: "Your code looks great. Only minor or no issues detected.",
      icon: ShieldCheck,
    };
  }
  if (score < 50) {
    return {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      markerColor: "#f59e0b",
      glowColor: "#f59e0b",
      label: "Medium Risk",
      description:
        "Some issues were found that should be addressed before merging.",
      icon: CircleDot,
    };
  }
  if (score < 75) {
    return {
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      markerColor: "#f97316",
      glowColor: "#f97316",
      label: "High Risk",
      description:
        "Significant issues detected. Review carefully before merging.",
      icon: ShieldAlert,
    };
  }
  return {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    markerColor: "#ef4444",
    glowColor: "#ef4444",
    label: "Critical Risk",
    description:
      "Critical issues found. This code requires immediate attention.",
    icon: ShieldX,
  };
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case "critical":
      return {
        bar: "bg-red-500",
        badge: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
        iconBg: "bg-red-500/10",
        borderHover: "hover:border-red-500/20",
        activeBorder: "border-red-500/15",
      };
    case "high":
      return {
        bar: "bg-orange-500",
        badge:
          "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
        iconBg: "bg-orange-500/10",
        borderHover: "hover:border-orange-500/20",
        activeBorder: "border-orange-500/15",
      };
    case "medium":
      return {
        bar: "bg-amber-500",
        badge:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-500/10",
        borderHover: "hover:border-amber-500/20",
        activeBorder: "border-amber-500/15",
      };
    default:
      return {
        bar: "bg-slate-400 dark:bg-slate-500",
        badge: "border-border bg-muted text-muted-foreground",
        iconBg: "bg-muted",
        borderHover: "hover:border-border",
        activeBorder: "",
      };
  }
}

function getCategoryIcon(category?: string) {
  switch (category) {
    case "bug":
      return Bug;
    case "security":
      return Shield;
    case "performance":
      return Zap;
    case "style":
      return Paintbrush;
    case "suggestion":
      return Lightbulb;
    default:
      return CircleDot;
  }
}
