"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FolderGit2,
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
        "group flex flex-col h-full p-4 rounded-xl border transition-all cursor-pointer",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-border/80 hover:shadow-sm",
      )}
    >
      <div className="flex w-full items-start gap-3">
        <div className="pt-0.5 shrink-0">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle(repo.githubId)}
            className="transition-colors data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-start justify-between w-full min-w-0 mb-1.5">
            <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
              <FolderGit2 className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <h3 className="font-medium text-sm text-foreground truncate">
                {repo.fullName}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border text-[10px] font-medium leading-none whitespace-nowrap",
                  repo.private
                    ? "border-border text-muted-foreground"
                    : "border-transparent bg-secondary text-secondary-foreground"
                )}
              >
                {repo.private ? "Private" : "Public"}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                window.open(repo.htmlUrl, "_blank");
              }}
              title="View on GitHub"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>

          {repo.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 pr-2">
              {repo.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 pl-[26px]">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-medium">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", langColor)} />
              <span>{repo.language}</span>
            </div>
          )}

          {repo.stars > 0 && (
            <div
              className="flex items-center gap-1"
              title={`${repo.stars} stars`}
            >
              <Star className="h-3 w-3" />
              <span>{formatNumber(repo.stars)}</span>
            </div>
          )}

          {(repo.forksCount ?? 0) > 0 && (
            <div
              className="flex items-center gap-1"
              title={`${repo.forksCount} forks`}
            >
              <GitFork className="h-3 w-3" />
              <span>{formatNumber(repo.forksCount!)}</span>
            </div>
          )}

          {(repo.openIssuesCount ?? 0) > 0 && (
            <div
              className="flex items-center gap-1"
              title={`${repo.openIssuesCount} issues`}
            >
              <BookOpen className="h-3 w-3" />
              <span>{formatNumber(repo.openIssuesCount!)}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto text-[10px]">
            <span>{formatDate(repo.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
