"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DiagramNode } from "@/features/diagram/types";
import { Skeleton } from "@/components/ui/skeleton";
import { NodeInfoPanel } from "./node-info-panel";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  ImageDown,
  Copy,
  Check,
  Expand,
  Shrink,
} from "lucide-react";

interface DiagramViewerProps {
  definition: string;
  nodes: DiagramNode[];
  onNodeClick?: (node: DiagramNode) => void;
  onRetry?: () => void;
}

let diagramCounter = 0;

function DiagramViewer({
  definition,
  nodes,
  onNodeClick,
  onRetry,
}: DiagramViewerProps) {
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

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Refs mirror state for use inside event handlers without stale closures
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });

  const isPanning = useRef(false);
  // Mirrors isPanning as React state so CSS cursor/transition re-renders correctly
  const [isPanningState, setIsPanningState] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // will-change applied only while an active transform is in progress to avoid
  // permanently rasterising the SVG into a GPU bitmap (which causes pixelation).
  const [isTransforming, setIsTransforming] = useState(false);
  const transformEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.15;
  const PAN_STEP = 60; // px per keyboard arrow press

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
    const newScale = +Math.min(wrapperW / naturalW, maxH / naturalH, 2).toFixed(
      3,
    );
    const tx = Math.max(0, (wrapperW - naturalW * newScale) / 2);
    const ty = Math.max(0, (maxH - naturalH * newScale) / 2);
    applyTransform(newScale, { x: tx, y: ty });
  }, [applyTransform]);

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

  const downloadPNG = useCallback(() => {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const vb = svgEl.viewBox?.baseVal;
    const w =
      vb && vb.width > 0 ? vb.width : svgEl.getBoundingClientRect().width;
    const h =
      vb && vb.height > 0 ? vb.height : svgEl.getBoundingClientRect().height;
    const dpr = Math.max(window.devicePixelRatio ?? 1, 2);
    const canvas = document.createElement("canvas");
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Encode as a base64 data URL instead of a blob URL.
    // Blob URLs can taint the canvas when the SVG references cross-origin
    // resources (e.g. web fonts loaded by Mermaid), blocking toDataURL().
    // Data URLs are treated as same-origin and avoid the SecurityError.
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(
      unescape(encodeURIComponent(svgStr)),
    )}`;
    const img = new Image();
    img.onload = () => {
      ctx.scale(dpr, dpr);
      // Fill with the page background so transparent SVGs render cleanly
      ctx.fillStyle = "hsl(222.2 84% 4.9%)";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "diagram.png";
      a.click();
    };
    img.src = svgDataUrl;
  }, []);

  const copyDefinition = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(definition);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  }, [definition]);

  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    setIsPanningState(true);
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
    setIsPanningState(false);
  }, []);

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

  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  
  const handleNodeClickRef = useRef(handleNodeClick);
  useEffect(() => {
    handleNodeClickRef.current = handleNodeClick;
  }, [handleNodeClick]);

  // Mermaid render
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
          securityLevel: "strict",
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

          if (nodesRef.current.length > 0) {
            // ── Flowchart / class diagram nodes ──────────────────────────────
            svgEl
              .querySelectorAll<SVGElement>(".node, [data-id]")
              .forEach((el) => {
                const dataId =
                  el.getAttribute("data-id") ?? el.getAttribute("id") ?? "";
                const matchedNode = nodesRef.current.find(
                  (n) =>
                    n.id === dataId ||
                    dataId.includes(n.id) ||
                    el.textContent?.trim() === n.label,
                );
                if (matchedNode) {
                  el.style.cursor = "pointer";
                  el.addEventListener("click", () =>
                    handleNodeClickRef.current(matchedNode, el),
                  );
                }
              });

            // ── ERD entity groups ─────────────────────────────────────────────
            // Mermaid renders ERD entities as <g id="entity-ModelName"> or
            // <g id="entity-ModelName-N">. We also fall back to matching by
            // the first <text> child so it works across Mermaid versions.
            const bindERDEntity = (el: SVGElement, rawId: string, text: string) => {
              const entityName = rawId.replace(/^entity-/, "").replace(/-\d+$/, "");
              const matchedNode = nodesRef.current.find(
                (n) =>
                  n.label === entityName ||
                  n.id === `table_${entityName}` ||
                  n.label === text,
              );
              if (matchedNode) {
                el.style.cursor = "pointer";
                el.addEventListener("click", (evt) => {
                  evt.stopPropagation();
                  handleNodeClickRef.current(matchedNode, el);
                });
              }
            };

            svgEl
              .querySelectorAll<SVGGElement>('g[id^="entity-"]')
              .forEach((el) => {
                const rawId = el.getAttribute("id") ?? "";
                const firstText = el.querySelector("text")?.textContent?.trim() ?? "";
                bindERDEntity(el, rawId, firstText);
              });

            // If no id-based matches were found, try matching entity boxes by
            // the label text inside any <rect> + <text> group (handles older
            // Mermaid versions that don't assign entity IDs).
            if (!svgEl.querySelector('g[id^="entity-"]')) {
              svgEl.querySelectorAll<SVGGElement>("g").forEach((g) => {
                const rect = g.querySelector("rect");
                const text = g.querySelector("text");
                if (!rect || !text) return;
                const label = text.textContent?.trim() ?? "";
                const matched = nodesRef.current.find((n) => n.label === label);
                if (matched) {
                  g.style.cursor = "pointer";
                  g.addEventListener("click", (evt) => {
                    evt.stopPropagation();
                    handleNodeClickRef.current(matched, g);
                  });
                }
              });
            }
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
  }, [definition, containerId]);

  useEffect(() => {
    if (!loading) {
      // Use rAF to ensure the SVG is committed to the DOM before measuring
      requestAnimationFrame(() => fitToScreen());
    }
  }, [loading, fitToScreen]);

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive space-y-2">
        <p className="font-medium">Failed to render diagram</p>
        <p className="font-mono text-xs opacity-75 break-all">{error}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={onRetry}
          >
            Retry generation
          </Button>
        )}
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

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={downloadPNG}
            title="Download PNG"
            aria-label="Download PNG"
          >
            <ImageDown className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={copyDefinition}
            title="Copy Mermaid source"
            aria-label="Copy Mermaid source"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>

          <div className="mx-1 h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Shrink className="h-4 w-4" />
            ) : (
              <Expand className="h-4 w-4" />
            )}
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
          cursor: isPanningState ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPanning}
        onMouseLeave={stopPanning}
        tabIndex={0}
        aria-label="Diagram canvas — use scroll to zoom, drag to pan"
      >
        {loading && (
          <div className="space-y-3 p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-64 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="mermaid-container origin-top-left"
          style={{
            display: loading ? "none" : "block",
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isPanningState ? "none" : "transform 0.15s ease",
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
