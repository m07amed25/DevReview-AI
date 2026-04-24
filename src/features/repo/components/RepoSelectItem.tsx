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
  Eye,
  CircleDot,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

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

export const languageColors: Record<
  string,
  { bg: string; text: string; ring: string }
> = {
  // Popular Languages
  TypeScript: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    ring: "ring-blue-500/50",
  },
  JavaScript: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    ring: "ring-yellow-500/50",
  },
  Python: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    ring: "ring-green-500/50",
  },
  Java: { bg: "bg-red-500/20", text: "text-red-400", ring: "ring-red-500/50" },
  "C#": {
    bg: "bg-purple-600/20",
    text: "text-purple-400",
    ring: "ring-purple-500/50",
  },
  "C++": {
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    ring: "ring-pink-500/50",
  },
  PHP: {
    bg: "bg-indigo-500/20",
    text: "text-indigo-400",
    ring: "ring-indigo-500/50",
  },
  Ruby: { bg: "bg-red-400/20", text: "text-red-300", ring: "ring-red-400/50" },
  Go: { bg: "bg-cyan-500/20", text: "text-cyan-400", ring: "ring-cyan-500/50" },
  Rust: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    ring: "ring-orange-500/50",
  },
  Swift: {
    bg: "bg-orange-400/20",
    text: "text-orange-300",
    ring: "ring-orange-400/50",
  },
  Kotlin: {
    bg: "bg-purple-400/20",
    text: "text-purple-300",
    ring: "ring-purple-400/50",
  },

  // Web & Markup
  HTML: {
    bg: "bg-orange-600/20",
    text: "text-orange-500",
    ring: "ring-orange-500/50",
  },
  CSS: {
    bg: "bg-blue-400/20",
    text: "text-blue-300",
    ring: "ring-blue-400/50",
  },
  SCSS: {
    bg: "bg-pink-400/20",
    text: "text-pink-300",
    ring: "ring-pink-400/50",
  },
  Vue: {
    bg: "bg-green-400/20",
    text: "text-green-300",
    ring: "ring-green-400/50",
  },
  Svelte: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    ring: "ring-orange-500/50",
  },

  // Systems & Low-level
  C: { bg: "bg-gray-500/20", text: "text-gray-400", ring: "ring-gray-500/50" },
  Assembly: {
    bg: "bg-zinc-500/20",
    text: "text-zinc-400",
    ring: "ring-zinc-500/50",
  },
  Zig: {
    bg: "bg-yellow-600/20",
    text: "text-yellow-500",
    ring: "ring-yellow-500/50",
  },
  Nim: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    ring: "ring-yellow-500/50",
  },
  Crystal: {
    bg: "bg-cyan-400/20",
    text: "text-cyan-300",
    ring: "ring-cyan-400/50",
  },

  // Functional
  Haskell: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    ring: "ring-purple-500/50",
  },
  Elixir: {
    bg: "bg-purple-400/20",
    text: "text-purple-300",
    ring: "ring-purple-400/50",
  },
  Erlang: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    ring: "ring-red-500/50",
  },
  Clojure: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    ring: "ring-blue-500/50",
  },
  "F#": {
    bg: "bg-blue-600/20",
    text: "text-blue-400",
    ring: "ring-blue-500/50",
  },
  OCaml: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    ring: "ring-orange-500/50",
  },
  Scala: { bg: "bg-red-500/20", text: "text-red-400", ring: "ring-red-500/50" },
  Elm: {
    bg: "bg-cyan-400/20",
    text: "text-cyan-300",
    ring: "ring-cyan-400/50",
  },
  PureScript: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    ring: "ring-yellow-500/50",
  },

  // Scripting & Others
  Shell: {
    bg: "bg-green-400/20",
    text: "text-green-300",
    ring: "ring-green-400/50",
  },
  PowerShell: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    ring: "ring-blue-500/50",
  },
  Lua: {
    bg: "bg-blue-400/20",
    text: "text-blue-300",
    ring: "ring-blue-400/50",
  },
  Perl: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    ring: "ring-blue-500/50",
  },
  R: { bg: "bg-blue-500/20", text: "text-blue-400", ring: "ring-blue-500/50" },
  Julia: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    ring: "ring-purple-500/50",
  },
  Dart: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    ring: "ring-cyan-500/50",
  },
  Elisp: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    ring: "ring-purple-500/50",
  },

  // Data & Config
  JSON: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    ring: "ring-yellow-500/50",
  },
  YAML: { bg: "bg-red-500/20", text: "text-red-400", ring: "ring-red-500/50" },
  TOML: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    ring: "ring-orange-500/50",
  },
  GraphQL: {
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    ring: "ring-pink-500/50",
  },

  // Mobile
  "Objective-C": {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    ring: "ring-blue-500/50",
  },

  // Scientific
  MATLAB: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    ring: "ring-orange-500/50",
  },
  Fortran: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    ring: "ring-blue-500/50",
  },

  // Other
  Makefile: {
    bg: "bg-gray-400/20",
    text: "text-gray-300",
    ring: "ring-gray-400/50",
  },
  Dockerfile: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    ring: "ring-blue-500/50",
  },
  Vim: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    ring: "ring-green-500/50",
  },
  TeX: {
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    ring: "ring-gray-500/50",
  },

  // Fallback
  Unknown: {
    bg: "bg-gray-400/20",
    text: "text-gray-400",
    ring: "ring-gray-400/50",
  },
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

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
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
  const [isHovered, setIsHovered] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  const langStyle = repo.language
    ? languageColors[repo.language] || languageColors.Unknown
    : languageColors.Unknown;

  return (
    <div
      onClick={() => onToggle(repo.githubId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-none border p-4 sm:p-5 transition-all duration-200 cursor-pointer",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-transparent bg-card hover:border-primary/40 hover:bg-muted/30 shadow-sm",
      )}
    >
      {/* Selection indicator bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 transition-colors duration-200",
          selected ? "bg-primary" : "bg-transparent group-hover:bg-primary/20",
        )}
      />

      {/* Background pattern for selected state */}
      {selected && <div className="absolute inset-0 bg-primary/5" />}

      <div className="relative z-10 ml-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Icon */}
            <div
              className={cn(
                "relative flex shrink-0 items-center justify-center rounded-xl transition-all duration-200 size-11",
                selected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary/80",
              )}
            >
              <FolderGit2 className="h-5 w-5" />

              {/* Selection checkmark overlay */}
              {selected && (
                <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-primary-foreground rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-95 duration-200">
                  <svg
                    className="h-3 w-3 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Title & Subtitle */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={cn(
                    "font-bold text-base sm:text-lg truncate transition-colors duration-200",
                    selected
                      ? "text-foreground"
                      : "text-foreground/90 group-hover:text-foreground",
                  )}
                >
                  {repo.name}
                </h3>
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs px-1.5 sm:px-2 py-0.5 rounded-full",
                    repo.private
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {repo.private ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  <span className="font-medium hidden sm:inline">
                    {repo.private ? "Private" : "Public"}
                  </span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground/70 truncate font-mono mt-0.5">
                {repo.fullName}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 shrink-0 text-muted-foreground hover:text-foreground rounded-none",
              )}
              onClick={(e) => {
                e.stopPropagation();
                window.open(repo.htmlUrl, "_blank");
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <div>
              <Checkbox
                checked={selected}
                onCheckedChange={() => onToggle(repo.githubId)}
                className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6 border-2 transition-all duration-200",
                  selected &&
                    "bg-primary border-primary shadow-lg shadow-primary/25",
                )}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        {repo.description && (
          <p className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-2 mb-3 sm:mb-4 pl-12 sm:pl-16 min-h-[2rem] sm:min-h-[2.5rem]">
            {repo.description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 flex-wrap">
          {/* Language */}
          {repo.language && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                langStyle.bg,
                langStyle.text,
                "ring-1",
                langStyle.ring,
              )}
            >
              <CircleDot className="h-3 w-3" />
              {repo.language}
            </div>
          )}

          {/* Stars */}
          {repo.stars > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 dark:bg-muted/40 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              <span>{formatNumber(repo.stars)}</span>
            </div>
          )}

          {/* Forks */}
          {(repo.forksCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 dark:bg-muted/40 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors">
              <GitFork className="h-3.5 w-3.5" />
              <span>{formatNumber(repo.forksCount!)}</span>
            </div>
          )}

          {/* Watchers */}
          {(repo.watchersCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 dark:bg-muted/40 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors">
              <Eye className="h-3.5 w-3.5" />
              <span>{formatNumber(repo.watchersCount!)}</span>
            </div>
          )}

          {/* Issues */}
          {(repo.openIssuesCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 dark:bg-muted/40 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{formatNumber(repo.openIssuesCount!)}</span>
            </div>
          )}

          {/* Updated */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/70 ml-auto">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatDate(repo.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
