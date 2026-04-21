import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Globe,
  GitPullRequest,
  ArrowRight,
  ExternalLink,
  Trash2,
  Calendar,
  Users,
  FolderGit2,
} from "lucide-react";
import Link from "next/link";

interface ConnectedRepo {
  id: string;
  name: string;
  fullName?: string | null;
  private: boolean;
  htmlUrl: string;
  createdAt: Date | string;
  team?: { name: string } | null;
}

function formatConnectedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Connected today";
  if (diffDays === 1) return "Connected yesterday";
  if (diffDays < 7) return `Connected ${diffDays}d ago`;
  if (diffDays < 30) return `Connected ${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `Connected ${Math.floor(diffDays / 30)}mo ago`;
  return `Connected ${Math.floor(diffDays / 365)}y ago`;
}

interface ConnectedRepoCardProps {
  repo: ConnectedRepo;
  isDeleting: boolean;
  onDelete: (repo: { id: string; name: string }) => void;
}

export function ConnectedRepoCard({
  repo,
  isDeleting,
  onDelete,
}: ConnectedRepoCardProps) {
  return (
    <article
      className="group relative flex flex-col p-4 sm:p-5 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
      aria-labelledby={`repo-name-${repo.id}`}
    >
      {/* Status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6),0_0_16px_rgba(52,211,153,0.3)]" />
        </span>
        <span className="text-xs font-semibold text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]">
          Connected
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3 pr-20">
        <div className="flex shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/20 group-hover:scale-105 transition-all duration-300 size-11">
          <FolderGit2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              id={`repo-name-${repo.id}`}
              className="font-semibold text-foreground truncate text-sm sm:text-base"
            >
              {repo.name}
            </h3>
            {repo.private ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Lock className="size-3" />
                Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Globe className="size-3" />
                Public
              </span>
            )}
          </div>
          {repo.fullName && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5 font-mono">
              {repo.fullName}
            </p>
          )}
        </div>
      </div>

      {/* Team badge */}
      {repo.team && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="outline" className="text-xs gap-1">
            <Users className="size-3" />
            {repo.team.name}
          </Badge>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          <time dateTime={repo.createdAt.toString()}>
            {formatConnectedDate(repo.createdAt.toString())}
          </time>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-xs h-8"
            asChild
          >
            <Link href={`/repo/${repo.id}`} className="flex items-center">
              <GitPullRequest className="size-4" />
              <span>PRs</span>
              <ArrowRight className="size-3" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9"
            asChild
          >
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${repo.name} on GitHub`}
            >
              <ExternalLink className="size-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => onDelete({ id: repo.id, name: repo.name })}
            disabled={isDeleting}
            aria-label={`Disconnect ${repo.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
