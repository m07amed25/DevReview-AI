import React, { useState, useCallback } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DiffGroup,
  ParsedLine,
  DiffSegment,
  computeWordDiff,
} from "./diff-algorithm";

const CONTEXT_COLLAPSE_THRESHOLD = 8;

export function WordDiffSegments({
  segments,
  side,
}: {
  segments: DiffSegment[];
  side: "old" | "new";
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "common") return <span key={i}>{seg.text}</span>;
        const cls =
          side === "old"
            ? "bg-red-500/25 rounded-sm px-px dark:bg-red-400/20"
            : "bg-emerald-500/25 rounded-sm px-px dark:bg-emerald-400/20";
        return (
          <span key={i} className={cls}>
            {seg.text}
          </span>
        );
      })}
    </>
  );
}

function UnifiedContextRow({
  line,
  wrapLines,
}: {
  line: ParsedLine;
  wrapLines: boolean;
}) {
  return (
    <tr className="group/line hover:bg-muted/30 transition-colors">
      <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 text-muted-foreground/50">
        {line.oldNum || ""}
      </td>
      <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 text-muted-foreground/50">
        {line.newNum || ""}
      </td>
      <td
        className={cn(
          "px-4 py-0.5 text-foreground",
          wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre",
        )}
      >
        <span className="select-none text-transparent mr-1"> </span>
        {line.content || " "}
      </td>
    </tr>
  );
}

export function DiffContentUnified({
  groups,
  wordDiffEnabled,
  wrapLines,
}: {
  groups: DiffGroup[];
  wordDiffEnabled: boolean;
  wrapLines: boolean;
}) {
  const [expandedContexts, setExpandedContexts] = useState<Set<number>>(
    new Set(),
  );
  const toggleContext = useCallback((index: number) => {
    setExpandedContexts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <tbody>
          {groups.map((group, gi) => {
            if (group.type === "hunk") {
              return (
                <tr key={gi} className="bg-blue-500/8">
                  <td
                    colSpan={3}
                    className="px-4 py-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/5 select-none font-medium"
                  >
                    {group.lines[0]?.content}
                  </td>
                </tr>
              );
            }
            if (group.type === "info") {
              return (
                <tr key={gi} className="bg-muted/30">
                  <td
                    colSpan={3}
                    className="px-4 py-1 text-xs text-muted-foreground italic select-none"
                  >
                    {group.lines[0]?.content}
                  </td>
                </tr>
              );
            }
            if (group.type === "context") {
              const { lines } = group;
              const shouldCollapse =
                lines.length > CONTEXT_COLLAPSE_THRESHOLD &&
                !expandedContexts.has(gi);
              if (shouldCollapse) {
                const topLines = lines.slice(0, 3);
                const bottomLines = lines.slice(-3);
                const hiddenCount = lines.length - 6;
                return (
                  <React.Fragment key={gi}>
                    {topLines.map((line, li) => (
                      <UnifiedContextRow
                        key={`top-${li}`}
                        line={line}
                        wrapLines={wrapLines}
                      />
                    ))}
                    <tr>
                      <td colSpan={3} className="text-center py-1.5">
                        <button
                          onClick={() => toggleContext(gi)}
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted px-3 py-1 rounded-full border border-border/40"
                        >
                          <ChevronsUpDown className="size-3" />
                          Show {hiddenCount} hidden lines
                        </button>
                      </td>
                    </tr>
                    {bottomLines.map((line, li) => (
                      <UnifiedContextRow
                        key={`bot-${li}`}
                        line={line}
                        wrapLines={wrapLines}
                      />
                    ))}
                  </React.Fragment>
                );
              }
              return (
                <React.Fragment key={gi}>
                  {lines.map((line, li) => (
                    <UnifiedContextRow
                      key={li}
                      line={line}
                      wrapLines={wrapLines}
                    />
                  ))}
                </React.Fragment>
              );
            }
            if (group.type === "change") {
              const { deletions, additions } = group;
              const maxPairs = Math.min(deletions.length, additions.length);
              const wordDiffs = wordDiffEnabled
                ? Array.from({ length: maxPairs }, (_, i) =>
                    computeWordDiff(
                      deletions[i]!.content,
                      additions[i]!.content,
                    ),
                  )
                : [];
              return (
                <React.Fragment key={gi}>
                  {deletions.map((line, li) => {
                    const wd =
                      wordDiffEnabled && li < maxPairs ? wordDiffs[li] : null;
                    return (
                      <tr key={`del-${li}`} className="bg-red-500/8 group/line">
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 bg-red-500/5 text-red-600/70 dark:text-red-400/70">
                          {line.oldNum || ""}
                        </td>
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 bg-red-500/5 text-red-600/70 dark:text-red-400/70" />
                        <td
                          className={cn(
                            "px-4 py-0.5 text-red-700 dark:text-red-300",
                            wrapLines
                              ? "whitespace-pre-wrap break-all"
                              : "whitespace-pre",
                          )}
                        >
                          <span className="select-none text-red-500/50 mr-1">
                            −
                          </span>
                          {wd ? (
                            <WordDiffSegments
                              segments={wd.oldSegments}
                              side="old"
                            />
                          ) : (
                            line.content || " "
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {additions.map((line, li) => {
                    const wd =
                      wordDiffEnabled && li < maxPairs ? wordDiffs[li] : null;
                    return (
                      <tr
                        key={`add-${li}`}
                        className="bg-emerald-500/8 group/line"
                      >
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 bg-emerald-500/5 text-emerald-600/70 dark:text-emerald-400/70" />
                        <td className="w-12 px-2 py-0.5 text-right select-none border-r border-border/30 bg-emerald-500/5 text-emerald-600/70 dark:text-emerald-400/70">
                          {line.newNum || ""}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-0.5 text-emerald-700 dark:text-emerald-300",
                            wrapLines
                              ? "whitespace-pre-wrap break-all"
                              : "whitespace-pre",
                          )}
                        >
                          <span className="select-none text-emerald-500/50 mr-1">
                            +
                          </span>
                          {wd ? (
                            <WordDiffSegments
                              segments={wd.newSegments}
                              side="new"
                            />
                          ) : (
                            line.content || " "
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            }
            return null;
          })}
        </tbody>
      </table>
    </div>
  );
}
