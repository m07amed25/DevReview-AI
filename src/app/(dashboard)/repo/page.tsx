"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Plus, X, RefreshCw, FolderGit2, Github } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { StatsCards } from "./stats-cards";
import { ConnectedRepoCard } from "./connected-repo-card";
import { GithubReposPanel } from "./github-repos-panel";

export default function ReposPage() {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [showGitHubRepos, setShowGitHubRepos] = useState(false);
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
      alert(`Failed to connect repositories: ${error.message}`);
    },
  });

  const disconnectMutation = trpc.repository.disconnect.useMutation({
    onSuccess: () => {
      connectedRepos.refetch();
    },
  });

  const connectedIds = new Set(
    connectedRepos.data?.map((repo) => repo.githubId) ?? [],
  );
  const availableRepos =
    githubRepos.data?.filter((r) => !connectedIds.has(r.githubId)) ?? [];
  const filteredRepos = availableRepos.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleRepo = (githubId: number) => {
    const next = new Set(selectedRepos);
    if (next.has(githubId)) next.delete(githubId);
    else next.add(githubId);
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

      {/* Stats */}
      {(connectedRepos.data || connectedRepos.isLoading) && (
        <StatsCards
          connectedCount={connectedRepos.data?.length ?? 0}
          connectedPrivate={
            connectedRepos.data?.filter((r) => r.private).length ?? 0
          }
          connectedPublic={
            connectedRepos.data?.filter((r) => !r.private).length ?? 0
          }
          availableCount={availableRepos.length}
          totalGithubCount={githubRepos.data?.length ?? 0}
          selectedCount={selectedRepos.size}
          isLoading={connectedRepos.isLoading}
        />
      )}

      {/* Connected Repositories */}
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
              <FolderGit2 className="size-3.5" />
              {connectedRepos.data.length}
            </Badge>
          )}
        </div>

        {connectedRepos.isLoading ? (
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          </CardContent>
        ) : connectedRepos.data && connectedRepos.data.length > 0 ? (
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectedRepos.data.map((repo) => (
                <ConnectedRepoCard
                  key={repo.id}
                  repo={repo}
                  isDeleting={disconnectMutation.isPending}
                  onDelete={setRepoToDelete}
                />
              ))}
            </div>
          </CardContent>
        ) : (
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center max-w-sm mx-auto">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                  <FolderGit2 className="w-10 h-10 text-violet-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No repositories connected
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Connect your GitHub repositories to start tracking pull requests
                and managing your development workflow.
              </p>
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
            </div>
          </CardContent>
        )}
      </Card>

      {/* GitHub Import Panel */}
      {showGitHubRepos && (
        <GithubReposPanel
          availableRepos={availableRepos}
          filteredRepos={filteredRepos}
          selectedRepos={selectedRepos}
          searchQuery={searchQuery}
          isLoading={githubRepos.isLoading}
          isFetching={githubRepos.isFetching}
          error={
            githubRepos.error as {
              message?: string;
              data?: { code?: string };
            } | null
          }
          isConnecting={connectMutation.isPending}
          onToggle={toggleRepo}
          onSelectAll={() =>
            setSelectedRepos(new Set(availableRepos.map((r) => r.githubId)))
          }
          onClearSelection={() => setSelectedRepos(new Set())}
          onConnect={handleConnect}
          onRefresh={() => githubRepos.refetch()}
          onSearchChange={setSearchQuery}
        />
      )}

      {/* Disconnect confirmation */}
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
      </AlertDialog>

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
