"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RepoSelectItem } from "@/features/repo/components/RepoSelectItem";
import {
  RefreshCw,
  Search,
  X,
  Plus,
  Github,
  CheckCircle,
  SortAsc,
  Star,
  Clock,
  AlignJustify,
  LayoutGrid,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GitHubRepo {
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  stars: number;
  language: string | null;
  updatedAt: string;
}

type SortKey = "name" | "stars" | "updated";

interface GithubReposPanelProps {
  availableRepos: GitHubRepo[];
  filteredRepos: GitHubRepo[];
  selectedRepos: Set<number>;
  searchQuery: string;
  isLoading: boolean;
  isFetching: boolean;
  error?: { message?: string; data?: { code?: string } } | null;
  isConnecting: boolean;
  onToggle: (id: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onConnect: () => void;
  onRefresh: () => void;
  onSearchChange: (q: string) => void;
}

const sortLabels: Record<SortKey, string> = {
  name: "Name",
  stars: "Stars",
  updated: "Last Updated",
};

export function GithubReposPanel({
  availableRepos,
  filteredRepos,
  selectedRepos,
  searchQuery,
  isLoading,
  isFetching,
  error,
  isConnecting,
  onToggle,
  onSelectAll,
  onClearSelection,
  onConnect,
  onRefresh,
  onSearchChange,
}: GithubReposPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [gridView, setGridView] = useState(true);

  const handleConnectGithub = async () => {
    const { linkSocial } = await import("@/lib/auth-client");
    await linkSocial({ provider: "github", callbackURL: window.location.href });
  };

  const sortedRepos = [...filteredRepos].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "stars") return b.stars - a.stars;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const allSelected =
    availableRepos.length > 0 &&
    selectedRepos.size === availableRepos.length;
  const someSelected = selectedRepos.size > 0 && !allSelected;

  const privateCount = availableRepos.filter((r) => r.private).length;
  const publicCount = availableRepos.length - privateCount;

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      {/* ── Panel Header ── */}
      <div className="border-b border-border bg-card px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-foreground/5 border border-border shrink-0">
              <Github className="size-5 text-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-foreground">
                Import GitHub Repositories
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select repositories from your GitHub account to connect.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isLoading && !error && availableRepos.length > 0 && (
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground border border-border rounded-lg px-3 py-1.5 bg-muted/30">
                <span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {availableRepos.length}
                  </span>{" "}
                  available
                </span>
                {publicCount > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {publicCount} public
                  </span>
                )}
                {privateCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {privateCount} private
                  </span>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              className="text-muted-foreground hover:text-foreground h-9 w-9"
              disabled={isFetching}
              title="Refresh repositories"
            >
              <RefreshCw
                className={cn("size-4", isFetching && "animate-spin")}
              />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-md" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-3 pt-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 flex flex-col items-center text-center">
            {error.data?.code === "UNAUTHORIZED" ||
            error.data?.code === "PRECONDITION_FAILED" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted border border-border mx-auto">
                  <Github className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Connect your GitHub account
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Link your GitHub account to start importing repositories.
                  </p>
                </div>
                <Button onClick={handleConnectGithub} className="gap-2">
                  <Github className="size-4" />
                  Connect GitHub
                </Button>
              </div>
            ) : (
              <div className="rounded-xl bg-destructive/8 border border-destructive/20 p-5 text-center max-w-sm">
                <p className="text-sm font-medium text-destructive mb-1">
                  Failed to load repositories
                </p>
                <p className="text-xs text-destructive/70">
                  {error.message || "An unexpected error occurred."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="mt-3 gap-2"
                >
                  <RefreshCw className="size-3.5" />
                  Try again
                </Button>
              </div>
            )}
          </div>
        ) : availableRepos.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5">
              <CheckCircle className="size-7 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              All repositories connected!
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              All available repositories from your GitHub account have been
              imported.
            </p>
          </div>
        ) : (
          <>
            {/* ── Toolbar: Search + Sort + View Toggle ── */}
            <div className="px-4 py-3 flex items-center gap-2 border-b border-border/60 bg-muted/20">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search repositories…"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 pr-8 h-8 text-sm bg-background border-border focus-visible:ring-1"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange("")}
                    title="Clear search"
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-medium px-3 border-border"
                  >
                    <SortAsc className="size-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">
                      {sortLabels[sortKey]}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {(Object.entries(sortLabels) as [SortKey, string][]).map(
                    ([key, label]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => setSortKey(key)}
                        className="text-xs gap-2"
                      >
                        {key === "name" && (
                          <AlignJustify className="size-3.5 text-muted-foreground" />
                        )}
                        {key === "stars" && (
                          <Star className="size-3.5 text-muted-foreground" />
                        )}
                        {key === "updated" && (
                          <Clock className="size-3.5 text-muted-foreground" />
                        )}
                        {label}
                        {sortKey === key && (
                          <Check className="size-3.5 ml-auto text-primary" />
                        )}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View toggle */}
              <div className="flex items-center border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setGridView(true)}
                  className={cn(
                    "flex items-center justify-center h-8 w-8 transition-colors",
                    gridView
                      ? "bg-foreground/8 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                  title="Grid view"
                >
                  <LayoutGrid className="size-3.5" />
                </button>
                <button
                  onClick={() => setGridView(false)}
                  className={cn(
                    "flex items-center justify-center h-8 w-8 transition-colors border-l border-border",
                    !gridView
                      ? "bg-foreground/8 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                  title="List view"
                >
                  <AlignJustify className="size-3.5" />
                </button>
              </div>
            </div>

            {/* ── Repo List ── */}
            <div className="max-h-130 overflow-y-auto overscroll-contain">
              {sortedRepos.length === 0 ? (
                <div className="py-14 text-center">
                  <Search className="size-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    No results found
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No repositories match &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              ) : (
                <div
                  className={cn(
                    "p-4",
                    gridView
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                      : "flex flex-col gap-2",
                  )}
                >
                  {sortedRepos.map((repo) => (
                    <RepoSelectItem
                      key={repo.githubId}
                      repo={repo}
                      selected={selectedRepos.has(repo.githubId)}
                      onToggle={() => onToggle(repo.githubId)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Sticky Footer ── */}
            <div className="sticky bottom-0 flex items-center justify-between px-5 py-3.5 bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80 border-t border-border shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.08)] z-20">
              {/* Select all toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    allSelected || someSelected
                      ? onClearSelection()
                      : onSelectAll()
                  }
                  className={cn(
                    "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150",
                    allSelected
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : someSelected
                        ? "bg-muted border-border text-muted-foreground hover:text-foreground"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-border/80",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-4 h-4 rounded border-2 transition-colors",
                      allSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : someSelected
                          ? "border-muted-foreground bg-muted-foreground/20"
                          : "border-muted-foreground/50",
                    )}
                  >
                    {allSelected && <Check className="size-2.5" />}
                    {someSelected && (
                      <div className="w-2 h-0.5 bg-muted-foreground rounded-full" />
                    )}
                  </div>
                  <span className="hidden sm:inline">
                    {allSelected
                      ? "Deselect all"
                      : someSelected
                        ? "Clear selection"
                        : "Select all"}
                  </span>
                </button>

                {selectedRepos.size > 0 && (
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">
                      {selectedRepos.size}
                    </span>{" "}
                    of {availableRepos.length} selected
                  </span>
                )}
              </div>

              {/* Connect button */}
              <Button
                disabled={selectedRepos.size === 0 || isConnecting}
                onClick={onConnect}
                size="sm"
                className="gap-2 min-w-32.5 h-9"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" />
                    Connect
                    {selectedRepos.size > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center min-w-4.5 h-4.5 rounded-full bg-primary-foreground/20 text-[10px] font-bold px-1 tabular-nums">
                        {selectedRepos.size}
                      </span>
                    )}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}



