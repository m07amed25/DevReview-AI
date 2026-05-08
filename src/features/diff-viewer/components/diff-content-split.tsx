import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DiffGroup,
  ParsedLine,
  DiffSegment,
  computeWordDiff,
} from "./diff-algorithm";
import { WordDiffSegments } from "./diff-content-unified";
import { HighlightedLine } from "./syntax-highlighter";

interface SplitRow {
  left: { line: ParsedLine | null; segments?: DiffSegment[] };
  right: { line: ParsedLine | null; segments?: DiffSegment[] };
  isHunk?: boolean;
  isInfo?: boolean;
  hunkContent?: string;
}

function buildSplitRows(
  groups: DiffGroup[],
  wordDiffEnabled: boolean,
): SplitRow[] {
  const rows: SplitRow[] = [];
  for (const group of groups) {
    if (group.type === "hunk") {
      rows.push({
        left: { line: null },
        right: { line: null },
        isHunk: true,
        hunkContent: group.lines[0]?.content,
      });
    } else if (group.type === "info") {
      rows.push({
        left: { line: null },
        right: { line: null },
        isInfo: true,
        hunkContent: group.lines[0]?.content,
      });
    } else if (group.type === "context") {
      for (const line of group.lines)
        rows.push({ left: { line }, right: { line } });
    } else if (group.type === "change") {
      const { deletions, additions } = group;
      const maxLen = Math.max(deletions.length, additions.length);
      const minLen = Math.min(deletions.length, additions.length);
      const wordDiffs = wordDiffEnabled
        ? Array.from({ length: minLen }, (_, i) =>
            computeWordDiff(deletions[i]!.content, additions[i]!.content),
          )
        : [];
      for (let i = 0; i < maxLen; i++) {
        const del = i < deletions.length ? deletions[i]! : null;
        const add = i < additions.length ? additions[i]! : null;
        const wd = wordDiffEnabled && i < minLen ? wordDiffs[i] : null;
        rows.push({
          left: { line: del, segments: wd?.oldSegments },
          right: { line: add, segments: wd?.newSegments },
        });
      }
    }
  }
  return rows;
}

export function DiffContentSplit({
  groups,
  wordDiffEnabled,
  wrapLines,
  enableSyntaxHighlighting = true,
  language,
}: {
  groups: DiffGroup[];
  wordDiffEnabled: boolean;
  wrapLines: boolean;
  enableSyntaxHighlighting?: boolean;
  language?: string;
}) {
  const rows = useMemo(
    () => buildSplitRows(groups, wordDiffEnabled),
    [groups, wordDiffEnabled],
  );

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Synchronized scrolling for split view
  const handleScroll = useCallback(
    (source: "left" | "right") => {
      if (isSyncing) return;
      setIsSyncing(true);

      const sourceRef = source === "left" ? leftScrollRef : rightScrollRef;
      const targetRef = source === "left" ? rightScrollRef : leftScrollRef;

      if (sourceRef.current && targetRef.current) {
        targetRef.current.scrollTop = sourceRef.current.scrollTop;
      }

      setTimeout(() => setIsSyncing(false), 10);
    },
    [isSyncing],
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse table-fixed md:table-auto">
        <colgroup>
          <col className="w-12" />
          <col />
          <col className="w-12" />
          <col />
        </colgroup>
        <tbody>
          {rows.map((row, ri) => {
            if (row.isHunk) {
              return (
                <tr key={ri} className="bg-blue-500/8">
                  <td
                    colSpan={4}
                    className="px-4 py-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/5 select-none text-center font-medium"
                  >
                    {row.hunkContent}
                  </td>
                </tr>
              );
            }
            if (row.isInfo) {
              return (
                <tr key={ri} className="bg-muted/30">
                  <td
                    colSpan={4}
                    className="px-4 py-1 text-xs text-muted-foreground italic select-none text-center"
                  >
                    {row.hunkContent}
                  </td>
                </tr>
              );
            }
            const leftLine = row.left.line;
            const rightLine = row.right.line;
            const leftIsChange = leftLine?.type === "deletion";
            const rightIsChange = rightLine?.type === "addition";
            return (
              <tr key={ri} className="group/line">
                <td
                  className={cn(
                    "w-12 px-2 py-0.5 text-right select-none border-r border-border/30",
                    leftIsChange
                      ? "bg-red-500/5 text-red-600/70 dark:text-red-400/70"
                      : "text-muted-foreground/50",
                  )}
                >
                  {leftLine?.oldNum || leftLine?.newNum || ""}
                </td>
                <td
                  className={cn(
                    "px-3 py-0.5 border-r border-border/50",
                    leftIsChange
                      ? "bg-red-500/8 text-red-700 dark:text-red-300"
                      : leftLine
                        ? "hover:bg-muted/30 transition-colors"
                        : "bg-muted/20",
                    wrapLines
                      ? "whitespace-pre-wrap break-all"
                      : "whitespace-pre",
                  )}
                >
                  {leftLine ? (
                    row.left.segments ? (
                      <WordDiffSegments
                        segments={row.left.segments}
                        side="old"
                      />
                    ) : enableSyntaxHighlighting && !leftIsChange ? (
                      <HighlightedLine
                        content={leftLine.content}
                        language={language}
                      />
                    ) : (
                      leftLine.content || " "
                    )
                  ) : null}
                </td>
                <td
                  className={cn(
                    "w-12 px-2 py-0.5 text-right select-none border-r border-border/30",
                    rightIsChange
                      ? "bg-emerald-500/5 text-emerald-600/70 dark:text-emerald-400/70"
                      : "text-muted-foreground/50",
                  )}
                >
                  {rightLine?.newNum || rightLine?.oldNum || ""}
                </td>
                <td
                  className={cn(
                    "px-3 py-0.5",
                    rightIsChange
                      ? "bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"
                      : rightLine
                        ? "hover:bg-muted/30 transition-colors"
                        : "bg-muted/20",
                    wrapLines
                      ? "whitespace-pre-wrap break-all"
                      : "whitespace-pre",
                  )}
                >
                  {rightLine ? (
                    row.right.segments ? (
                      <WordDiffSegments
                        segments={row.right.segments}
                        side="new"
                      />
                    ) : enableSyntaxHighlighting && !rightIsChange ? (
                      <HighlightedLine
                        content={rightLine.content}
                        language={language}
                      />
                    ) : (
                      rightLine.content || " "
                    )
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
