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
import { Plus, X, RefreshCw, FolderGit2, Github, Lock, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ConnectedRepoCard } from "@/features/repo/components/connected-repo-card";
import { GithubReposPanel } from "@/features/repo/components/github-repos-panel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ease = [0.16, 1, 0.3, 1] as const;

export default function ReposPage() {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [showGitHubRepos, setShowGitHubRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [repoToDelete, setRepoToDelete] = useState<{ id: string; name: string } | null>(null);

  const connectedRepos = trpc.repository.list.useQuery();
  const githubRepos = trpc.repository.fetchFromGithub.useQuery(undefined, { enabled: showGitHubRepos });

  const connectMutation = trpc.repository.connect.useMutation({
    onSuccess: () => {
      connectedRepos.refetch();
      setSelectedRepos(new Set());
      setShowGitHubRepos(false);
      toast.success("Repositories connected");
    },
    onError: (error) => toast.error(error.message || "Failed to connect"),
  });

  const disconnectMutation = trpc.repository.disconnect.useMutation({
    onSuccess: () => {
      connectedRepos.refetch();
      toast.success("Repository disconnected");
      setRepoToDelete(null);
    },
    onError: (error) => toast.error(error.message || "Failed to disconnect"),
  });

  const connectedIds = new Set(connectedRepos.data?.map((r) => r.githubId) ?? []);
  const availableRepos = githubRepos.data?.filter((r) => !connectedIds.has(r.githubId)) ?? [];
  const filteredRepos = availableRepos.filter(
    (r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase()),
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
      .map((r) => ({ githubId: r.githubId, name: r.name, fullName: r.fullName, private: r.private, htmlUrl: r.htmlUrl }));
    connectMutation.mutate({ repos: reposToConnect });
  };

  const repos = connectedRepos.data ?? [];
  const privateCount = repos.filter((r) => r.private).length;
  const publicCount = repos.length - privateCount;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Your repositories</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {repos.length > 0 ? (
              <span className="flex items-center gap-2.5">
                <span className="font-mono text-foreground/80">{repos.length}</span>
                <span>watching for pull requests</span>
                <span className="text-border">·</span>
                {privateCount > 0 && <span className="flex items-center gap-1"><Lock className="h-3 w-3" />{privateCount} private</span>}
                {privateCount > 0 && publicCount > 0 && <span className="text-border">·</span>}
                {publicCount > 0 && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{publicCount} public</span>}
              </span>
            ) : (
              "Link a GitHub repo and reviews start on the next PR. Takes about 30 seconds."
            )}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => { setShowGitHubRepos((v) => !v); setSearchQuery(""); setSelectedRepos(new Set()); }}
          variant={showGitHubRepos ? "outline" : "default"}
          className="h-8 gap-1.5 text-[13px] shrink-0"
        >
          {showGitHubRepos ? <><X className="h-3.5 w-3.5" />Close</> : <><Github className="h-3.5 w-3.5" />Add repos</>}
        </Button>
      </motion.div>

      {/* Import panel */}
      <AnimatePresence>
        {showGitHubRepos && (
          <motion.div
            key="import"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <GithubReposPanel
              availableRepos={availableRepos}
              filteredRepos={filteredRepos}
              selectedRepos={selectedRepos}
              searchQuery={searchQuery}
              isLoading={githubRepos.isLoading}
              isFetching={githubRepos.isFetching}
              error={githubRepos.error as { message?: string; data?: { code?: string } } | null}
              isConnecting={connectMutation.isPending}
              onToggle={toggleRepo}
              onSelectAll={() => setSelectedRepos(new Set(availableRepos.map((r) => r.githubId)))}
              onClearSelection={() => setSelectedRepos(new Set())}
              onConnect={handleConnect}
              onRefresh={() => githubRepos.refetch()}
              onSearchChange={setSearchQuery}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Repo grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease }}
      >
        {connectedRepos.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-sm" />
            ))}
          </div>
        ) : repos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {repos.map((repo, i) => (
                <motion.div
                  key={repo.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: i * 0.03, ease }}
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15, ease }}
            className="border border-dashed border-border rounded-sm py-20 flex flex-col items-center text-center"
          >
            <div className="relative mb-5">
              <FolderGit2 className="h-10 w-10 text-muted-foreground/20" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary/40"
              />
            </div>
            <p className="text-[15px] font-medium mb-1.5">Start watching a repo</p>
            <p className="text-[13px] text-muted-foreground max-w-[32ch] leading-relaxed mb-6">
              Once connected, every pull request gets an AI review before you even open it.
            </p>
            {githubRepos.error?.data?.code === "PRECONDITION_FAILED" ? (
              <Button
                size="sm"
                className="h-8 gap-1.5 text-[13px]"
                onClick={async () => {
                  const { linkSocial } = await import("@/lib/auth-client");
                  await linkSocial({ provider: "github", callbackURL: window.location.href });
                }}
              >
                <Github className="h-3.5 w-3.5" />
                Link GitHub account
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 gap-1.5 text-[13px]"
                onClick={() => { setShowGitHubRepos(true); setSearchQuery(""); setSelectedRepos(new Set()); }}
              >
                <Plus className="h-3.5 w-3.5" />
                Choose repos
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Disconnect dialog */}
      <AlertDialog open={!!repoToDelete} onOpenChange={() => setRepoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect repository?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium text-foreground">{repoToDelete?.name}</span> from your account. You can reconnect it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRepoToDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { if (repoToDelete) disconnectMutation.mutate({ id: repoToDelete.id }); }}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Disconnect"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
