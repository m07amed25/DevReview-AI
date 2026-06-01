"use client";

import "@xyflow/react/dist/style.css";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  BaseEdge,
  getSmoothStepPath,
  getStraightPath,
  getNodesBounds,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodesInitialized,
  useInternalNode,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type InternalNode,
} from "@xyflow/react";
import Dagre from "@dagrejs/dagre";
import { toPng } from "html-to-image";
import { Boxes, Download, KeyRound, Link2, Table2, Braces, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  DiagramNode,
  DiagramEdge,
  DiagramNodeDetailTable,
  DiagramNodeDetailClass,
} from "@/features/diagram/types";
import { NodeInfoPanel } from "./node-info-panel";

const NODE_W = 240;
const HEADER_H = 38;
const ROW_H = 24;

// Use-case diagram sizing
const UC_W = 190;
const UC_H = 86;
const ACTOR_W = 104;
const ACTOR_H = 104;
const BOUNDARY_ID = "uc_boundary";

const colsOf = (n: DiagramNode) =>
  (n.detail as DiagramNodeDetailTable)?.columns ?? [];
const classOf = (n: DiagramNode) => n.detail as DiagramNodeDetailClass;

function rowCount(n: DiagramNode): number {
  if (n.type === "CLASS") {
    const d = classOf(n);
    return (d.properties?.length ?? 0) + (d.methods?.length ?? 0);
  }
  return colsOf(n).length;
}
const nodeHeightFor = (n: DiagramNode) => HEADER_H + rowCount(n) * ROW_H;

/** Layered layout via dagre — minimises edge crossings. */
function layout(items: DiagramNode[], edges: DiagramEdge[]) {
  const g = new Dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 160, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));
  const ids = new Set(items.map((n) => n.id));
  items.forEach((n) => g.setNode(n.id, { width: NODE_W, height: nodeHeightFor(n) }));
  edges.forEach((e) => {
    if (ids.has(e.fromId) && ids.has(e.toId)) g.setEdge(e.fromId, e.toId);
  });
  Dagre.layout(g);
  const pos = new Map<string, { x: number; y: number }>();
  items.forEach((n) => {
    const d = g.node(n.id);
    pos.set(n.id, { x: d.x - NODE_W / 2, y: d.y - nodeHeightFor(n) / 2 });
  });
  return pos;
}

/** Primary (human) actors sit left of the boundary; system actors sit right. */
const isSystemActor = (label: string) =>
  /git|hub|inngest|server|service|system|bank|payment|provider|\bapi\b|webhook|cron|schedul/i.test(label);

/** Canonical use-case layout: use cases grouped into a block per actor inside the
 *  boundary, each actor aligned to the vertical centre of its own block. Grouping +
 *  straight edges keep association lines short and local → no crossing tangle. */
function layoutUseCase(
  actors: DiagramNode[],
  useCases: DiagramNode[],
  edges: DiagramEdge[],
) {
  const pos = new Map<string, { x: number; y: number }>();

  // Primary actor for each use case = first actor→useCase association.
  const ucActor = new Map<string, string>();
  for (const e of edges) {
    if (e.fromId.startsWith("actor_") && !ucActor.has(e.toId)) ucActor.set(e.toId, e.fromId);
  }

  const leftActors = actors.filter((a) => !isSystemActor(a.label));
  const rightActors = actors.filter((a) => isSystemActor(a.label));
  const ordered = [...leftActors, ...rightActors]; // left blocks on top, system blocks below

  // Bucket use cases under their actor; unmatched ones trail in their own block.
  const byActor = new Map<string, DiagramNode[]>(ordered.map((a) => [a.id, []]));
  const orphans: DiagramNode[] = [];
  for (const uc of useCases) {
    const a = ucActor.get(uc.id);
    if (a && byActor.has(a)) byActor.get(a)!.push(uc);
    else orphans.push(uc);
  }

  // Shared column count so blocks align into clean global columns.
  const biggest = Math.max(1, ...[...byActor.values()].map((l) => l.length), orphans.length);
  const cols = Math.min(3, Math.ceil(Math.sqrt(biggest)));
  const colGap = 56, rowGap = 30, blockGap = 56;

  const actorY = new Map<string, number>();
  let y = 0;
  const placeBlock = (actorId: string | null, list: DiagramNode[]) => {
    if (!list.length) return;
    list.forEach((uc, i) => {
      pos.set(uc.id, {
        x: (i % cols) * (UC_W + colGap),
        y: y + Math.floor(i / cols) * (UC_H + rowGap),
      });
    });
    const rows = Math.ceil(list.length / cols);
    const h = rows * UC_H + (rows - 1) * rowGap;
    if (actorId) actorY.set(actorId, y + h / 2);
    y += h + blockGap;
  };
  for (const a of ordered) placeBlock(a.id, byActor.get(a.id)!);
  placeBlock(null, orphans);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pos.values()) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + UC_W); maxY = Math.max(maxY, p.y + UC_H);
  }
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = UC_W; maxY = UC_H; }

  const pad = 64, header = 52;
  const boundary = {
    x: minX - pad,
    y: minY - pad - header,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2 + header,
  };

  // Actors sit beside their block centre — humans left, system actors right.
  const sideGap = 96;
  const placeActor = (a: DiagramNode, x: number) => {
    const cy = actorY.get(a.id) ?? boundary.y + boundary.height / 2;
    pos.set(a.id, { x, y: cy - ACTOR_H / 2 });
  };
  for (const a of leftActors) placeActor(a, boundary.x - sideGap - ACTOR_W);
  for (const a of rightActors) placeActor(a, boundary.x + boundary.width + sideGap);

  return { pos, boundary };
}
function intersection(node: InternalNode, other: InternalNode) {
  const w = (node.measured.width ?? 0) / 2;
  const h = (node.measured.height ?? 0) / 2;
  const x2 = node.internals.positionAbsolute.x + w;
  const y2 = node.internals.positionAbsolute.y + h;
  const x1 = other.internals.positionAbsolute.x + (other.measured.width ?? 0) / 2;
  const y1 = other.internals.positionAbsolute.y + (other.measured.height ?? 0) / 2;
  const xx = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx) + Math.abs(yy) || 1);
  return { x: w * (a * xx + a * yy) + x2, y: h * (-a * xx + a * yy) + y2 };
}

function borderSide(node: InternalNode, p: { x: number; y: number }) {
  const nx = node.internals.positionAbsolute.x;
  const ny = node.internals.positionAbsolute.y;
  if (p.x <= nx + 1) return Position.Left;
  if (p.x >= nx + (node.measured.width ?? 0) - 1) return Position.Right;
  if (p.y <= ny + 1) return Position.Top;
  return Position.Bottom;
}

function FloatingEdge({ id, source, target, style, data }: EdgeProps) {
  const s = useInternalNode(source);
  const t = useInternalNode(target);
  if (!s?.measured?.width || !t?.measured?.width) return null;
  const sp = intersection(s, t);
  const tp = intersection(t, s);
  const d = data as
    | { label?: string; markerStart?: string; markerEnd?: string; straight?: boolean }
    | undefined;
  const [path, labelX, labelY] = d?.straight
    ? getStraightPath({ sourceX: sp.x, sourceY: sp.y, targetX: tp.x, targetY: tp.y })
    : getSmoothStepPath({
        sourceX: sp.x,
        sourceY: sp.y,
        sourcePosition: borderSide(s, sp),
        targetX: tp.x,
        targetY: tp.y,
        targetPosition: borderSide(t, tp),
        borderRadius: 12,
      });
  return (
    <BaseEdge
      id={id}
      path={path}
      markerStart={d?.markerStart}
      markerEnd={d?.markerEnd}
      style={style}
      label={d?.label}
      labelX={labelX}
      labelY={labelY}
      labelStyle={{ fill: "oklch(0.84 0.03 255)", fontSize: 10, fontWeight: 600 }}
      labelShowBg
      labelBgStyle={{ fill: "oklch(0.15 0.02 255)", fillOpacity: 0.92 }}
      labelBgPadding={[6, 3]}
      labelBgBorderRadius={4}
    />
  );
}

/** Canonical UML relationship markers (hollow triangle, diamonds, open arrow). */
const UML_PURPLE = "oklch(0.68 0.16 300)";
const UML_TEAL = "oklch(0.72 0.13 195)";
const UML_GRAY = "oklch(0.62 0.05 255)";
const UML_FILL = "oklch(0.13 0.02 250)"; // canvas bg → makes hollow markers opaque

function UmlMarkers() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        {/* Generalization / realization → hollow triangle at target */}
        <marker id="uml-tri" markerWidth="20" markerHeight="20" refX="17" refY="6" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M1,1 L17,6 L1,11 z" fill={UML_FILL} stroke={UML_PURPLE} strokeWidth="1.4" />
        </marker>
        {/* Composition → filled diamond at owner */}
        <marker id="uml-diamond-filled" markerWidth="24" markerHeight="14" refX="1" refY="6" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M1,6 L11,1 L21,6 L11,11 z" fill={UML_TEAL} stroke={UML_TEAL} strokeWidth="1" />
        </marker>
        {/* Aggregation → hollow diamond at owner */}
        <marker id="uml-diamond-hollow" markerWidth="24" markerHeight="14" refX="1" refY="6" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M1,6 L11,1 L21,6 L11,11 z" fill={UML_FILL} stroke={UML_TEAL} strokeWidth="1.4" />
        </marker>
        {/* Association / dependency → open arrow at target */}
        <marker id="uml-arrow" markerWidth="16" markerHeight="16" refX="9" refY="5" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M1,1 L9,5 L1,9" fill="none" stroke={UML_GRAY} strokeWidth="1.4" />
        </marker>
        {/* ERD relations → filled arrow at target (preserves prior ERD look) */}
        <marker id="uml-arrow-filled" markerWidth="16" markerHeight="16" refX="9" refY="5" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M1,1 L10,5 L1,9 z" fill={UML_GRAY} stroke={UML_GRAY} strokeWidth="1" />
        </marker>
      </defs>
    </svg>
  );
}

/** Maps a UML relationship to its marker ends, line style and colour. */
function umlEdgeStyle(direction: DiagramEdge["direction"]) {
  switch (direction) {
    case "INHERITS":
      return { color: UML_PURPLE, dashed: false, markerEnd: "url(#uml-tri)", markerStart: undefined };
    case "IMPLEMENTS":
      return { color: UML_PURPLE, dashed: true, markerEnd: "url(#uml-tri)", markerStart: undefined };
    case "COMPOSES":
      return { color: UML_TEAL, dashed: false, markerEnd: undefined, markerStart: "url(#uml-diamond-filled)" };
    case "AGGREGATES":
      return { color: UML_TEAL, dashed: false, markerEnd: undefined, markerStart: "url(#uml-diamond-hollow)" };
    case "DEPENDS":
      return { color: UML_GRAY, dashed: true, markerEnd: "url(#uml-arrow)", markerStart: undefined };
    case "INCLUDES":
    case "EXTENDS":
      return { color: UML_GRAY, dashed: true, markerEnd: "url(#uml-arrow)", markerStart: undefined };
    case "ONE_TO_ONE":
    case "ONE_TO_MANY":
    case "MANY_TO_MANY":
      return { color: UML_GRAY, dashed: false, markerEnd: "url(#uml-arrow-filled)", markerStart: undefined };
    default: // ASSOCIATES → plain UML association line
      return { color: UML_GRAY, dashed: false, markerEnd: undefined, markerStart: undefined };
  }
}

const edgeTypes = { floating: FloatingEdge };

/** Frames the dagre-arranged graph once nodes are measured, and re-fits on regenerate. */
function AutoFit({ dep }: { dep: string }) {
  const initialized = useNodesInitialized();
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (initialized) void fitView({ padding: 0.2, duration: 300 });
  }, [initialized, dep, fitView]);
  return null;
}

function TableNode({ data, selected }: NodeProps) {
  const node = (data as { node: DiagramNode }).node;
  const columns = colsOf(node);
  return (
    <div
      style={{ width: NODE_W }}
      className={cn(
        "overflow-hidden rounded-lg border bg-[oklch(0.16_0.02_255)] shadow-xl transition-all hover:shadow-2xl",
        selected
          ? "border-[oklch(0.70_0.15_255)] ring-2 ring-[oklch(0.62_0.16_250)]/50"
          : "border-[oklch(0.34_0.03_255)] hover:border-[oklch(0.46_0.06_255)]",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <div
        style={{ height: HEADER_H }}
        className="flex items-center gap-2 bg-gradient-to-r from-[oklch(0.31_0.10_265)] to-[oklch(0.24_0.06_265)] px-3"
      >
        <Table2 className="size-3.5 shrink-0 text-[oklch(0.86_0.10_265)]" />
        <span className="flex-1 truncate text-[13px] font-semibold tracking-wide text-[oklch(0.96_0.02_265)]">
          {node.label}
        </span>
        <span className="shrink-0 text-[10px] font-medium text-[oklch(0.72_0.05_265)]">
          {columns.length}
        </span>
      </div>
      <div>
        {columns.map((c) => (
          <div
            key={c.name}
            style={{ height: ROW_H }}
            className={cn(
              "flex items-center gap-2 border-t border-[oklch(0.23_0.02_255)] px-3 text-[11px] transition-colors hover:bg-[oklch(0.23_0.03_265)]",
              c.isPrimaryKey && "bg-[oklch(0.21_0.04_265)]",
            )}
          >
            <span className="flex w-3.5 shrink-0 justify-center">
              {c.isPrimaryKey ? (
                <KeyRound className="size-3 text-[oklch(0.82_0.13_85)]" />
              ) : c.isForeignKey ? (
                <Link2 className="size-3 text-[oklch(0.70_0.12_250)]" />
              ) : null}
            </span>
            <span
              className={cn(
                "flex-1 truncate font-mono text-[oklch(0.87_0.02_255)]",
                c.isPrimaryKey && "font-semibold",
              )}
            >
              {c.name}
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-[oklch(0.58_0.04_255)]">
              {c.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassNode({ data, selected }: NodeProps) {
  const node = (data as { node: DiagramNode }).node;
  const d = classOf(node);
  const props = d.properties ?? [];
  const methods = d.methods ?? [];
  const visSym = (v: string) => (v === "private" ? "−" : v === "protected" ? "#" : "+");
  const rowCls =
    "flex items-center gap-2 border-t border-[oklch(0.23_0.02_290)] px-3 text-[11px] transition-colors hover:bg-[oklch(0.23_0.03_300)]";
  return (
    <div
      style={{ width: NODE_W }}
      className={cn(
        "overflow-hidden rounded-lg border bg-[oklch(0.16_0.02_290)] shadow-xl transition-all hover:shadow-2xl",
        selected
          ? "border-[oklch(0.70_0.15_300)] ring-2 ring-[oklch(0.64_0.16_300)]/50"
          : node.isNew
            ? "border-[oklch(0.80_0.16_85)] ring-2 ring-[oklch(0.80_0.16_85)]/50"
            : "border-[oklch(0.34_0.03_290)] hover:border-[oklch(0.48_0.08_300)]",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <div
        style={{ height: HEADER_H }}
        className="flex flex-col justify-center bg-gradient-to-r from-[oklch(0.31_0.11_300)] to-[oklch(0.23_0.06_300)] px-3"
      >
        {d.stereotype && (
          <span className="text-[9px] uppercase leading-none tracking-wider text-[oklch(0.80_0.08_300)]">
            «{d.stereotype}»
          </span>
        )}
        <span className="flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-[oklch(0.96_0.02_300)]">
          <Braces className="size-3.5 shrink-0 text-[oklch(0.85_0.10_300)]" />
          <span className="truncate">{node.label}</span>
          {node.isNew && (
            <span className="ml-auto shrink-0 rounded-[3px] bg-[oklch(0.80_0.16_85)] px-1 py-px text-[8px] font-bold uppercase leading-none text-[oklch(0.20_0.05_85)]">
              new
            </span>
          )}
        </span>
      </div>
      <div>
        {props.map((p, i) => (
          <div key={`p-${i}`} style={{ height: ROW_H }} className={rowCls}>
            <span className="w-3 shrink-0 text-center font-mono text-[oklch(0.72_0.11_300)]">{visSym(p.visibility)}</span>
            <span className="flex-1 truncate font-mono text-[oklch(0.87_0.02_290)]">{p.name}</span>
            <span className="ml-1 shrink-0 truncate font-mono text-[10px] text-[oklch(0.58_0.04_290)]" style={{ maxWidth: "44%" }}>{p.type}</span>
          </div>
        ))}
        {methods.map((m, i) => (
          <div key={`m-${i}`} style={{ height: ROW_H }} className={rowCls}>
            <span className="w-3 shrink-0 text-center font-mono text-[oklch(0.72_0.12_145)]">+</span>
            <span className="flex-1 truncate font-mono text-[oklch(0.80_0.05_145)]">{m}()</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActorNode({ data, selected }: NodeProps) {
  const node = (data as { node: DiagramNode }).node;
  const tone = selected
    ? "text-[oklch(0.84_0.14_145)]"
    : node.isNew
      ? "text-[oklch(0.80_0.16_85)]"
      : "text-[oklch(0.78_0.10_145)]";
  return (
    <div className="flex flex-col items-center gap-1" style={{ width: ACTOR_W }}>
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <svg width="40" height="56" viewBox="0 0 40 56" className={cn("transition-colors", tone)}>
        <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="20" cy="9" r="7" />
          <line x1="20" y1="16" x2="20" y2="36" />
          <line x1="6" y1="23" x2="34" y2="23" />
          <line x1="20" y1="36" x2="8" y2="52" />
          <line x1="20" y1="36" x2="32" y2="52" />
        </g>
      </svg>
      <span className="text-center text-[11px] font-medium leading-tight text-[oklch(0.86_0.03_145)]">
        {node.label}
      </span>
    </div>
  );
}

function UseCaseNode({ data, selected }: NodeProps) {
  const node = (data as { node: DiagramNode }).node;
  return (
    <div
      style={{ width: UC_W, height: UC_H }}
      className={cn(
        "relative flex items-center justify-center rounded-[50%] border px-6 text-center shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl",
        selected
          ? "border-[oklch(0.76_0.15_55)] bg-gradient-to-b from-[oklch(0.30_0.08_55)] to-[oklch(0.21_0.05_55)] ring-2 ring-[oklch(0.72_0.15_55)]/50"
          : node.isNew
            ? "border-[oklch(0.80_0.16_85)] bg-gradient-to-b from-[oklch(0.28_0.08_70)] to-[oklch(0.20_0.05_70)] ring-2 ring-[oklch(0.80_0.16_85)]/40"
            : "border-[oklch(0.48_0.08_55)] bg-gradient-to-b from-[oklch(0.24_0.05_55)] to-[oklch(0.17_0.03_55)] hover:border-[oklch(0.62_0.12_55)]",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <span className="line-clamp-3 text-[12px] font-medium leading-tight text-[oklch(0.94_0.03_60)]">
        {node.label}
      </span>
    </div>
  );
}

function BoundaryNode({ data }: NodeProps) {
  const label = (data as { label?: string }).label ?? "System";
  return (
    <div className="pointer-events-none relative h-full w-full overflow-hidden rounded-2xl border border-[oklch(0.40_0.05_255)] bg-gradient-to-b from-[oklch(0.17_0.03_255)]/70 to-[oklch(0.12_0.02_255)]/30 shadow-[inset_0_1px_0_oklch(0.55_0.06_255/0.18)]">
      <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 border-b border-[oklch(0.32_0.04_255)] bg-[oklch(0.20_0.04_255)]/55 py-3">
        <Boxes className="size-4 text-[oklch(0.72_0.13_255)]" />
        <span className="text-sm font-semibold tracking-wide text-[oklch(0.88_0.04_255)]">{label}</span>
      </div>
    </div>
  );
}

const nodeTypes = {
  erdTable: TableNode,
  classNode: ClassNode,
  actorNode: ActorNode,
  useCaseNode: UseCaseNode,
  boundaryNode: BoundaryNode,
};

const btnBase =
  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors";
const arrangeBtn = cn(
  btnBase,
  "bg-[oklch(0.62_0.16_255)] font-semibold text-[oklch(0.15_0.03_255)] hover:bg-[oklch(0.69_0.16_255)]",
);
const exportBtn = cn(
  btnBase,
  "border border-[oklch(0.34_0.03_255)] bg-[oklch(0.18_0.02_255)] text-[oklch(0.86_0.02_255)] hover:border-[oklch(0.52_0.12_255)] hover:bg-[oklch(0.24_0.03_255)] hover:text-white",
);

// Dark-theme the React Flow zoom/fit control buttons (white by default).
const controlsStyle = {
  "--xy-controls-button-background-color": "oklch(0.17 0.02 250)",
  "--xy-controls-button-background-color-hover": "oklch(0.26 0.05 255)",
  "--xy-controls-button-color": "oklch(0.82 0.02 250)",
  "--xy-controls-button-color-hover": "oklch(0.96 0.02 255)",
  "--xy-controls-button-border-color": "oklch(0.26 0.02 250)",
} as CSSProperties;

/** Toolbar: auto-arrange + watermarked PNG export. */
function Toolbar({ onArrange }: { onArrange: () => void }) {
  const { getNodes } = useReactFlow();

  const onExport = useCallback(() => {
    const nodes = getNodes();
    const viewport = document.querySelector<HTMLElement>(".react-flow__viewport");
    if (!nodes.length || !viewport) return;
    const bounds = getNodesBounds(nodes);
    const pad = 48;
    const w = Math.ceil(bounds.width + pad * 2);
    const h = Math.ceil(bounds.height + pad * 2);
    // Keep the output within browser canvas limits (huge schemas otherwise throw).
    const ratio = Math.min(2, 8000 / Math.max(w, h));

    void toPng(viewport, {
      backgroundColor: "#0c1018",
      width: w,
      height: h,
      pixelRatio: ratio,
      skipFonts: true,
      style: {
        width: `${w}px`,
        height: `${h}px`,
        transform: `translate(${pad - bounds.x}px, ${pad - bounds.y}px) scale(1)`,
      },
    })
      .then((dataUrl) => {
        const base = new Image();
        base.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = base.width;
          canvas.height = base.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(base, 0, 0);
          const save = () => {
            const a = document.createElement("a");
            a.href = canvas.toDataURL("image/png");
            a.download = "diagram.png";
            a.click();
          };
          const logo = new Image();
          logo.onload = () => {
            const lw = Math.min(base.width * 0.16, 240);
            const lh = (logo.height / logo.width) * lw;
            const m = base.width * 0.02;
            ctx.globalAlpha = 0.55;
            ctx.drawImage(logo, base.width - lw - m, base.height - lh - m, lw, lh);
            ctx.globalAlpha = 1;
            save();
          };
          logo.onerror = save;
          logo.src = "/logo-noback.png";
        };
        base.src = dataUrl;
      })
      .catch((err) => {
        console.error("ERD export failed", err);
        toast.error("Could not export the diagram as an image.");
      });
  }, [getNodes]);

  return (
    <Panel position="top-right" className="flex gap-2">
      <button type="button" onClick={onArrange} title="Auto-arrange tables" className={arrangeBtn}>
        <Wand2 className="size-3.5" />
        Arrange
      </button>
      <button type="button" onClick={onExport} title="Export as PNG" className={exportBtn}>
        <Download className="size-3.5" />
        PNG
      </button>
    </Panel>
  );
}

export default function DiagramFlow({
  nodes,
  edges,
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<DiagramNode | null>(null);

  const isUseCase = useMemo(
    () => nodes.some((n) => n.type === "ACTOR" || n.type === "USE_CASE"),
    [nodes],
  );

  const items = useMemo(
    () =>
      nodes.filter((n) =>
        isUseCase
          ? n.type === "ACTOR" || n.type === "USE_CASE"
          : n.type === "TABLE" || n.type === "CLASS",
      ),
    [nodes, isUseCase],
  );

  const sig = useMemo(() => items.map((n) => n.id).join("|"), [items]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const ids = new Set(items.map((n) => n.id));
    const mkEdges = (): Edge[] =>
      edges
        .filter((e) => ids.has(e.fromId) && ids.has(e.toId))
        .map((e, i) => {
          const u = umlEdgeStyle(e.direction);
          return {
            id: `e${i}`,
            source: e.fromId,
            target: e.toId,
            type: "floating",
            data: { label: e.label, markerStart: u.markerStart, markerEnd: u.markerEnd, straight: isUseCase },
            style: { stroke: u.color, strokeWidth: 1.5, strokeDasharray: u.dashed ? "6 4" : undefined },
          };
        });

    if (isUseCase) {
      const actors = items.filter((n) => n.type === "ACTOR");
      const useCases = items.filter((n) => n.type === "USE_CASE");
      const { pos, boundary } = layoutUseCase(actors, useCases, edges);
      const boundaryNode: Node = {
        id: BOUNDARY_ID,
        type: "boundaryNode",
        position: { x: boundary.x, y: boundary.y },
        data: { label: "System" },
        style: { width: boundary.width, height: boundary.height },
        selectable: false,
        draggable: false,
        zIndex: 0,
      };
      const flowNodes: Node[] = items.map((n) => ({
        id: n.id,
        type: n.type === "ACTOR" ? "actorNode" : "useCaseNode",
        position: pos.get(n.id) ?? { x: 0, y: 0 },
        data: { node: n },
        zIndex: 1,
      }));
      return { initialNodes: [boundaryNode, ...flowNodes], initialEdges: mkEdges() };
    }

    const pos = layout(items, edges);
    const initialNodes: Node[] = items.map((n) => ({
      id: n.id,
      type: n.type === "CLASS" ? "classNode" : "erdTable",
      position: pos.get(n.id) ?? { x: 0, y: 0 },
      data: { node: n },
    }));
    return { initialNodes, initialEdges: mkEdges() };
  }, [items, edges, isUseCase]);

  // Stateful nodes/edges — required so dragging actually moves tables.
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);
  useEffect(() => {
    setRfNodes(initialNodes);
    setRfEdges(initialEdges);
  }, [initialNodes, initialEdges, setRfNodes, setRfEdges]);

  const onArrange = useCallback(() => {
    if (isUseCase) {
      const { pos, boundary } = layoutUseCase(
        items.filter((n) => n.type === "ACTOR"),
        items.filter((n) => n.type === "USE_CASE"),
        edges,
      );
      setRfNodes((nds) =>
        nds.map((n) =>
          n.id === BOUNDARY_ID
            ? { ...n, position: { x: boundary.x, y: boundary.y }, style: { ...n.style, width: boundary.width, height: boundary.height } }
            : { ...n, position: pos.get(n.id) ?? n.position },
        ),
      );
      return;
    }
    const pos = layout(items, edges);
    setRfNodes((nds) =>
      nds.map((n) => ({ ...n, position: pos.get(n.id) ?? n.position })),
    );
  }, [items, edges, isUseCase, setRfNodes]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full overflow-hidden rounded-md border border-[oklch(0.24_0.02_250)] bg-[oklch(0.13_0.02_250)]"
      style={{ height: 600 }}
    >
      <UmlMarkers />
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2.5}
        nodesDraggable
        elementsSelectable
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        panOnDrag
        nodeDragThreshold={1}
        nodesConnectable={false}
        onNodeClick={(_, n) => {
          const nd = (n.data as { node?: DiagramNode }).node;
          if (nd) setSelected(nd);
        }}
      >
        <Background gap={22} color="oklch(0.22 0.02 250)" />
        <AutoFit dep={sig} />
        <Toolbar onArrange={onArrange} />
        <MiniMap
          pannable
          zoomable
          nodeColor="oklch(0.30 0.05 255)"
          nodeStrokeColor="oklch(0.62 0.16 250)"
          nodeStrokeWidth={3}
          nodeBorderRadius={4}
          maskColor="oklch(0.10 0.02 250 / 0.6)"
          className="!rounded-md !border !border-[oklch(0.28_0.02_250)] overflow-hidden"
          style={{ background: "oklch(0.10 0.02 250)" }}
        />
        <Controls showInteractive={false} style={controlsStyle} />
      </ReactFlow>
      <NodeInfoPanel
        node={selected}
        onClose={() => setSelected(null)}
        excludeRef={wrapperRef}
      />
    </div>
  );
}
