import { Button } from "@/components/ui/button";
import {
  Lock,
  Globe,
  GitPullRequest,
  ExternalLink,
  Trash2,
  Users,
  FolderGit2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
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
  const VisibilityIcon = repo.private ? Lock : Globe;

  return (
    <article
      className="group relative flex flex-col h-full rounded-xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-200"
      aria-labelledby={`repo-name-${repo.id}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
            <FolderGit2 className="size-4 text-violet-500" />
          </div>
          <div className="min-w-0">
            <h3
              id={`repo-name-${repo.id}`}
              className="font-semibold text-sm text-foreground truncate leading-snug"
            >
              {repo.name}
            </h3>
            {repo.fullName && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {repo.fullName}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons — show on hover */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            asChild
          >
            <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" aria-label="Open on GitHub">
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete({ id: repo.id, name: repo.name })}
            disabled={isDeleting}
            aria-label={`Disconnect ${repo.name}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
            repo.private
              ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          )}
        >
          <VisibilityIcon className="size-2.5" />
          {repo.private ? "Private" : "Public"}
        </span>
        {repo.team && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-border bg-muted/50 text-muted-foreground">
            <Users className="size-2.5" />
            {repo.team.name}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-border/40">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          Connected {formatConnectedDate(repo.createdAt.toString())}
        </span>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px] px-3 rounded-lg font-medium gap-1.5 bg-background hover:bg-muted/60 border-border/60"
          asChild
        >
          <Link href={`/repo/${repo.id}`}>
            <GitPullRequest className="size-3" />
            View PRs
          </Link>
        </Button>
      </div>
    </article>
  );
}


