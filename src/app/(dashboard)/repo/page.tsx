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
import { StatsCards } from "@/features/repo/components/stats-cards";
import { ConnectedRepoCard } from "@/features/repo/components/connected-repo-card";
import { GithubReposPanel } from "@/features/repo/components/github-repos-panel";

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
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Repositories
          </h1>
          <p className="text-muted-foreground">
            Connect and manage your GitHub repositories to track pull requests.
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
              <X className="size-4 mr-2" />
              Cancel Import
            </>
          ) : (
            <>
              <Github className="size-4 mr-2" />
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
        <div className="border-b border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <CardContent className="py-20 text-center">
            <div className="flex flex-col items-center max-w-sm mx-auto">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 border border-border mb-6">
                <FolderGit2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">
                No repositories connected
              </h3>
              <p className="text-sm text-muted-foreground mb-8">
                Connect your GitHub repositories to start tracking pull requests and managing your development workflow.
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
                >
                  <Github className="size-4 mr-2" />
                  Connect GitHub Account
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setShowGitHubRepos(true);
                    setSearchQuery("");
                    setSelectedRepos(new Set());
                  }}
                >
                  <Plus className="size-4 mr-2" />
                  Import from GitHub
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
    </div>
  );
}
