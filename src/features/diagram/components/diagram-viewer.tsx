"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DiagramNode } from "@/features/diagram/types";
import { Skeleton } from "@/components/ui/skeleton";
import { NodeInfoPanel } from "./node-info-panel";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";

interface DiagramViewerProps {
  definition: string;
  nodes: DiagramNode[];
  onNodeClick?: (node: DiagramNode) => void;
}

let diagramCounter = 0;

function DiagramViewer({ definition, nodes, onNodeClick }: DiagramViewerProps) {
  const idRef = useRef<string | null>(null);
  if (!idRef.current) {
    idRef.current = `mermaid-diagram-${++diagramCounter}`;
  }
  const containerId = idRef.current;

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(null);

  // Zoom / pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateRef = useRef({ x: 0, y: 0 });

  const MIN_SCALE = 0.25;
  const MAX_SCALE = 4;
  const ZOOM_STEP = 0.15;

  const zoomIn = useCallback(
    () => setScale((s) => Math.min(+(s + ZOOM_STEP).toFixed(2), MAX_SCALE)),
    [],
  );
  const zoomOut = useCallback(
    () => setScale((s) => Math.max(+(s - ZOOM_STEP).toFixed(2), MIN_SCALE)),
    [],
  );
  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    translateRef.current = { x: 0, y: 0 };
  }, []);

  const fitToScreen = useCallback(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    if (!wrapper || !container) return;
    const svgEl = container.querySelector("svg");
    if (!svgEl) return;

    // Read intrinsic size from viewBox (unaffected by CSS transforms)
    const vb = svgEl.viewBox?.baseVal;
    const naturalW = vb && vb.width > 0 ? vb.width : svgEl.getBBox().width;
    const naturalH = vb && vb.height > 0 ? vb.height : svgEl.getBBox().height;
    if (!naturalW || !naturalH) return;

    const wrapperW = wrapper.clientWidth;
    const maxH = Math.max(window.innerHeight * 0.72, 600);
    const newScale = +Math.min(wrapperW / naturalW, maxH / naturalH, 2).toFixed(
      3,
    );
    const tx = Math.max(0, (wrapperW - naturalW * newScale) / 2);
    const ty = Math.max(0, (maxH - naturalH * newScale) / 2);
    const newTranslate = { x: tx, y: ty };

    setScale(newScale);
    setTranslate(newTranslate);
    translateRef.current = newTranslate;
  }, []);

  // Mouse-wheel zoom centred on cursor position
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setScale((s) =>
      Math.min(Math.max(+(s + delta).toFixed(2), MIN_SCALE), MAX_SCALE),
    );
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = {
      x: e.clientX - translateRef.current.x,
      y: e.clientY - translateRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const newTranslate = {
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    };
    translateRef.current = newTranslate;
    setTranslate({ ...newTranslate });
  }, []);

  const stopPanning = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Attach non-passive wheel listener
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const activeNodeElRef = useRef<SVGElement | null>(null);

  const handleNodeClick = useCallback(
    (node: DiagramNode, el: SVGElement) => {
      // Remove highlight from previous node
      if (activeNodeElRef.current) {
        activeNodeElRef.current.style.filter = "";
        activeNodeElRef.current.style.outline = "";
      }
      // Highlight new node
      el.style.filter = "drop-shadow(0 0 6px hsl(var(--primary) / 0.7))";
      activeNodeElRef.current = el;
      setSelectedNode(node);
      onNodeClick?.(node);
    },
    [onNodeClick],
  );

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!containerRef.current) return;

      setLoading(true);
      setError(null);

      try {
        // Remove any stale mermaid element left from a previous render (StrictMode)
        document.getElementById(containerId)?.remove();

        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "inherit",
          themeVariables: {
            fontSize: "16px",
          },
          flowchart: {
            nodeSpacing: 70,
            rankSpacing: 70,
          },
        });

        const { svg } = await mermaid.render(containerId, definition);

        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = svg;

        // Make the generated SVG responsive
        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.removeAttribute("width");
          svgEl.removeAttribute("height");
          svgEl.style.maxWidth = "100%";
          svgEl.style.height = "auto";

          // Wire node click handlers
          if (nodes.length > 0) {
            svgEl
              .querySelectorAll<SVGElement>(".node, [data-id]")
              .forEach((el) => {
                const dataId =
                  el.getAttribute("data-id") ?? el.getAttribute("id") ?? "";
                const matchedNode = nodes.find(
                  (n) =>
                    n.id === dataId ||
                    dataId.includes(n.id) ||
                    el.textContent?.trim() === n.label,
                );
                if (matchedNode) {
                  el.style.cursor = "pointer";
                  el.addEventListener("click", () =>
                    handleNodeClick(matchedNode, el),
                  );
                }
              });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          // fitToScreen runs in the effect below once the SVG is visible
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
      // Clean up the element mermaid may have appended to <body>
      document.getElementById(containerId)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition]);

  // Fit to screen after the SVG becomes visible
  useEffect(() => {
    if (!loading) fitToScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        <p className="font-medium">Failed to render diagram</p>
        <p className="mt-1 font-mono text-xs opacity-75 break-all">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Toolbar */}
      {!loading && !error && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md border bg-background/80 p-1 backdrop-blur-sm shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomIn}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground select-none">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomOut}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={resetView}
            title="Reset view"
            aria-label="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fitToScreen}
            title="Fit to screen"
            aria-label="Fit to screen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Pan / zoom viewport */}
      <div
        ref={wrapperRef}
        className="relative w-full overflow-hidden rounded-md"
        style={{
          minHeight: 600,
          cursor: isPanning.current ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPanning}
        onMouseLeave={stopPanning}
      >
        {loading && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        <div
          ref={containerRef}
          className="mermaid-container w-full origin-top-left will-change-transform"
          style={{
            display: loading ? "none" : "block",
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isPanning.current ? "none" : "transform 0.15s ease",
          }}
          aria-label="Diagram visualization"
        />
      </div>

      <NodeInfoPanel
        node={selectedNode}
        onClose={() => {
          if (activeNodeElRef.current) {
            activeNodeElRef.current.style.filter = "";
            activeNodeElRef.current = null;
          }
          setSelectedNode(null);
        }}
        excludeRef={wrapperRef}
      />
    </div>
  );
}

export default DiagramViewer;
