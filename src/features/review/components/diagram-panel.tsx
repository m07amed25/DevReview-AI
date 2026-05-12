"use client";

import { useState } from "react";
import type { Diagram } from "@/server/db/client";
import { Loader2, AlertTriangle, Network, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { DiagramNode } from "@/features/diagram/types";
import DiagramViewer from "@/features/diagram/components/diagram-viewer";
import { DiagramTriggerButton } from "@/features/diagram/components/diagram-trigger-button";
import { Button } from "@/components/ui/button";

interface DiagramPanelProps {
  diagrams: Diagram[];
  repositoryId: string;
  onRequestDiagram?: (type: "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE") => void;
}

const DIAGRAM_LABELS: Record<"ERD" | "CLASS" | "USE_CASE" | "SEQUENCE", string> = {
  ERD: "Entity Diagram",
  CLASS: "Class Diagram",
  USE_CASE: "Use Case",
  SEQUENCE: "Sequence",
};

const ALL_DIAGRAM_TYPES: Array<"ERD" | "CLASS" | "USE_CASE" | "SEQUENCE"> = [
  "ERD",
  "CLASS",
  "USE_CASE",
  "SEQUENCE",
];

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
      {status === "NONE" && (
        <Plus className="size-3 text-muted-foreground/50" />
      )}
    </button>
  );
}

export function DiagramPanel({
  diagrams,
  repositoryId,
  onRequestDiagram,
}: DiagramPanelProps) {
  const [activeType, setActiveType] = useState<"ERD" | "CLASS" | "USE_CASE" | "SEQUENCE">(
    (diagrams[0]?.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE") ?? "ERD",
  );
  const [requestingType, setRequestingType] = useState<string | null>(null);

  // Derived: still "requesting" only when the diagram hasn't appeared yet.
  // This replaces the previous useEffect + setState pattern to avoid
  // the cascading-renders lint warning.
  const isRequesting = (type: string) =>
    requestingType === type && !diagrams.find((d) => d.type === type);

  // Active diagram may be undefined if that type hasn't been generated yet
  const activeDiagram = diagrams.find((d) => d.type === activeType);

  // No diagrams and no way to create them → show nothing
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
          {ALL_DIAGRAM_TYPES.map((type, index) => {
            const diagram = diagrams.find((d) => d.type === type);
            return (
              <DiagramTabButton
                key={type}
                label={DIAGRAM_LABELS[type]}
                status={diagram?.status ?? "NONE"}
                active={activeType === type}
                onClick={() => setActiveType(type)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    const next =
                      ALL_DIAGRAM_TYPES[
                        (index + 1) % ALL_DIAGRAM_TYPES.length
                      ]!;
                    setActiveType(next);
                  } else if (e.key === "ArrowLeft") {
                    const prev =
                      ALL_DIAGRAM_TYPES[
                        (index - 1 + ALL_DIAGRAM_TYPES.length) %
                          ALL_DIAGRAM_TYPES.length
                      ]!;
                    setActiveType(prev);
                  }
                }}
              />
            );
          })}
        </div>
        {onRequestDiagram && activeDiagram?.status === "COMPLETED" && (
          <div className="ml-auto shrink-0 pb-1">
            <DiagramTriggerButton
              repositoryId={repositoryId}
              type={activeDiagram.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE"}
              onRequest={() =>
                handleRequest(
                  activeDiagram.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE",
                )
              }
              isLoading={isRequesting(activeDiagram.type)}
            />
          </div>
        )}
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        aria-label={DIAGRAM_LABELS[activeType]}
        className="pt-4"
      >
        {/* No diagram for this type yet */}
        {!activeDiagram && (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
                <Network className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {DIAGRAM_LABELS[activeType]} not generated yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate this diagram for the repository.
                </p>
              </div>
              {onRequestDiagram && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRequesting(activeType)}
                  onClick={() => handleRequest(activeType)}
                >
                  {isRequesting(activeType) ? (
                    <>
                      <Loader2 className="size-3 mr-1.5 animate-spin" />
                      Requesting…
                    </>
                  ) : (
                    `Generate ${DIAGRAM_LABELS[activeType]}`
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {activeDiagram?.status === "PENDING" && (
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

        {activeDiagram?.status === "FAILED" && (
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
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    handleRequest(
                      activeDiagram.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE",
                    )
                  }
                >
                  Retry
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {activeDiagram?.status === "COMPLETED" && activeDiagram.definition && (
          <div className="space-y-2">
            {/* Warning tip — shown when the generator kept the previous diagram
                because it couldn't find relevant content (e.g. no classes). */}
            {activeDiagram.error && (
              <div className="flex items-start gap-2.5 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5 text-xs text-yellow-600 dark:text-yellow-400">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {activeDiagram.error} The diagram shown is from the previous
                  successful generation.
                </span>
              </div>
            )}
            <DiagramViewer
              definition={activeDiagram.definition}
              nodes={parsedNodes}
              onRetry={
                onRequestDiagram
                  ? () =>
                      handleRequest(
                        activeDiagram.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE",
                      )
                  : undefined
              }
            />
          </div>
        )}

        {activeDiagram?.status === "COMPLETED" && !activeDiagram.definition && (
          <div className="space-y-2">
            {activeDiagram.error && (
              <div className="flex items-start gap-2.5 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5 text-xs text-yellow-600 dark:text-yellow-400">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>{activeDiagram.error}</span>
              </div>
            )}
            <Card>
              <CardContent className="py-10 text-center">
                <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
                  <Network className="size-6 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {activeDiagram.error
                    ? "No diagram could be generated from the fetched files."
                    : "No diagram definition available."}
                </p>
                {onRequestDiagram && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() =>
                      handleRequest(
                        activeDiagram.type as "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE",
                      )
                    }
                  >
                    Retry
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <p className="sr-only">Repository ID: {repositoryId}</p>
    </div>
  );
}
