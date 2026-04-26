"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FolderGit2,
  Lock,
  Globe,
  Star,
  GitFork,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface GitHubRepo {
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  forksCount?: number;
  watchersCount?: number;
  openIssuesCount?: number;
  updatedAt: string;
}

const githubLanguageColors: Record<string, string> = {
  TypeScript: "bg-[#3178c6]",
  JavaScript: "bg-[#f1e05a]",
  Python: "bg-[#3572A5]",
  Java: "bg-[#b07219]",
  "C#": "bg-[#178600]",
  "C++": "bg-[#f34b7d]",
  C: "bg-[#555555]",
  PHP: "bg-[#4F5D95]",
  Ruby: "bg-[#701516]",
  Go: "bg-[#00ADD8]",
  Rust: "bg-[#dea584]",
  Swift: "bg-[#F05138]",
  Kotlin: "bg-[#A97BFF]",
  HTML: "bg-[#e34c26]",
  CSS: "bg-[#563d7c]",
  SCSS: "bg-[#c6538c]",
  Vue: "bg-[#41b883]",
  Svelte: "bg-[#ff3e00]",
  Shell: "bg-[#89e051]",
  PowerShell: "bg-[#012456]",
  Lua: "bg-[#000080]",
  Perl: "bg-[#0298c3]",
  R: "bg-[#198CE7]",
  Julia: "bg-[#a270ba]",
  Dart: "bg-[#00B4AB]",
  Haskell: "bg-[#5e5086]",
  Elixir: "bg-[#6e4a7e]",
  Erlang: "bg-[#B83998]",
  Clojure: "bg-[#db5855]",
  "F#": "bg-[#b845fc]",
  OCaml: "bg-[#3be133]",
  Scala: "bg-[#c22d40]",
  Assembly: "bg-[#6E4C13]",
  Zig: "bg-[#ec915c]",
  Nim: "bg-[#ffc200]",
  Crystal: "bg-[#000100]",
  "Objective-C": "bg-[#438eff]",
  Makefile: "bg-[#427819]",
  Dockerfile: "bg-[#384d54]",
  Vim: "bg-[#199f4b]",
  TeX: "bg-[#3D6117]",
  Unknown: "bg-muted-foreground",
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function RepoSelectItem({
  repo,
  selected,
  onToggle,
}: {
  repo: GitHubRepo;
  selected: boolean;
  onToggle: (githubId: number) => void;
}) {
  const langColor = repo.language
    ? githubLanguageColors[repo.language] || githubLanguageColors.Unknown
    : githubLanguageColors.Unknown;

  return (
    <div
      onClick={() => onToggle(repo.githubId)}
      className={cn(
        "group relative flex flex-col h-full items-start p-4 sm:p-5 rounded-xl border transition-all cursor-pointer shadow-sm",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/10 hover:shadow-md",
      )}
    >
      <div className="flex w-full gap-3.5 mb-3">
        <div className="pt-0.5 shrink-0">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle(repo.githubId)}
            className="transition-colors"
          />
        </div>

        <div className="flex items-start justify-between w-full min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FolderGit2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
              {repo.fullName}
            </h3>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 ml-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(repo.htmlUrl, "_blank");
            }}
            title="View on GitHub"
          >
            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col flex-1 w-full pl-[30px] sm:pl-[34px]">
        <div className="mb-3">
          <span
            className={cn(
              "inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[10px] font-medium leading-none whitespace-nowrap",
              repo.private
                ? "border-amber-500/30 text-amber-600 bg-amber-500/10 dark:text-amber-400"
                : "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
            )}
          >
            {repo.private ? "Private" : "Public"}
          </span>
        </div>

        {repo.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-4">
            {repo.description}
          </p>
        )}

        <div className="mt-auto pt-4 flex flex-wrap items-center gap-3 text-[11px] sm:text-xs text-muted-foreground font-medium border-t border-border/40">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-full", langColor)} />
              <span>{repo.language}</span>
            </div>
          )}

          {repo.stars > 0 && (
            <div
              className="flex items-center gap-1.5"
              title={`${repo.stars} stars`}
            >
              <Star className="h-3.5 w-3.5" />
              <span>{formatNumber(repo.stars)}</span>
            </div>
          )}

          {(repo.forksCount ?? 0) > 0 && (
            <div
              className="flex items-center gap-1.5"
              title={`${repo.forksCount} forks`}
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>{formatNumber(repo.forksCount!)}</span>
            </div>
          )}

          {(repo.openIssuesCount ?? 0) > 0 && (
            <div
              className="flex items-center gap-1.5"
              title={`${repo.openIssuesCount} issues`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{formatNumber(repo.openIssuesCount!)}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto text-[10px] sm:text-xs">
            <span>{formatDate(repo.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
