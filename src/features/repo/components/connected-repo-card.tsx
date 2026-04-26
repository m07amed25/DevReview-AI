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
      className="group relative flex flex-col h-full p-4 sm:p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/10 hover:shadow-md transition-all shadow-sm"
      aria-labelledby={`repo-name-${repo.id}`}
    >
      {/* Top Header */}
      <div className="flex w-full gap-3.5 mb-2">
        <div className="pt-0.5 shrink-0">
          <div className="flex shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground size-10">
            <FolderGit2 className="size-4" />
          </div>
        </div>

        <div className="flex items-start justify-between w-full min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <h3
              id={`repo-name-${repo.id}`}
              className="font-semibold text-sm sm:text-base text-foreground truncate"
            >
              {repo.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              asChild
            >
              <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              onClick={() => onDelete({ id: repo.id, name: repo.name })}
              disabled={isDeleting}
              aria-label={`Disconnect ${repo.name}`}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex flex-col flex-1 w-full pl-[54px]">
        {repo.fullName && (
          <p className="text-xs text-muted-foreground truncate mb-2.5 -mt-2 sm:-mt-1.5">
            {repo.fullName}
          </p>
        )}

        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span
            className={
              repo.private
                ? "inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[10px] font-medium leading-none whitespace-nowrap border-amber-500/30 text-amber-600 bg-amber-500/10 dark:text-amber-400"
                : "inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[10px] font-medium leading-none whitespace-nowrap border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
            }
          >
            {repo.private ? "Private" : "Public"}
          </span>
          {repo.team && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full border border-border text-[10px] font-medium leading-none whitespace-nowrap bg-muted/50 text-muted-foreground">
              <Users className="size-3 mr-1" />
              {repo.team.name}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 flex flex-wrap justify-between items-center gap-3 text-[11px] sm:text-xs text-muted-foreground font-medium border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>{formatConnectedDate(repo.createdAt.toString())}</span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-[11px] sm:text-xs px-3 font-medium bg-primary/10 hover:bg-primary/20 text-primary border-0"
            asChild
          >
            <Link href={`/repo/${repo.id}`} className="flex items-center gap-1.5">
              <GitPullRequest className="size-3.5" />
              View PRs
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
