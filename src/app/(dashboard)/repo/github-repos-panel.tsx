"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RepoSelectItem } from "@/components/RepoSelectItem";
import {
  RefreshCw,
  Search,
  X,
  Plus,
  Check,
  Minus,
  Square,
  Github,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GitHubRepo {
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description?: string | null;
  stars?: number;
  language?: string | null;
}

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
  const handleConnectGithub = async () => {
    const { linkSocial } = await import("@/lib/auth-client");
    await linkSocial({ provider: "github", callbackURL: window.location.href });
  };

  return (
    <Card className="overflow-hidden rounded-none">
      <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Import Github Repositories</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select repositories to import from your GitHub account.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            className="text-muted-foreground hover:text-foreground"
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6">
            {error.data?.code === "UNAUTHORIZED" ||
            error.data?.code === "PRECONDITION_FAILED" ? (
              <Button onClick={handleConnectGithub} className="gap-2">
                <Github className="size-4" />
                Connect GitHub
              </Button>
            ) : (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-center">
                <p className="text-sm text-destructive">
                  {error.message || "Failed to load repositories."}
                </p>
              </div>
            )}
          </div>
        ) : availableRepos.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto size-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="size-6 text-emerald-500" />
            </div>
            <p className="mt-4 font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-2">
              You have connected all available repositories from your GitHub
              account.
            </p>
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="px-6 py-4 flex items-center gap-3 border-b border-border/60">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search Repos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Repo list */}
            <div className="max-h-100 overflow-y-auto">
              {filteredRepos.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No repositories found matching your search.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredRepos.map((repo) => (
                    <div key={repo.githubId}>
                      <RepoSelectItem
                        repo={repo}
                        selected={selectedRepos.has(repo.githubId)}
                        onToggle={() => onToggle(repo.githubId)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 cursor-pointer",
                    selectedRepos.size > 0
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                  onClick={() =>
                    selectedRepos.size === availableRepos.length
                      ? onClearSelection()
                      : onSelectAll()
                  }
                >
                  {selectedRepos.size === availableRepos.length &&
                  availableRepos.length > 0 ? (
                    <Check className="h-4 w-4" />
                  ) : selectedRepos.size > 0 ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </div>
                <p className="text-sm">
                  <span className="font-semibold text-foreground">
                    {selectedRepos.size}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    of {availableRepos.length}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  disabled={selectedRepos.size === 0 || isConnecting}
                  className="hidden sm:flex"
                >
                  Clear
                </Button>
                <Button
                  disabled={selectedRepos.size === 0 || isConnecting}
                  onClick={onConnect}
                  className="min-w-[140px]"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Connect</span>
                      {selectedRepos.size > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-xs font-medium">
                          {selectedRepos.size}
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
