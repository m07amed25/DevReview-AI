"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DiagramNode } from "@/features/diagram/types";
import { Skeleton } from "@/components/ui/skeleton";
import { NodeInfoPanel } from "./node-info-panel";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Download } from "lucide-react";

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

  // ── Zoom / pan state ────────────────────────────────────────────────────────
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Refs mirror state for use inside event handlers without stale closures
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // will-change applied only while an active transform is in progress to avoid
  // permanently rasterising the SVG into a GPU bitmap (which causes pixelation).
  const [isTransforming, setIsTransforming] = useState(false);
  const transformEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.15;
  const PAN_STEP = 60; // px per keyboard arrow press

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const beginTransform = useCallback(() => {
    setIsTransforming(true);
    if (transformEndTimer.current) clearTimeout(transformEndTimer.current);
    transformEndTimer.current = setTimeout(() => setIsTransforming(false), 300);
  }, []);

  /** Apply a new scale + translate atomically and keep refs in sync. */
  const applyTransform = useCallback(
    (newScale: number, newTranslate: { x: number; y: number }) => {
      scaleRef.current = newScale;
      translateRef.current = newTranslate;
      setScale(newScale);
      setTranslate(newTranslate);
    },
    [],
  );

  /**
   * Zoom toward a focal point (fx, fy) in wrapper-relative coordinates.
   * Keeps the diagram pixel under the focal point stationary.
   */
  const zoomToward = useCallback(
    (delta: number, fx: number, fy: number) => {
      beginTransform();
      const s = scaleRef.current;
      const t = translateRef.current;
      const newScale = Math.min(
        Math.max(+(s + delta).toFixed(2), MIN_SCALE),
        MAX_SCALE,
      );
      // Diagram-space point that should remain fixed under (fx, fy)
      const px = (fx - t.x) / s;
      const py = (fy - t.y) / s;
      applyTransform(newScale, {
        x: fx - px * newScale,
        y: fy - py * newScale,
      });
    },
    [beginTransform, applyTransform],
  );

  // ── Button zoom (toward the centre of the viewport) ─────────────────────────
  const zoomIn = useCallback(() => {
    const wrapper = wrapperRef.current;
    const cx = wrapper ? wrapper.clientWidth / 2 : 0;
    const cy = wrapper ? wrapper.clientHeight / 2 : 0;
    zoomToward(ZOOM_STEP, cx, cy);
  }, [zoomToward]);

  const zoomOut = useCallback(() => {
    const wrapper = wrapperRef.current;
    const cx = wrapper ? wrapper.clientWidth / 2 : 0;
    const cy = wrapper ? wrapper.clientHeight / 2 : 0;
    zoomToward(-ZOOM_STEP, cx, cy);
  }, [zoomToward]);

  const resetView = useCallback(() => {
    applyTransform(1, { x: 0, y: 0 });
  }, [applyTransform]);

  const fitToScreen = useCallback(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    if (!wrapper || !container) return;
    const svgEl = container.querySelector("svg");
    if (!svgEl) return;

    const vb = svgEl.viewBox?.baseVal;
    const naturalW = vb && vb.width > 0 ? vb.width : svgEl.getBBox().width;
    const naturalH = vb && vb.height > 0 ? vb.height : svgEl.getBBox().height;
    if (!naturalW || !naturalH) return;

    const wrapperW = wrapper.clientWidth;
    const maxH = Math.max(window.innerHeight * 0.72, 600);
    const newScale = +Math.min(
      wrapperW / naturalW,
      maxH / naturalH,
      2,
    ).toFixed(3);
    const tx = Math.max(0, (wrapperW - naturalW * newScale) / 2);
    const ty = Math.max(0, (maxH - naturalH * newScale) / 2);
    applyTransform(newScale, { x: tx, y: ty });
  }, [applyTransform]);

  // ── Download SVG ─────────────────────────────────────────────────────────────
  const downloadSVG = useCallback(() => {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ── Mouse-wheel zoom ─ centred on the cursor ─────────────────────────────────
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const fx = e.clientX - rect.left;
      const fy = e.clientY - rect.top;
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      zoomToward(delta, fx, fy);
    },
    [zoomToward],
  );

  // ── Mouse pan ────────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = {
      x: e.clientX - translateRef.current.x,
      y: e.clientY - translateRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning.current) return;
      beginTransform();
      const newTranslate = {
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      };
      translateRef.current = newTranslate;
      setTranslate({ ...newTranslate });
    },
    [beginTransform],
  );

  const stopPanning = useCallback(() => {
    isPanning.current = false;
  }, []);

  // ── Touch pan + pinch-to-zoom ─────────────────────────────────────────────────
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = {
        x: e.touches[0]!.clientX,
        y: e.touches[0]!.clientY,
      };
      lastPinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
      const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
      lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
      lastTouchRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      beginTransform();
      const wrapper = wrapperRef.current;

      if (e.touches.length === 1 && lastTouchRef.current) {
        // Single-finger pan
        const dx = e.touches[0]!.clientX - lastTouchRef.current.x;
        const dy = e.touches[0]!.clientY - lastTouchRef.current.y;
        lastTouchRef.current = {
          x: e.touches[0]!.clientX,
          y: e.touches[0]!.clientY,
        };
        const newT = {
          x: translateRef.current.x + dx,
          y: translateRef.current.y + dy,
        };
        translateRef.current = newT;
        setTranslate({ ...newT });
      } else if (
        e.touches.length === 2 &&
        lastPinchDistRef.current !== null &&
        wrapper
      ) {
        // Two-finger pinch zoom toward midpoint
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);
        const ratio = newDist / lastPinchDistRef.current;
        lastPinchDistRef.current = newDist;

        const midX =
          (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2 -
          wrapper.getBoundingClientRect().left;
        const midY =
          (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2 -
          wrapper.getBoundingClientRect().top;

        const s = scaleRef.current;
        const newScale = Math.min(
          Math.max(+(s * ratio).toFixed(3), MIN_SCALE),
          MAX_SCALE,
        );
        const px = (midX - translateRef.current.x) / s;
        const py = (midY - translateRef.current.y) / s;
        const newT = {
          x: midX - px * newScale,
          y: midY - py * newScale,
        };
        scaleRef.current = newScale;
        translateRef.current = newT;
        setScale(newScale);
        setTranslate({ ...newT });
      }
    },
    [beginTransform],
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null;
    lastPinchDistRef.current = null;
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          e.preventDefault();
          zoomOut();
          break;
        case "0":
          e.preventDefault();
          resetView();
          break;
        case "f":
        case "F":
          e.preventDefault();
          fitToScreen();
          break;
        case "ArrowLeft":
          e.preventDefault();
          translateRef.current = {
            x: translateRef.current.x + PAN_STEP,
            y: translateRef.current.y,
          };
          setTranslate({ ...translateRef.current });
          break;
        case "ArrowRight":
          e.preventDefault();
          translateRef.current = {
            x: translateRef.current.x - PAN_STEP,
            y: translateRef.current.y,
          };
          setTranslate({ ...translateRef.current });
          break;
        case "ArrowUp":
          e.preventDefault();
          translateRef.current = {
            x: translateRef.current.x,
            y: translateRef.current.y + PAN_STEP,
          };
          setTranslate({ ...translateRef.current });
          break;
        case "ArrowDown":
          e.preventDefault();
          translateRef.current = {
            x: translateRef.current.x,
            y: translateRef.current.y - PAN_STEP,
          };
          setTranslate({ ...translateRef.current });
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomIn, zoomOut, resetView, fitToScreen]);

  // ── Attach non-passive listeners ─────────────────────────────────────────────
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // ── Node click ───────────────────────────────────────────────────────────────
  const activeNodeElRef = useRef<SVGElement | null>(null);

  const handleNodeClick = useCallback(
    (node: DiagramNode, el: SVGElement) => {
      if (activeNodeElRef.current) {
        activeNodeElRef.current.style.filter = "";
      }
      el.style.filter = "drop-shadow(0 0 6px hsl(var(--primary) / 0.7))";
      activeNodeElRef.current = el;
      setSelectedNode(node);
      onNodeClick?.(node);
    },
    [onNodeClick],
  );

  // ── Mermaid render ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);

      try {
        document.getElementById(containerId)?.remove();

        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "inherit",
          themeVariables: { fontSize: "16px" },
          flowchart: { nodeSpacing: 70, rankSpacing: 70 },
        });

        const { svg } = await mermaid.render(containerId, definition);
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = svg;

        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.removeAttribute("width");
          svgEl.removeAttribute("height");
          svgEl.style.display = "block";
          svgEl.style.shapeRendering = "geometricPrecision";
          svgEl.style.textRendering = "geometricPrecision";

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
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to render diagram",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void render();
    return () => {
      cancelled = true;
      document.getElementById(containerId)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition]);

  useEffect(() => {
    if (!loading) fitToScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        <p className="font-medium">Failed to render diagram</p>
        <p className="mt-1 font-mono text-xs opacity-75 break-all">{error}</p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
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
            title="Zoom in  (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Clickable zoom % — click resets to 100 % */}
          <button
            type="button"
            className="min-w-12 text-center text-xs tabular-nums text-muted-foreground select-none hover:text-foreground transition-colors"
            title="Click to reset zoom (0)"
            onClick={resetView}
            aria-label="Reset zoom to 100%"
          >
            {Math.round(scale * 100)}%
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomOut}
            title="Zoom out  (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fitToScreen}
            title="Fit to screen  (F)"
            aria-label="Fit to screen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={resetView}
            title="Reset view  (0)"
            aria-label="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={downloadSVG}
            title="Download SVG"
            aria-label="Download SVG"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Keyboard hint */}
      {!loading && !error && (
        <p className="absolute bottom-2 left-2 z-10 text-[10px] text-muted-foreground/50 select-none pointer-events-none">
          Scroll / pinch to zoom · Drag to pan · + − 0 F ↑ ↓ ← →
        </p>
      )}

      {/* Pan / zoom viewport */}
      <div
        ref={wrapperRef}
        className="relative w-full overflow-hidden rounded-md"
        style={{
          minHeight: 600,
          cursor: isPanning.current ? "grabbing" : "grab",
          touchAction: "none",
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
          className="mermaid-container origin-top-left"
          style={{
            display: loading ? "none" : "block",
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isPanning.current ? "none" : "transform 0.15s ease",
            willChange: isTransforming ? "transform" : "auto",
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
