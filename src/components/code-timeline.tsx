"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface CodeTimelineProps {
  repositoryId: string;
}

interface CommitNode {
  sha: string;
  message: string;
  author: {
    login: string;
    avatarUrl: string | null;
  };
  date: string;
  htmlUrl: string;
  parents: string[];
  branch?: string;
  branches?: string[];
  isMergeCommit?: boolean;
}

interface Branch {
  name: string;
  sha: string;
  isProtected: boolean;
}

// Branch colors for visualization
const BRANCH_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#6366f1", // indigo
  "#14b8a6", // teal
];

function getBranchColor(branchName: string): string {
  let hash = 0;
  for (let i = 0; i < branchName.length; i++) {
    hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRANCH_COLORS[Math.abs(hash) % BRANCH_COLORS.length];
}

export function CodeTimeline({ repositoryId }: CodeTimelineProps) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<CommitNode | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Fetch branches
  const branches = trpc.repository.getBranches.useQuery(
    { id: repositoryId },
    { enabled: !!repositoryId },
  );

  // Fetch commits
  const commits = trpc.repository.getCommits.useQuery(
    {
      id: repositoryId,
      branch: selectedBranch || undefined,
      page,
      perPage,
    },
    { enabled: !!repositoryId },
  );

  // Process commits and detect branches
  const processedCommits = useMemo(() => {
    if (!commits.data) return [];

    const commitMap = new Map<string, CommitNode>();
    const branchMap = new Map<string, string[]>();
    const activeBranches = new Set<string>();

    // Create commit nodes
    commits.data.forEach((commit) => {
      const node: CommitNode = {
        sha: commit.sha,
        message: commit.message,
        author: commit.author,
        date: commit.date,
        htmlUrl: commit.htmlUrl,
        parents: commit.parents,
        isMergeCommit: commit.parents.length > 1,
      };
      commitMap.set(commit.sha, node);
    });

    // Assign branches to commits based on parent relationships
    commits.data.forEach((commit) => {
      // If commit is the head of a branch, assign that branch
      branches.data?.branches.forEach((branch) => {
        if (branch.sha === commit.sha) {
          if (!branchMap.has(commit.sha)) {
            branchMap.set(commit.sha, []);
          }
          branchMap.get(commit.sha)?.push(branch.name);
          activeBranches.add(branch.name);
        }
      });
    });

    // Propagate branch labels through the commit chain
    const propagateBranches = (sha: string, branchNames: string[]) => {
      const commit = commitMap.get(sha);
      if (!commit) return;

      const currentBranches = branchMap.get(sha) || [];
      const newBranches = [...new Set([...currentBranches, ...branchNames])];

      if (newBranches.length > currentBranches.length) {
        branchMap.set(sha, newBranches);

        // Continue to parent
        commit.parents.forEach((parentSha) => {
          propagateBranches(parentSha, branchNames);
        });
      }
    };

    branches.data?.branches.forEach((branch) => {
      propagateBranches(branch.sha, [branch.name]);
    });

    // Assign branch info to each commit
    return commits.data.map((commit) => {
      const node = commitMap.get(commit.sha)!;
      const branchNames = branchMap.get(commit.sha) || [];
      return {
        ...node,
        branch: branchNames[0],
        branches: branchNames,
      };
    });
  }, [commits.data, branches.data]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  // Handle branch change
  const handleBranchChange = useCallback((branch: string | null) => {
    setSelectedBranch(branch);
    setPage(1);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, commit: CommitNode) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelectedCommit(commit);
      }
    },
    [],
  );

  if (branches.isLoading) {
    return <TimelineSkeleton />;
  }

  if (branches.error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-12 text-center">
          <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <p className="mt-4 font-medium text-destructive">
            Failed to load branches.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {branches.error.message}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => branches.refetch()}
          >
            <RefreshCw className="size-4 mr-2" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Branch Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Branch:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedBranch === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleBranchChange(null)}
            className="text-xs"
          >
            All
          </Button>
          {branches.data?.branches.slice(0, 8).map((branch) => (
            <Button
              key={branch.name}
              variant={selectedBranch === branch.name ? "default" : "outline"}
              size="sm"
              onClick={() => handleBranchChange(branch.name)}
              className="text-xs"
              style={
                selectedBranch === branch.name
                  ? { backgroundColor: getBranchColor(branch.name) }
                  : {}
              }
            >
              <GitBranch
                className="size-3 mr-1"
                style={{ color: getBranchColor(branch.name) }}
              />
              {branch.name}
            </Button>
          ))}
          {branches.data && branches.data.branches.length > 8 && (
            <Badge variant="secondary" className="text-xs">
              +{branches.data.branches.length - 8} more
            </Badge>
          )}
        </div>
      </div>

      {/* Commit Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCommit className="size-4" />
            Commit History
            <Badge variant="secondary" className="ml-auto text-xs">
              {commits.data?.length || 0} commits
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {commits.isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <CommitSkeleton key={i} />
              ))}
            </div>
          ) : commits.error ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto size-8 text-destructive" />
              <p className="mt-4 font-medium text-destructive">
                Failed to load commits.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {commits.error.message}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => commits.refetch()}
              >
                <RefreshCw className="size-4 mr-2" />
                Try again
              </Button>
            </div>
          ) : processedCommits.length === 0 ? (
            <div className="py-12 text-center">
              <GitCommit className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 font-medium">No commits found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedBranch
                  ? `No commits on branch "${selectedBranch}"`
                  : "This repository has no commits yet."}
              </p>
            </div>
          ) : (
            <div
              className="divide-y divide-border/50"
              role="list"
              aria-label="Commit timeline"
            >
              {processedCommits.map((commit, index) => (
                <CommitRow
                  key={commit.sha}
                  commit={commit}
                  index={index}
                  totalCommits={processedCommits.length}
                  onSelect={setSelectedCommit}
                  onKeyDown={handleKeyDown}
                  branchColor={
                    commit.branch ? getBranchColor(commit.branch) : undefined
                  }
                />
              ))}

              {/* Load More Button */}
              {processedCommits.length >= perPage && (
                <div className="p-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={commits.isFetching}
                  >
                    {commits.isFetching ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-4 mr-2" />
                        Load more commits
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commit Detail Dialog */}
      <CommitDetailDialog
        commit={selectedCommit}
        open={!!selectedCommit}
        onOpenChange={(open) => !open && setSelectedCommit(null)}
      />
    </div>
  );
}

interface CommitRowProps {
  commit: CommitNode;
  index: number;
  totalCommits: number;
  onSelect: (commit: CommitNode) => void;
  onKeyDown: (e: React.KeyboardEvent, commit: CommitNode) => void;
  branchColor?: string;
}

function CommitRow({
  commit,
  index,
  totalCommits,
  onSelect,
  onKeyDown,
  branchColor,
}: CommitRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Parse commit message to get first line
  const firstLine = commit.message.split("\n")[0];
  const hasMoreLines = commit.message.split("\n").length > 1;

  // Format relative time
  const timeAgo = useMemo(() => {
    const now = new Date();
    const date = new Date(commit.date);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(commit.date);
  }, [commit.date]);

  const isFirst = index === 0;
  const isLast = index === totalCommits - 1;

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
        isHovered && "bg-muted/50",
      )}
      onClick={() => onSelect(commit)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => onKeyDown(e, commit)}
      tabIndex={0}
      role="listitem"
      aria-label={`Commit by ${commit.author.login}: ${firstLine}`}
    >
      {/* Timeline Graph */}
      <div className="flex flex-col items-center">
        {/* Top line */}
        {!isFirst && (
          <div
            className="w-0.5 h-4"
            style={{ backgroundColor: branchColor || "#6b7280" }}
          />
        )}

        {/* Commit dot */}
        <div
          className={cn(
            "relative z-10 w-3 h-3 rounded-full border-2 border-background",
            commit.isMergeCommit ? "ring-2 ring-offset-2" : "",
          )}
          style={{
            backgroundColor: commit.isMergeCommit
              ? "#8b5cf6"
              : branchColor || "#6b7280",
            ...(commit.isMergeCommit && { ringColor: "#8b5cf6" }),
          }}
          aria-hidden="true"
        />

        {/* Bottom line */}
        {!isLast && (
          <div
            className="w-0.5 flex-1 min-h-[40px]"
            style={{ backgroundColor: branchColor || "#6b7280" }}
          />
        )}
      </div>

      {/* Commit Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Branch badges */}
              {commit.branches?.map((branch) => (
                <Badge
                  key={branch}
                  variant="outline"
                  className="text-xs font-normal"
                  style={{
                    borderColor: getBranchColor(branch),
                    color: getBranchColor(branch),
                  }}
                >
                  <GitBranch className="size-3 mr-1" />
                  {branch}
                </Badge>
              ))}
              {commit.isMergeCommit && (
                <Badge
                  variant="secondary"
                  className="text-xs font-normal text-violet-600"
                >
                  <GitMerge className="size-3 mr-1" />
                  Merge
                </Badge>
              )}
            </div>

            <p className="mt-1.5 text-sm font-medium line-clamp-2">
              {firstLine}
            </p>
            {hasMoreLines && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {commit.message.split("\n").slice(1).join(" ").trim()}
              </p>
            )}
          </div>

          <a
            href={commit.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label="View commit on GitHub"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {/* Author */}
          <div className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarImage src={commit.author.avatarUrl || undefined} />
              <AvatarFallback className="text-[10px]">
                <User className="size-3" />
              </AvatarFallback>
            </Avatar>
            <span>{commit.author.login}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{timeAgo}</span>
          </div>

          {/* SHA */}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
            {commit.sha.slice(0, 7)}
          </code>
        </div>
      </div>
    </div>
  );
}

interface CommitDetailDialogProps {
  commit: CommitNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CommitDetailDialog({
  commit,
  open,
  onOpenChange,
}: CommitDetailDialogProps) {
  if (!commit) return null;

  const firstLine = commit.message.split("\n")[0];
  const bodyLines = commit.message.split("\n").slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCommit className="size-5" />
            Commit Details
          </DialogTitle>
          <DialogDescription className="sr-only">
            Details for commit {commit.sha}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* SHA */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">SHA:</span>
            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
              {commit.sha}
            </code>
            <a
              href={commit.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>

          {/* Branches */}
          {commit.branches && commit.branches.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Branches:</span>
              {commit.branches.map((branch) => (
                <Badge
                  key={branch}
                  variant="outline"
                  style={{
                    borderColor: getBranchColor(branch),
                    color: getBranchColor(branch),
                  }}
                >
                  <GitBranch className="size-3 mr-1" />
                  {branch}
                </Badge>
              ))}
            </div>
          )}

          {/* Message */}
          <div>
            <h4 className="text-sm font-medium mb-1">Message</h4>
            <div className="bg-muted rounded-lg p-4">
              <p className="font-medium">{firstLine}</p>
              {bodyLines.length > 0 && bodyLines.some((l) => l.trim()) && (
                <pre className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                  {bodyLines.filter((l) => l.trim()).join("\n")}
                </pre>
              )}
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Author:</span>
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={commit.author.avatarUrl || undefined} />
                <AvatarFallback>
                  <User className="size-3" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{commit.author.login}</span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Date:</span>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="size-4" />
              {formatDate(commit.date)}
            </div>
          </div>

          {/* Parents */}
          {commit.parents.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Parent Commits</h4>
              <div className="space-y-1">
                {commit.parents.map((parentSha, i) => (
                  <div
                    key={parentSha}
                    className="flex items-center gap-2 text-sm"
                  >
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <code className="text-muted-foreground font-mono">
                      {parentSha.slice(0, 7)}
                    </code>
                    {i === 0 && commit.isMergeCommit && (
                      <Badge variant="secondary" className="text-xs">
                        merge
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for GitMerge icon - using lucide-react version
function GitMergeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M6 21V9a9 9 0 0 0 9 9" />
    </svg>
  );
}

function TimelineSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <CommitSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CommitSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <div className="flex flex-col items-center">
        <Skeleton className="w-3 h-3 rounded-full" />
        <Skeleton className="w-0.5 flex-1 min-h-[40px]" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
}

export default CodeTimeline;
