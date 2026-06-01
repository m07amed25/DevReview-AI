"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Diagram } from "@/server/db/client";
import { Loader2, AlertTriangle, Network, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiagramNode, DiagramEdge } from "@/features/diagram/types";
import DiagramViewer from "@/features/diagram/components/diagram-viewer";

const DiagramFlow = dynamic(() => import("@/features/diagram/components/erd-flow"), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-md" />,
});

interface DiagramPanelProps {
  diagrams: Diagram[];
  repositoryId: string;
  onRequestDiagram?: (type: "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE") => void;
}

const DIAGRAM_LABELS: Record<"ERD" | "CLASS" | "USE_CASE" | "SEQUENCE", string> = {
  ERD: "Entity",
  CLASS: "Class",
  USE_CASE: "Use Case",
  SEQUENCE: "Sequence",
};

const ALL_DIAGRAM_TYPES: Array<"ERD" | "CLASS" | "USE_CASE" | "SEQUENCE"> = [
  "ERD", "CLASS", "USE_CASE", "SEQUENCE",
];

export function DiagramPanel({ diagrams, repositoryId, onRequestDiagram }: DiagramPanelProps) {
  const [activeType, setActiveType] = useState<"ERD" | "CLASS" | "USE_CASE" | "SEQUENCE">(
    (diagrams[0]?.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE") ?? "ERD",
  );
  const [requestingType, setRequestingType] = useState<string | null>(null);

  const isRequesting = (type: string) =>
    requestingType === type && !diagrams.find((d) => d.type === type);

  const activeDiagram = diagrams.find((d) => d.type === activeType);

  if (diagrams.length === 0 && !onRequestDiagram) return null;

  const handleRequest = (type: "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE") => {
    setRequestingType(type);
    setActiveType(type);
    onRequestDiagram?.(type);
  };

  const parsedNodes: DiagramNode[] = (() => {
    if (!activeDiagram?.nodes) return [];
    try {
      return Array.isArray(activeDiagram.nodes)
        ? (activeDiagram.nodes as unknown as DiagramNode[])
        : [];
    } catch { return []; }
  })();

  const parsedEdges: DiagramEdge[] = Array.isArray(activeDiagram?.edges)
    ? (activeDiagram.edges as unknown as DiagramEdge[])
    : [];

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div role="tablist" aria-label="Diagram types" className="flex items-center gap-0.5 border-b border-[oklch(0.30_0.02_250)]">
        <div className="flex items-center gap-0.5 flex-1">
          {ALL_DIAGRAM_TYPES.map((type, index) => {
            const diagram = diagrams.find((d) => d.type === type);
            const status = diagram?.status ?? "NONE";
            const active = activeType === type;
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveType(type)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") setActiveType(ALL_DIAGRAM_TYPES[(index + 1) % ALL_DIAGRAM_TYPES.length]!);
                  else if (e.key === "ArrowLeft") setActiveType(ALL_DIAGRAM_TYPES[(index - 1 + ALL_DIAGRAM_TYPES.length) % ALL_DIAGRAM_TYPES.length]!);
                }}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors duration-150 cursor-pointer",
                  active
                    ? "text-[oklch(0.82_0.02_250)]"
                    : "text-[oklch(0.60_0.03_250)] hover:text-[oklch(0.82_0.02_250)]",
                )}
              >
                <span>{DIAGRAM_LABELS[type]}</span>
                {(type === "USE_CASE" || type === "SEQUENCE") && (
                  <span className="px-1 py-0.5 text-[0.6rem] font-semibold leading-none rounded bg-[oklch(0.25_0.08_250)] text-[oklch(0.62_0.16_250)] border border-[oklch(0.35_0.10_250)]">
                    Beta
                  </span>
                )}
                {status === "PENDING" && <Loader2 className="size-3 animate-spin text-[oklch(0.62_0.16_250)]" />}
                {status === "FAILED" && <AlertTriangle className="size-3 text-[oklch(0.55_0.2_25)]" />}
                {status === "NONE" && <Plus className="size-3 text-[oklch(0.40_0.03_250)]" />}
                {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[oklch(0.62_0.16_250)] rounded-full" />}
              </button>
            );
          })}
        </div>
        {onRequestDiagram && activeDiagram?.status === "COMPLETED" && (
          <button
            onClick={() => handleRequest(activeDiagram.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE")}
            disabled={isRequesting(activeDiagram.type)}
            className="h-7 px-2.5 rounded-[4px] text-[0.6875rem] font-medium text-[oklch(0.60_0.03_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors duration-150 flex items-center gap-1.5 shrink-0 mr-1 cursor-pointer disabled:opacity-40"
          >
            {isRequesting(activeDiagram.type) ? <Loader2 className="size-3 animate-spin" /> : null}
            Regenerate
          </button>
        )}
      </div>

      {/* Tab panel */}
      <div role="tabpanel" aria-label={DIAGRAM_LABELS[activeType]} className="pt-4">
        {/* No diagram yet */}
        {!activeDiagram && (
          <div className="py-10 text-center">
            <div className="mx-auto size-8 rounded-[4px] bg-[oklch(0.20_0.02_250)] flex items-center justify-center mb-3">
              <Network className="size-4 text-[oklch(0.60_0.03_250)]" />
            </div>
            <p className="text-[0.8125rem] text-[oklch(0.60_0.03_250)]">
              {DIAGRAM_LABELS[activeType]} not generated yet
            </p>
            {onRequestDiagram && (
              <button
                onClick={() => handleRequest(activeType)}
                disabled={isRequesting(activeType)}
                className="mt-3 h-7 px-3 rounded-[4px] text-xs font-medium bg-[oklch(0.62_0.16_250)] text-[oklch(0.12_0.03_250)] hover:bg-[oklch(0.55_0.14_250)] transition-colors duration-150 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5"
              >
                {isRequesting(activeType) && <Loader2 className="size-3 animate-spin" />}
                Generate
              </button>
            )}
          </div>
        )}

        {/* Pending */}
        {activeDiagram?.status === "PENDING" && (
          <div className="space-y-2 py-4">
            <div className="flex items-center gap-2 text-xs text-[oklch(0.60_0.03_250)]">
              <Loader2 className="size-3.5 animate-spin text-[oklch(0.62_0.16_250)]" />
              <span>Generating…</span>
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {/* Failed */}
        {activeDiagram?.status === "FAILED" && (
          <div className="py-10 text-center">
            <div className="mx-auto size-8 rounded-[4px] bg-[oklch(0.55_0.2_25/0.12)] flex items-center justify-center mb-3">
              <AlertTriangle className="size-4 text-[oklch(0.55_0.2_25)]" />
            </div>
            <p className="text-[0.8125rem] text-[oklch(0.55_0.2_25)]">Generation failed</p>
            {activeDiagram.error && (
              <p className="mt-1 text-xs font-mono text-[oklch(0.40_0.03_250)] max-w-md mx-auto">{activeDiagram.error}</p>
            )}
            {onRequestDiagram && (
              <button
                onClick={() => handleRequest(activeDiagram.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE")}
                className="mt-3 h-7 px-3 rounded-[4px] text-xs font-medium text-[oklch(0.60_0.03_250)] border border-[oklch(0.30_0.02_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors duration-150 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Completed with definition */}
        {activeDiagram?.status === "COMPLETED" && activeDiagram.definition && (
          <div className="space-y-2">
            {activeDiagram.error && (
              <div className="flex items-start gap-2 rounded-[4px] border border-[oklch(0.65_0.15_75/0.3)] bg-[oklch(0.65_0.15_75/0.06)] px-3 py-2 text-xs text-[oklch(0.65_0.15_75)]">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>{activeDiagram.error} Showing previous generation.</span>
              </div>
            )}
            {(activeType === "ERD" || activeType === "CLASS" || activeType === "USE_CASE") && parsedNodes.length > 0 ? (
              <DiagramFlow nodes={parsedNodes} edges={parsedEdges} />
            ) : (
              <DiagramViewer
                definition={activeDiagram.definition}
                nodes={parsedNodes}
                onRetry={onRequestDiagram ? () => handleRequest(activeDiagram.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE") : undefined}
              />
            )}
          </div>
        )}

        {/* Completed without definition */}
        {activeDiagram?.status === "COMPLETED" && !activeDiagram.definition && (
          <div className="py-10 text-center">
            {activeDiagram.error && (
              <div className="flex items-start gap-2 rounded-[4px] border border-[oklch(0.65_0.15_75/0.3)] bg-[oklch(0.65_0.15_75/0.06)] px-3 py-2 text-xs text-[oklch(0.65_0.15_75)] mb-4 max-w-md mx-auto text-left">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>{activeDiagram.error}</span>
              </div>
            )}
            <div className="mx-auto size-8 rounded-[4px] bg-[oklch(0.20_0.02_250)] flex items-center justify-center mb-3">
              <Network className="size-4 text-[oklch(0.60_0.03_250)]" />
            </div>
            <p className="text-[0.8125rem] text-[oklch(0.60_0.03_250)]">
              No diagram could be generated.
            </p>
            {onRequestDiagram && (
              <button
                onClick={() => handleRequest(activeDiagram.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE")}
                className="mt-3 h-7 px-3 rounded-[4px] text-xs font-medium text-[oklch(0.60_0.03_250)] border border-[oklch(0.30_0.02_250)] hover:text-[oklch(0.82_0.02_250)] hover:bg-[oklch(0.20_0.02_250)] transition-colors duration-150 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      <p className="sr-only">Repository ID: {repositoryId}</p>
    </div>
  );
}
