"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Search,
  X,
  FolderOpen,
  List,
  ChevronsUpDown,
  ChevronsDownUp,
  Download,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "./helpers";
import type { SortKey, SortDir, ViewMode } from "./types";

export function CommentsToolbar({
  totalComments,
  filteredCount,
  searchQuery,
  onSearchChange,
  allCategories,
  activeCategories,
  onToggleCategory,
  sortKey,
  sortDir,
  onToggleSort,
  viewMode,
  onToggleViewMode,
  allExpanded,
  onToggleExpandAll,
  hasActiveFilters,
  onClearFilters,
  onExport,
}: {
  totalComments: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  allCategories: string[];
  activeCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  allExpanded: boolean | null;
  onToggleExpandAll: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExport: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(searchQuery !== "");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          Review Comments
        </h2>
        <Badge variant="secondary" className="tabular-nums text-xs">
          {filteredCount !== totalComments
            ? `${filteredCount} / ${totalComments}`
            : totalComments}{" "}
          {totalComments === 1 ? "issue" : "issues"}
        </Badge>

        <div className="flex-1" />

        <Button
          variant={searchOpen ? "secondary" : "ghost"}
          size="sm"
          className="size-8 p-0"
          onClick={() => {
            setSearchOpen((o) => !o);
            if (searchOpen) onSearchChange("");
          }}
          title="Search comments"
        >
          <Search className="size-3.5" />
        </Button>

        <Button
          variant={viewMode === "grouped" ? "secondary" : "ghost"}
          size="sm"
          className="size-8 p-0"
          onClick={onToggleViewMode}
          title={viewMode === "list" ? "Group by file" : "List view"}
        >
          {viewMode === "list" ? (
            <FolderOpen className="size-3.5" />
          ) : (
            <List className="size-3.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={onToggleExpandAll}
          title={allExpanded ? "Collapse all" : "Expand all"}
        >
          {allExpanded ? (
            <ChevronsDownUp className="size-3.5" />
          ) : (
            <ChevronsUpDown className="size-3.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={onExport}
          title="Export as Markdown"
        >
          <Download className="size-3.5" />
        </Button>
      </div>

      {searchOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search comments, files, suggestions…"
            className="w-full h-9 pl-9 pr-9 text-sm rounded-lg border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {(["severity", "file", "line", "category"] as SortKey[]).map(
            (key) => (
              <Button
                key={key}
                variant={sortKey === key ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-[11px] gap-1 capitalize"
                onClick={() => onToggleSort(key)}
              >
                {key}
                {sortKey === key && (
                  <ArrowUpDown
                    className={cn(
                      "size-3 transition-transform",
                      sortDir === "desc" && "rotate-180",
                    )}
                  />
                )}
              </Button>
            ),
          )}
        </div>

        {allCategories.length > 0 && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            {allCategories.map((cat) => {
              const CatIcon = getCategoryIcon(cat);
              return (
                <Button
                  key={cat}
                  variant={activeCategories.has(cat) ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-[11px] gap-1.5 capitalize"
                  onClick={() => onToggleCategory(cat)}
                >
                  <CatIcon className="size-3" />
                  {cat}
                </Button>
              );
            })}
          </>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-[11px] gap-1 text-destructive hover:text-destructive"
            onClick={onClearFilters}
          >
            <X className="size-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
