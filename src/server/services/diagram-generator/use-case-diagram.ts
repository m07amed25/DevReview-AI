import type { DiagramNode, DiagramEdge, DiagramNodeDetailUseCase } from "@/features/diagram/types";

export function generateUseCaseDiagram(fileContents: Record<string, string>): {
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  warning?: string;
} {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  const toLabel = (name: string) =>
    name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

  const actorSet = new Set<string>(["User"]);

  for (const [filePath, content] of Object.entries(fileContents)) {
    if (/webhook/i.test(filePath)) actorSet.add("GitHub");
    if (/inngest/i.test(filePath) || content.includes("inngest.createFunction"))
      actorSet.add("Inngest");
    if (/[/\\]admin[/\\.]/.test(filePath) || content.includes("adminProcedure"))
      actorSet.add("Admin");
  }

  const actorDescriptions: Record<string, string> = {
    User: "Authenticated developer using the application",
    Admin: "System administrator with elevated privileges",
    GitHub: "GitHub platform — sends webhook events",
    Inngest: "Background job runner (scheduled / event-driven tasks)",
  };

  for (const actorName of actorSet) {
    nodes.push({
      id: `actor_${actorName}`,
      label: actorName,
      type: "ACTOR",
      detail: {
        description: actorDescriptions[actorName] ?? actorName,
        interactions: [],
      } as DiagramNodeDetailUseCase,
    });
  }

  type GroupInfo = { label: string; ucIds: string[]; actorIds: Set<string> };
  const groups = new Map<string, GroupInfo>();

  const resolveActor = (filePath: string, content: string): string => {
    if (/webhook/i.test(filePath)) return "actor_GitHub";
    if (/inngest/i.test(filePath) || content.includes("inngest.createFunction"))
      return "actor_Inngest";
    if (/[/\\]admin[/\\.]/.test(filePath)) return "actor_Admin";
    return "actor_User";
  };

  for (const [filePath, content] of Object.entries(fileContents)) {
    const fileName =
      filePath.split(/[/\\]/).pop()?.replace(/\.(ts|tsx|js|jsx)$/, "") ?? "unknown";
    const groupId = `grp_${fileName.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const groupLabel = toLabel(fileName);

    if (!groups.has(groupId)) {
      groups.set(groupId, { label: groupLabel, ucIds: [], actorIds: new Set() });
    }
    const group = groups.get(groupId)!;
    const defaultActor = resolveActor(filePath, content);

    // HTTP route handlers (Next.js route.ts files)
    const routeRegex =
      /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD)\s*\(/g;
    let routeMatch: RegExpExecArray | null;
    while ((routeMatch = routeRegex.exec(content)) !== null) {
      const method = routeMatch[1]!;
      const pathSeg = filePath.replace(/.*\/app\/api\//, "").replace(/\/route\.(ts|js)$/, "");
      const ucId = `uc_${method}_${pathSeg.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const label = `${method} /${pathSeg}`;
      if (!nodes.find((n) => n.id === ucId)) {
        nodes.push({
          id: ucId, label, type: "USE_CASE",
          detail: { description: `HTTP ${method} handler`, interactions: [defaultActor.replace("actor_", "")] } as DiagramNodeDetailUseCase,
        });
        group.ucIds.push(ucId);
        group.actorIds.add(defaultActor);
        edges.push({ fromId: defaultActor, toId: ucId, label: "calls", direction: "ASSOCIATES" });
      }
    }

    // tRPC procedures
    const procRegex = /(\w+):\s*(publicProcedure|protectedProcedure|adminProcedure)\b/g;
    let procMatch: RegExpExecArray | null;
    while ((procMatch = procRegex.exec(content)) !== null) {
      const procName = procMatch[1]!;
      const procType = procMatch[2]!;
      if (["default", "createTRPCRouter", "router", "procedure"].includes(procName)) continue;
      const ucId = `uc_trpc_${groupId}_${procName}`;
      const label = toLabel(procName);
      const actor = procType === "adminProcedure" ? "actor_Admin" : "actor_User";
      if (!nodes.find((n) => n.id === ucId)) {
        nodes.push({
          id: ucId, label, type: "USE_CASE",
          detail: { description: `tRPC ${procType.replace("Procedure", "")} – ${label}`, interactions: [actor.replace("actor_", "")] } as DiagramNodeDetailUseCase,
        });
        group.ucIds.push(ucId);
        group.actorIds.add(actor);
        edges.push({ fromId: actor, toId: ucId, label: "uses", direction: "ASSOCIATES" });
      }
    }

    // Inngest background functions
    if (/inngest/i.test(filePath) || content.includes("inngest.createFunction")) {
      const fnIdRegex = /\bid:\s*["']([^"']+)["']/g;
      let fnIdMatch: RegExpExecArray | null;
      while ((fnIdMatch = fnIdRegex.exec(content)) !== null) {
        const fnId = fnIdMatch[1]!;
        const ucId = `uc_inngest_${fnId.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const label = toLabel(fnId);
        if (!nodes.find((n) => n.id === ucId)) {
          nodes.push({
            id: ucId, label, type: "USE_CASE",
            detail: { description: `Background job: ${fnId}`, interactions: ["Inngest"] } as DiagramNodeDetailUseCase,
          });
          group.ucIds.push(ucId);
          group.actorIds.add("actor_Inngest");
          edges.push({ fromId: "actor_Inngest", toId: ucId, label: "runs", direction: "ASSOCIATES" });
        }
      }
    }

    // Express / Fastify / Koa / Hono routes
    const expressRegex =
      /(?:router|app|server|routes?)\.(get|post|put|patch|delete|all|use)\s*\(\s*["'`]([^"'`\n]+)["'`]/gi;
    let expressMatch: RegExpExecArray | null;
    while ((expressMatch = expressRegex.exec(content)) !== null) {
      const method = expressMatch[1]!.toUpperCase();
      const routePath = expressMatch[2]!;
      const ucId = `uc_exp_${groupId}_${method}_${routePath.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const label = `${method} ${routePath}`;
      if (!nodes.find((n) => n.id === ucId)) {
        nodes.push({
          id: ucId, label, type: "USE_CASE",
          detail: { description: `${method} ${routePath}`, interactions: [defaultActor.replace("actor_", "")] } as DiagramNodeDetailUseCase,
        });
        group.ucIds.push(ucId);
        group.actorIds.add(defaultActor);
        edges.push({ fromId: defaultActor, toId: ucId, label: "calls", direction: "ASSOCIATES" });
      }
    }

    // NestJS / Spring-style decorators
    const nestRegex =
      /@(Get|Post|Put|Patch|Delete|All)\s*\(\s*["'`]?([^"'`)\n]*)["'`]?\s*\)\s*(?:[\s\S]{0,60}?)(?:async\s+)?(\w+)\s*\(/g;
    let nestMatch: RegExpExecArray | null;
    while ((nestMatch = nestRegex.exec(content)) !== null) {
      const method = nestMatch[1]!.toUpperCase();
      const routePath = nestMatch[2]?.trim() || "/";
      const handlerName = nestMatch[3]!;
      const ucId = `uc_nest_${groupId}_${handlerName}`;
      const label = `${method} ${routePath || "/"} (${toLabel(handlerName)})`;
      if (!nodes.find((n) => n.id === ucId)) {
        nodes.push({
          id: ucId, label, type: "USE_CASE",
          detail: { description: `${method} ${routePath || "/"}`, interactions: [defaultActor.replace("actor_", "")] } as DiagramNodeDetailUseCase,
        });
        group.ucIds.push(ucId);
        group.actorIds.add(defaultActor);
        edges.push({ fromId: defaultActor, toId: ucId, label: "calls", direction: "ASSOCIATES" });
      }
    }

    // FastAPI / Flask / Django style decorators
    const fastApiRegex =
      /@\w+\.(?:route|get|post|put|patch|delete)\s*\(\s*["'`]([^"'`\n]+)["'`]/g;
    let fastApiMatch: RegExpExecArray | null;
    while ((fastApiMatch = fastApiRegex.exec(content)) !== null) {
      const routePath = fastApiMatch[1]!;
      const methodGuess = /methods\s*=.*['"](\w+)['"]/.exec(content) ?? null;
      const method = methodGuess ? methodGuess[1]!.toUpperCase() : "HTTP";
      const ucId = `uc_py_${groupId}_${routePath.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const label = `${method} ${routePath}`;
      if (!nodes.find((n) => n.id === ucId)) {
        nodes.push({
          id: ucId, label, type: "USE_CASE",
          detail: { description: `Route: ${routePath}`, interactions: [defaultActor.replace("actor_", "")] } as DiagramNodeDetailUseCase,
        });
        group.ucIds.push(ucId);
        group.actorIds.add(defaultActor);
        edges.push({ fromId: defaultActor, toId: ucId, label: "calls", direction: "ASSOCIATES" });
      }
    }

    // Generic fallback: exported named functions
    if (
      group.ucIds.length === 0 &&
      /route|controller|handler|service|endpoint|action|resolver/i.test(fileName)
    ) {
      const namedFnRegex =
        /export\s+(?:async\s+)?function\s+(\w+)\s*\(|export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(/g;
      const skipNames = new Set(["default", "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
      let fnMatch: RegExpExecArray | null;
      while ((fnMatch = namedFnRegex.exec(content)) !== null) {
        const fnName = (fnMatch[1] ?? fnMatch[2])!;
        if (skipNames.has(fnName)) continue;
        if (/^[A-Z_0-9]+$/.test(fnName)) continue;
        const ucId = `uc_fn_${groupId}_${fnName}`;
        const label = toLabel(fnName);
        if (!nodes.find((n) => n.id === ucId)) {
          nodes.push({
            id: ucId, label, type: "USE_CASE",
            detail: { description: `Function: ${fnName}`, interactions: [defaultActor.replace("actor_", "")] } as DiagramNodeDetailUseCase,
          });
          group.ucIds.push(ucId);
          group.actorIds.add(defaultActor);
          edges.push({ fromId: defaultActor, toId: ucId, label: "triggers", direction: "ASSOCIATES" });
        }
      }
    }
  }

  for (const [id, g] of groups) {
    if (g.ucIds.length === 0) groups.delete(id);
  }

  if (nodes.filter((n) => n.type === "USE_CASE").length === 0) {
    const skeletonId = "uc_system_boundary";
    nodes.push({
      id: skeletonId,
      label: "System (no route patterns detected)",
      type: "USE_CASE",
      detail: {
        description: "No recognisable route or procedure patterns found in the provided files.",
        interactions: ["User"],
      } as DiagramNodeDetailUseCase,
    });
    edges.push({ fromId: "actor_User", toId: skeletonId, label: "interacts", direction: "ASSOCIATES" });
    groups.set("grp_system", { label: "System", ucIds: [skeletonId], actorIds: new Set(["actor_User"]) });
  }

  // Build Mermaid flowchart
  const lines: string[] = ["flowchart LR"];

  const sortedActors = [...actorSet].sort();
  for (const actorName of sortedActors) {
    lines.push(`  actor_${actorName}(("${actorName}"))`);
  }

  const sortedGroups = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [groupId, group] of sortedGroups) {
    lines.push(`  subgraph ${groupId}["${group.label}"]`);
    const sortedUcIds = [...group.ucIds].sort();
    for (const ucId of sortedUcIds) {
      const node = nodes.find((n) => n.id === ucId);
      if (!node) continue;
      lines.push(`    ${ucId}(["${node.label}"])`);
    }
    lines.push("  end");
  }

  const sortedEdges = [...edges].sort((a, b) =>
    `${a.fromId}-${a.toId}`.localeCompare(`${b.fromId}-${b.toId}`),
  );
  for (const edge of sortedEdges) {
    const arrow = edge.label === "runs" ? "-..->" : "-->";
    lines.push(`  ${edge.fromId} ${arrow} ${edge.toId}`);
  }

  return { definition: lines.join("\n"), nodes, edges: sortedEdges };
}
