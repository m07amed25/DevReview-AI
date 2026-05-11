"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

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

  const repoCount = connectedRepos.data?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pt-2"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <FolderGit2 className="size-4.5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Repositories</h1>
            {repoCount > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              >
                {repoCount}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground pl-11.5">
            Connect and manage your GitHub repositories to track pull requests.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setShowGitHubRepos((v) => !v);
            setSearchQuery("");
            setSelectedRepos(new Set());
          }}
          variant={showGitHubRepos ? "outline" : "default"}
          className={cn(
            "h-9 rounded-lg gap-2 font-medium transition-all",
            !showGitHubRepos &&
              "bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20",
          )}
        >
          {showGitHubRepos ? (
            <>
              <X className="size-3.5" />
              Cancel
            </>
          ) : (
            <>
              <Github className="size-3.5" />
              Connect Repository
            </>
          )}
        </Button>
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
      >
        <StatsCards
          connectedCount={repoCount}
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
      </motion.div>

      {/* ── Connected repos ── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm"
      >
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Connected Repositories</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Linked to your account and ready for review.
            </p>
          </div>
          {repoCount > 0 && (
            <Badge variant="outline" className="rounded-full text-xs gap-1 px-2.5 border-border/60">
              <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
              {repoCount} active
            </Badge>
          )}
        </div>

        {/* Body */}
        {connectedRepos.isLoading ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : repoCount > 0 ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {connectedRepos.data!.map((repo, i) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
                >
                  <ConnectedRepoCard
                    repo={repo}
                    isDeleting={disconnectMutation.isPending}
                    onDelete={setRepoToDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Empty state */
          <div className="py-20 flex flex-col items-center text-center px-6">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40">
              <FolderGit2 className="size-7 text-muted-foreground/60" />
            </div>
            <h3 className="text-base font-semibold mb-1">No repositories connected</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-7 leading-relaxed">
              Connect your GitHub repositories to start tracking pull requests
              and get AI-powered code reviews.
            </p>
            {githubRepos.error?.data?.code === "PRECONDITION_FAILED" ? (
              <Button
                size="sm"
                className="rounded-lg gap-2 h-9"
                onClick={async () => {
                  const { linkSocial } = await import("@/lib/auth-client");
                  await linkSocial({
                    provider: "github",
                    callbackURL: window.location.href,
                  });
                }}
              >
                <Github className="size-3.5" />
                Connect GitHub Account
              </Button>
            ) : (
              <Button
                size="sm"
                className="rounded-lg gap-2 h-9"
                onClick={() => {
                  setShowGitHubRepos(true);
                  setSearchQuery("");
                  setSelectedRepos(new Set());
                }}
              >
                <Plus className="size-3.5" />
                Import from GitHub
              </Button>
            )}
          </div>
        )}
      </motion.section>

      {/* ── GitHub import panel ── */}
      <AnimatePresence>
        {showGitHubRepos && (
          <motion.div
            key="import-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Disconnect confirmation ── */}
      <AlertDialog
        open={!!repoToDelete}
        onOpenChange={() => setRepoToDelete(null)}
      >
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect repository?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <span className="font-medium text-foreground">
                {repoToDelete?.name}
              </span>{" "}
              from your connected repositories. You can reconnect it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => setRepoToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-lg"
              onClick={() => {
                if (repoToDelete) {
                  disconnectMutation.mutate({ id: repoToDelete.id });
                  setRepoToDelete(null);
                }
              }}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                "Disconnect"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
