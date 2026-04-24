"use client";

import { useState } from "react";
import type { Diagram } from "@/server/db/client";
import { Loader2, AlertTriangle, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { DiagramNode } from "@/features/diagram/types";
import DiagramViewer from "@/features/diagram/components/diagram-viewer";
import { DiagramTriggerButton } from "@/features/diagram/components/diagram-trigger-button";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiagramPanelProps {
  diagrams: Diagram[];
  reviewId: string;
  onRequestDiagram?: (type: "ERD" | "CLASS" | "USE_CASE") => void;
}

const DIAGRAM_LABELS: Record<"ERD" | "CLASS" | "USE_CASE", string> = {
  ERD: "Entity Diagram",
  CLASS: "Class Diagram",
  USE_CASE: "Use Case",
};

const ALL_DIAGRAM_TYPES: Array<"ERD" | "CLASS" | "USE_CASE"> = [
  "ERD",
  "CLASS",
  "USE_CASE",
];

// ─── Tab button ───────────────────────────────────────────────────────────────

function DiagramTabButton({
  label,
  status,
  active,
  onClick,
  onKeyDown,
}: {
  label: string;
  status: string;
  active: boolean;
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
      )}
    >
      <span>{label}</span>
      {status === "PENDING" && (
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
      )}
      {status === "FAILED" && (
        <AlertTriangle className="size-3 text-destructive" />
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DiagramPanel({
  diagrams,
  reviewId,
  onRequestDiagram,
}: DiagramPanelProps) {
  const [activeType, setActiveType] = useState<string>(
    diagrams[0]?.type ?? "ERD",
  );
  const [requestingType, setRequestingType] = useState<string | null>(null);

  if (diagrams.length === 0) {
    if (!onRequestDiagram) return null;
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
            <Network className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No diagrams generated yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a diagram from the changed files in this PR.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {ALL_DIAGRAM_TYPES.map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => onRequestDiagram(type)}
              >
                {DIAGRAM_LABELS[type]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeDiagram =
    diagrams.find((d) => d.type === activeType) ?? diagrams[0]!;

  const handleRequest = (type: "ERD" | "CLASS" | "USE_CASE") => {
    setRequestingType(type);
    onRequestDiagram?.(type);
    setTimeout(() => setRequestingType(null), 3000);
  };

  const parsedNodes: DiagramNode[] = (() => {
    try {
      return Array.isArray(activeDiagram?.nodes)
        ? (activeDiagram.nodes as unknown as DiagramNode[])
        : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Diagram types"
        className="flex items-center gap-1 border-b border-border/60 overflow-x-auto"
      >
        <div className="flex items-center gap-1 flex-1 flex-wrap">
          {diagrams.map((diagram, index) => (
            <DiagramTabButton
              key={diagram.type}
              label={DIAGRAM_LABELS[diagram.type] ?? diagram.type}
              status={diagram.status}
              active={activeType === diagram.type}
              onClick={() => setActiveType(diagram.type)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  const next = diagrams[(index + 1) % diagrams.length];
                  if (next) setActiveType(next.type);
                } else if (e.key === "ArrowLeft") {
                  const prev =
                    diagrams[(index - 1 + diagrams.length) % diagrams.length];
                  if (prev) setActiveType(prev.type);
                }
              }}
            />
          ))}
        </div>
        {onRequestDiagram && activeDiagram.status === "COMPLETED" && (
          <div className="ml-auto shrink-0 pb-1">
            <DiagramTriggerButton
              reviewId={reviewId}
              type={activeDiagram.type as "ERD" | "CLASS" | "USE_CASE"}
              onRequest={() =>
                handleRequest(
                  activeDiagram.type as "ERD" | "CLASS" | "USE_CASE",
                )
              }
              isLoading={requestingType === activeDiagram.type}
            />
          </div>
        )}
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        aria-label={DIAGRAM_LABELS[activeDiagram.type] ?? activeDiagram.type}
        className="pt-4"
      >
        {activeDiagram.status === "PENDING" && (
          <div className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Generating diagram…</span>
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {activeDiagram.status === "FAILED" && (
          <Card className="border-destructive/50">
            <CardContent className="py-10 text-center">
              <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="size-6 text-destructive" />
              </div>
              <p className="mt-4 font-medium text-destructive">
                Diagram generation failed
              </p>
              {activeDiagram.error && (
                <p className="mt-1 text-sm text-muted-foreground font-mono">
                  {activeDiagram.error}
                </p>
              )}
              {onRequestDiagram && (
                <button
                  type="button"
                  onClick={() =>
                    onRequestDiagram(
                      activeDiagram.type as "ERD" | "CLASS" | "USE_CASE",
                    )
                  }
                  className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
                >
                  Retry
                </button>
              )}
            </CardContent>
          </Card>
        )}

        {activeDiagram.status === "COMPLETED" && activeDiagram.definition && (
          <DiagramViewer
            definition={activeDiagram.definition}
            nodes={parsedNodes}
          />
        )}

        {activeDiagram.status === "COMPLETED" && !activeDiagram.definition && (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
                <Network className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No diagram definition available.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="sr-only">Review ID: {reviewId}</p>
    </div>
  );
}
