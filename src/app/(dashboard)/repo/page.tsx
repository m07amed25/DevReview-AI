"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectGithub } from "@/components/connect-github";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  GitBranch,
  Lock,
  Globe,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  Star,
  GitPullRequest,
  Search,
  X,
  CheckCircle,
  FolderGit2,
  Type,
  CircleDot,
  Check,
  Minus,
  Square,
  Github,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { languageColors, RepoSelectItem } from "@/components/RepoSelectItem";
import Link from "next/link";
interface GitHubRepo {
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
}

function formatConnectedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Connected today";
  if (diffDays === 1) return "Connected yesterday";
  if (diffDays < 7) return `Connected ${diffDays}d ago`;
  if (diffDays < 30) return `Connected ${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `Connected ${Math.floor(diffDays / 30)}mo ago`;
  return `Connected ${Math.floor(diffDays / 365)}y ago`;
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReposPage() {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [showGitHubRepos, setShowGitHubRepos] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [repoToDelete, setRepoToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const connectedRepos = trpc.repository.list.useQuery();
  const githubRepos = trpc.repository.fetchFromGithub.useQuery(undefined, {
    enabled: showGitHubRepos,
  });

  const connectMutation = trpc.repository.connect.useMutation({
    onSuccess: () => {
      connectedRepos.refetch();

      setSelectedRepos(new Set());
      setShowGitHubRepos(false);
    },
    onError: (error) => {
      console.error("Failed to connect repositories:", error);
      alert(`Failed to connect repositories: ${error.message}`);
    },
  });
  const disconnectMutation = trpc.repository.disconnect.useMutation({
    onSuccess: () => {
      connectedRepos.refetch();
    },
  });

  const connectedIds = new Set(
    connectedRepos.data?.map((repo) => repo.githubId) || [],
  );

  const availableRepos =
    githubRepos.data?.filter((repo) => !connectedIds.has(repo.githubId)) || [];

  const filteredAvailableRepos = availableRepos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleRepo = (githubId: number) => {
    const next = new Set(selectedRepos);
    if (next.has(githubId)) {
      next.delete(githubId);
    } else {
      next.add(githubId);
    }
    setSelectedRepos(next);
  };

  const handleConnect = () => {
    const reposToConnect = availableRepos
      .filter((r) => selectedRepos.has(r.githubId))
      .map((r) => ({
        githubId: r.githubId,
        name: r.name,
        fullName: r.fullName,
        private: r.private,
        htmlUrl: r.htmlUrl,
      }));
    connectMutation.mutate({ repos: reposToConnect });
  };

  const selectAll = () => {
    setSelectedRepos(new Set(availableRepos.map((r) => r.githubId)));
  };

  const clearSelection = () => {
    setSelectedRepos(new Set());
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Repositories
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and connect your GitHub repositories.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowGitHubRepos((v) => !v);
            setSearchQuery("");
            setSelectedRepos(new Set());
          }}
          variant={showGitHubRepos ? "outline" : "default"}
        >
          {showGitHubRepos ? (
            <>
              <X className="size-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="size-4" />
              Connect Repository
            </>
          )}
        </Button>
      </div>
      {/* Statistics Cards */}
      {(connectedRepos.data || connectedRepos.isLoading) && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Connected Repositories Card */}
          {connectedRepos.isLoading ? (
            <>
              <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-16 mb-2" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-16 mb-2" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-16 mb-2" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-violet-600 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/20">
                      <FolderGit2 className="size-4" />
                    </div>
                    Connected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-violet-600 tracking-tight">
                    {connectedRepos.data?.length ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground my-2 flex items-center gap-1.5">
                    <CheckCircle className="size-3 text-violet-500" />
                    Repositories linked
                  </p>
                  {connectedRepos.data && connectedRepos.data.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-violet-500/10">
                      <span className="text-xs text-violet-600/70">
                        {connectedRepos.data.filter((r) => r.private).length}{" "}
                        private,{" "}
                        {connectedRepos.data.filter((r) => !r.private).length}{" "}
                        public
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20">
                      <GitPullRequest className="size-4" />
                    </div>
                    Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-emerald-600 tracking-tight">
                    {availableRepos.length}
                  </div>
                  <p className="text-xs text-muted-foreground my-2 flex items-center gap-1.5">
                    <Globe className="size-3 text-emerald-500" />
                    GitHub repositories
                  </p>
                  {githubRepos.data && githubRepos.data.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-emerald-500/10">
                      <span className="text-xs text-emerald-600/70">
                        {Math.round(
                          (availableRepos.length / githubRepos.data.length) *
                            100,
                        )}
                        % not connected
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/20">
                      <Star className="size-4" />
                    </div>
                    Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600 tracking-tight">
                    {selectedRepos.size}
                  </div>
                  <p className="text-xs text-muted-foreground my-2 flex items-center gap-1.5">
                    <Check className="size-3 text-blue-500" />
                    Selected to connect
                  </p>
                  {availableRepos.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-500/10">
                      <div className="w-full bg-blue-500/20 rounded-full h-1.5 mb-1">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.round((selectedRepos.size / availableRepos.length) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-blue-600/70">
                        {Math.round(
                          (selectedRepos.size / availableRepos.length) * 100,
                        )}
                        % of available
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
      {/* Connected Repositories Section */}
      <Card className="overflow-hidden">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Your Connected Repositories</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Repositories linked to your account.
            </p>
          </div>
          {connectedRepos.data && connectedRepos.data.length > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              <FolderGit2 className="size-3.5" aria-hidden="true" />
              {connectedRepos.data.length}
            </Badge>
          )}
        </div>
        {connectedRepos.isLoading ? (
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </CardContent>
        ) : connectedRepos.data && connectedRepos.data.length > 0 ? (
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {connectedRepos.data.map((repo) => (
                <div
                  key={repo.id}
                  className="flex flex-col sm:flex-row items-start gap-3 p-3 sm:p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/40 transition-colors"
                >
                  <FolderGit2 className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate text-sm sm:text-base">
                        {repo.name}
                      </span>
                      {repo.private ? (
                        <Lock className="size-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <Globe className="size-3.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    {repo.fullName && (
                      <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                        {repo.fullName}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-border/50">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="size-3" aria-hidden="true" />
                        <time dateTime={repo.createdAt.toString()}>
                          {formatConnectedDate(repo.createdAt.toString())}
                        </time>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-foreground hover:border-primary/50 shrink-0 text-xs h-8 transition-colors"
                        asChild
                      >
                        <Link
                          href={`/repo/${repo.id}`}
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <GitPullRequest
                            className="size-4"
                            aria-hidden="true"
                          />
                          <span>PRs</span>
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 w-full sm:w-auto mt-3 sm:mt-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground shrink-0 h-9 w-9 sm:h-10 sm:w-10"
                      asChild
                    >
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive shrink-0 h-9 w-9 sm:h-10 sm:w-10"
                      onClick={() => {
                        setRepoToDelete({ id: repo.id, name: repo.name });
                      }}
                      disabled={disconnectMutation.isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        ) : (
          <CardContent className="py-8 text-center">
            {githubRepos.error?.data?.code === "PRECONDITION_FAILED" ? (
              <Button
                onClick={async () => {
                  const { linkSocial } = await import("@/lib/auth-client");
                  await linkSocial({
                    provider: "github",
                    callbackURL: window.location.href,
                  });
                }}
                className="gap-2"
              >
                <Github className="size-4" />
                Connect GitHub
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setShowGitHubRepos(true);
                  setSearchQuery("");
                  setSelectedRepos(new Set());
                }}
                className="gap-2"
              >
                <Plus className="size-4" />
                Connect Repository
              </Button>
            )}
          </CardContent>
        )}
      </Card>
      {showGitHubRepos && (
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
                variant={"ghost"}
                size={"icon-sm"}
                onClick={() => githubRepos.refetch()}
                className="text-muted-foreground hover:text-foreground"
                disabled={githubRepos.isFetching}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    githubRepos.isFetching && "animate-spin",
                  )}
                />
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {githubRepos.isLoading ? (
              <div className="p-6 space-y-3">
                {[
                  ...Array(4).map((_, i) => (
                    <Skeleton key={i} className="h-16  w-full rounded-lg" />
                  )),
                ]}
              </div>
            ) : githubRepos.error ? (
              <div className="p-6">
                {githubRepos.error.data?.code === "UNAUTHORIZED" ||
                githubRepos.error.data?.code === "PRECONDITION_FAILED" ? (
                  <Button
                    onClick={async () => {
                      const { linkSocial } = await import("@/lib/auth-client");
                      await linkSocial({
                        provider: "github",
                        callbackURL: window.location.href,
                      });
                    }}
                    className="gap-2"
                  >
                    <Github className="size-4" />
                    Connect GitHub
                  </Button>
                ) : (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-center">
                    <p className="text-sm text-destructive">
                      {githubRepos.error.message ||
                        "Failed to load repositories."}
                    </p>
                  </div>
                )}
              </div>
            ) : githubRepos.data && githubRepos.data.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>No repositories found on your GitHub account.</p>
                <p className="text-sm mt-2">
                  Create a repository on GitHub first, then come back here.
                </p>
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
                <div className="px-6 py-4 flex items-center gap-3 border-b border-border/60">
                  <Search className="size-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Search Repos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <div className="max-h-100 overflow-y-auto">
                  {filteredAvailableRepos.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <p>No repositories found matching your search.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {filteredAvailableRepos.map((repo) => (
                        <div key={repo.githubId}>
                          <RepoSelectItem
                            repo={repo}
                            selected={selectedRepos.has(repo.githubId)}
                            onToggle={() => toggleRepo(repo.githubId)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 cursor-pointer",
                        selectedRepos.size > 0
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground hover:bg-muted/80",
                      )}
                      onClick={() => {
                        if (selectedRepos.size === availableRepos.length) {
                          clearSelection();
                        } else {
                          selectAll();
                        }
                      }}
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
                      onClick={clearSelection}
                      disabled={
                        selectedRepos.size === 0 || connectMutation.isPending
                      }
                      className="hidden sm:flex"
                    >
                      Clear
                    </Button>
                    <Button
                      disabled={
                        selectedRepos.size === 0 || connectMutation.isPending
                      }
                      onClick={handleConnect}
                      className="min-w-[140px]"
                    >
                      {connectMutation.isPending ? (
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
      )}
      <AlertDialog
        open={!!repoToDelete}
        onOpenChange={() => setRepoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repository</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to disconnect "${repoToDelete?.name}"? This will remove the repository from your connected list.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setRepoToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (repoToDelete) {
                  disconnectMutation.mutate({ id: repoToDelete.id });
                  setRepoToDelete(null);
                }
              }}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>{" "}
      {/* Developer Credit */}
      <div className="mt-8 pt-6 border-t border-border/30 text-center">
        <p className="text-sm text-muted-foreground">
          Developed by{" "}
          <a
            href="mailto:m07hamedreda25@gmail.com"
            className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
          >
            Mohamed Reda
          </a>{" "}
          -{" "}
          <a
            href="mailto:m07hamedreda25@gmail.com"
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            m07hamedreda25@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

// function RepoSelectItem({
//   repo,
//   selected,
//   onToggle,
// }: {
//   repo: GitHubRepo;
//   selected: boolean;
//   onToggle: () => void;
// }) {
//   const [isHovered, setIsHovered] = useState(false);

//   const langStyle = repo.language
//     ? languageColors[repo.language] || languageColors.Unknown
//     : languageColors.Unknown;

//   return (
//     <div
//       onClick={onToggle}
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//       className={cn(
//         "group relative overflow-hidden rounded-none border p-5 transition-all duration-200 cursor-pointer",
//         selected
//           ? "border-primary bg-primary/5 shadow-sm"
//           : "border-transparent bg-card hover:border-primary/40 hover:bg-muted/30 shadow-sm",
//       )}
//     >
//       {/* Selection indicator bar */}
//       <div
//         className={cn(
//           "absolute left-0 top-0 bottom-0 w-1 transition-colors duration-200",
//           selected ? "bg-primary" : "bg-transparent group-hover:bg-primary/20",
//         )}
//       />

//       {/* Background pattern for selected state */}
//       {selected && <div className="absolute inset-0 bg-primary/5" />}

//       <div className="relative z-10 ml-2">
//         {/* Header */}
//         <div className="flex items-start justify-between gap-4 mb-4">
//           <div className="flex items-center gap-4 min-w-0 flex-1">
//             {/* Icon */}
//             <div
//               className={cn(
//                 "relative flex shrink-0 items-center justify-center rounded-xl transition-all duration-200 size-11",
//                 selected
//                   ? "bg-primary text-primary-foreground shadow-sm"
//                   : "bg-muted/60 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary/80",
//               )}
//             >
//               <FolderGit2 className="h-5 w-5" />

//               {/* Selection checkmark overlay */}
//               {selected && (
//                 <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-primary-foreground rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-95 duration-150">
//                   <svg
//                     className="h-3 w-3 text-primary"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                     strokeWidth={3}
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M5 13l4 4L19 7"
//                     />
//                   </svg>
//                 </div>
//               )}
//             </div>

//             {/* Title & Subtitle */}
//             <div className="min-w-0 flex-1">
//               <div className="flex items-center gap-2 flex-wrap">
//                 <h3
//                   className={cn(
//                     "font-bold text-lg truncate transition-colors duration-200",
//                     selected
//                       ? "text-foreground"
//                       : "text-foreground/90 group-hover:text-foreground",
//                   )}
//                 >
//                   {repo.name}
//                 </h3>
//                 <span
//                   className={cn(
//                     "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
//                     repo.private
//                       ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
//                       : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
//                   )}
//                 >
//                   {repo.private ? (
//                     <Lock className="h-3 w-3" />
//                   ) : (
//                     <Globe className="h-3 w-3" />
//                   )}
//                   <span className="font-medium">
//                     {repo.private ? "Private" : "Public"}
//                   </span>
//                 </span>
//               </div>
//               <p className="text-sm text-muted-foreground/70 truncate font-mono mt-0.5">
//                 {repo.fullName}
//               </p>
//             </div>
//           </div>

//           {/* Checkbox */}
//           <div className="shrink-0">
//             <Checkbox
//               checked={selected}
//               onCheckedChange={onToggle}
//               className={cn(
//                 "h-5 w-5 border-2 transition-all duration-200",
//                 selected && "bg-primary border-primary shadow-sm",
//               )}
//             />
//           </div>
//         </div>

//         {/* Description */}
//         {repo.description && (
//           <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-4 pl-16 min-h-[2.5rem]">
//             {repo.description}
//           </p>
//         )}

//         {/* Stats Row */}
//         <div className="flex items-center gap-3 pl-4 flex-wrap">
//           {/* Language */}
//           {repo.language && (
//             <div
//               className={cn(
//                 "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
//                 langStyle.bg,
//                 langStyle.text,
//                 "ring-1",
//                 langStyle.ring,
//               )}
//             >
//               <CircleDot className="h-3 w-3" />
//               {repo.language}
//             </div>
//           )}

//           {/* Stars */}
//           {repo.stars > 0 && (
//             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 dark:bg-muted/40 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors">
//               <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
//               <span>
//                 {repo.stars >= 1000
//                   ? `${(repo.stars / 1000).toFixed(1)}k`
//                   : repo.stars}
//               </span>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

//                   ? `${(repo.stars / 1000).toFixed(1)}k`
//                   : repo.stars}
//               </span>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
