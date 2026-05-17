import type { DiagramNode, DiagramEdge } from "@/features/diagram/types";

export function generateSequenceDiagram(fileContents: Record<string, string>): {
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  warning?: string;
} {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const lines: string[] = ["sequenceDiagram"];

  const participantSet = new Set<string>();
  const interactions: Array<{ from: string; to: string; label: string; isAsync: boolean }> = [];

  for (const [filePath, content] of Object.entries(fileContents)) {
    const fileName = filePath.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "module";

    const funcMatches = content.matchAll(
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/g,
    );
    for (const m of funcMatches) {
      const name = m[1] ?? m[2];
      if (name) participantSet.add(name);
    }

    const callMatches = content.matchAll(/(\w+)\s*\.\s*(\w+)\s*\(/g);
    for (const m of callMatches) {
      const caller = m[1];
      const callee = m[2];
      if (caller && callee && caller !== callee) {
        interactions.push({ from: caller, to: callee, label: `${callee}()`, isAsync: false });
      }
    }

    const awaitMatches = content.matchAll(/await\s+(\w+)\s*\.\s*(\w+)\s*\(/g);
    for (const m of awaitMatches) {
      const caller = fileName;
      const callee = m[1];
      const method = m[2];
      if (callee && method) {
        interactions.push({ from: caller, to: callee, label: `${method}()`, isAsync: true });
      }
    }
  }

  const allParticipants = participantSet.size > 0
    ? [...participantSet].slice(0, 8)
    : ["Client", "Server"];

  for (const p of allParticipants) {
    lines.push(`  participant ${p}`);
    nodes.push({ id: p, label: p, type: "ACTOR", detail: { description: p, interactions: [] } });
  }

  const seen = new Set<string>();
  let edgeIdx = 0;
  for (const { from, to, label, isAsync } of interactions) {
    if (!allParticipants.includes(from) || !allParticipants.includes(to)) continue;
    const key = `${from}->${to}:${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const arrow = isAsync ? "->>" : "->";
    lines.push(`  ${from}${arrow}${to}: ${label}`);
    edges.push({ fromId: from, toId: to, label, direction: "ASSOCIATES" });
    edgeIdx++;
    if (edgeIdx >= 20) break;
  }

  if (edgeIdx === 0) {
    const [p1, p2] = allParticipants;
    lines.push(`  ${p1}->>${p2}: request`);
    lines.push(`  ${p2}-->>${p1}: response`);
    edges.push({ fromId: p1!, toId: p2!, label: "request", direction: "ASSOCIATES" });
    edges.push({ fromId: p2!, toId: p1!, label: "response", direction: "ASSOCIATES" });
  }

  return {
    definition: lines.join("\n"),
    nodes,
    edges,
    warning: participantSet.size === 0
      ? "Could not detect participants; showing a generic sequence diagram."
      : undefined,
  };
}
