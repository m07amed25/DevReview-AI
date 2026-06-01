import type { DiagramNode, DiagramEdge, DiagramNodeDetailClass } from "@/features/diagram/types";

function sanitizeMermaidClassType(raw: string): string {
  return (
    raw
      .replace(/\s*\|.*/g, "")
      .replace(/<([^>]*)>/g, (_, inner: string) => `~${inner.replace(/[,\s]+/g, "_")}~`)
      .replace(/[^\w[\]~]/g, "")
      .trim() || "any"
  );
}

function extractClassBodies(
  content: string,
): Array<{ name: string; parent?: string; impls: string[]; body: string }> {
  const results: Array<{ name: string; parent?: string; impls: string[]; body: string }> = [];
  const headerRegex =
    /(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s*<[^>]*>)?(?:\s+extends\s+([\w.]+)(?:\s*<[^>]*>)?)?(?:\s+implements\s+([\w,\s<>.]+?))?\s*\{/g;
  let header: RegExpExecArray | null;
  while ((header = headerRegex.exec(content)) !== null) {
    const className = header[1]!;
    const parentClass = header[2];
    const impls = (header[3] ?? "")
      .split(",")
      .map((s) => s.trim().replace(/<[^>]*>/g, "").replace(/\..*/, "").trim())
      .filter(Boolean);
    const openBrace = header.index + header[0].length - 1;
    let depth = 1;
    let i = openBrace + 1;
    while (i < content.length && depth > 0) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") depth--;
      i++;
    }
    results.push({ name: className, parent: parentClass, impls, body: content.slice(openBrace + 1, i - 1) });
  }
  return results;
}

function extractInterfaceBodies(
  content: string,
): Array<{ name: string; parents: string[]; body: string }> {
  const results: Array<{ name: string; parents: string[]; body: string }> = [];
  const headerRegex =
    /(?:export\s+)?interface\s+(\w+)(?:<[^>]*>)?(?:\s+extends\s+([\w,\s<>]+?))?\s*\{/g;
  let header: RegExpExecArray | null;
  while ((header = headerRegex.exec(content)) !== null) {
    const name = header[1]!;
    const extendsStr = header[2];
    const parents = extendsStr
      ? extendsStr.split(",").map((s) => s.trim().replace(/<[^>]*>/g, "").trim()).filter(Boolean)
      : [];
    const openBrace = header.index + header[0].length - 1;
    let depth = 1;
    let i = openBrace + 1;
    while (i < content.length && depth > 0) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") depth--;
      i++;
    }
    results.push({ name, parents, body: content.slice(openBrace + 1, i - 1) });
  }
  return results;
}

function extractObjectTypeBodies(
  content: string,
): Array<{ name: string; body: string }> {
  const results: Array<{ name: string; body: string }> = [];
  const headerRegex = /(?:export\s+)?type\s+(\w+)(?:<[^>]*>)?\s*=\s*\{/g;
  let header: RegExpExecArray | null;
  while ((header = headerRegex.exec(content)) !== null) {
    const name = header[1]!;
    const openBrace = header.index + header[0].length - 1;
    let depth = 1;
    let i = openBrace + 1;
    while (i < content.length && depth > 0) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") depth--;
      i++;
    }
    results.push({ name, body: content.slice(openBrace + 1, i - 1) });
  }
  return results;
}

export function generateClassDiagram(fileContents: Record<string, string>): {
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  warning?: string;
} {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const classMeta: Array<{ id: string; parent?: string; impls: string[]; body: string }> = [];
  const ifaceMeta: Array<{ id: string; parents: string[] }> = [];

  for (const [, content] of Object.entries(fileContents)) {
    const classBodies = extractClassBodies(content);

    for (const { name: className, parent: parentClass, impls, body } of classBodies) {
      const properties: Array<{
        name: string;
        type: string;
        visibility: "public" | "private" | "protected";
      }> = [];
      const methods: string[] = [];

      const propRegex =
        /^\s*(public|private|protected)?\s*(?:readonly\s+)?(\w+)\??:\s*([\w<>\[\]\s|,]+)/gm;
      let propMatch: RegExpExecArray | null;
      while ((propMatch = propRegex.exec(body)) !== null) {
        const vis = (propMatch[1] ?? "public") as "public" | "private" | "protected";
        properties.push({
          name: propMatch[2]!,
          type: sanitizeMermaidClassType(propMatch[3]!.trim()),
          visibility: vis,
        });
      }

      const methodRegex =
        /^\s*(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\(/gm;
      let methodMatch: RegExpExecArray | null;
      while ((methodMatch = methodRegex.exec(body)) !== null) {
        const name = methodMatch[1]!;
        if (name !== "constructor" && !methods.includes(name)) {
          methods.push(name);
        }
      }

      const detail: DiagramNodeDetailClass = { properties, methods };
      nodes.push({ id: `class_${className}`, label: className, type: "CLASS", detail });
      classMeta.push({ id: `class_${className}`, parent: parentClass, impls, body });
    }
  }

  // TypeScript interfaces
  for (const [, content] of Object.entries(fileContents)) {
    for (const { name, parents, body } of extractInterfaceBodies(content)) {
      if (nodes.find((n) => n.id === `class_${name}`)) continue;

      const properties: DiagramNodeDetailClass["properties"] = [];
      const propRegex =
        /^\s*(?:readonly\s+)?(\w+)\??(?!\s*[(<]):\s*([\w<>\[\]\s|,&]+)/gm;
      let pm: RegExpExecArray | null;
      while ((pm = propRegex.exec(body)) !== null) {
        properties.push({
          name: pm[1]!,
          type: sanitizeMermaidClassType(pm[2]!.trim()),
          visibility: "public",
        });
      }

      const detail: DiagramNodeDetailClass = { properties, methods: [], stereotype: "interface" };
      nodes.push({ id: `class_${name}`, label: name, type: "CLASS", detail });
      ifaceMeta.push({ id: `class_${name}`, parents });
    }
  }

  // TypeScript object-type aliases
  for (const [, content] of Object.entries(fileContents)) {
    for (const { name, body } of extractObjectTypeBodies(content)) {
      if (nodes.find((n) => n.id === `class_${name}`)) continue;

      const properties: DiagramNodeDetailClass["properties"] = [];
      const propRegex =
        /^\s*(?:readonly\s+)?(\w+)\??(?!\s*[(<]):\s*([\w<>\[\]\s|,&]+)/gm;
      let pm: RegExpExecArray | null;
      while ((pm = propRegex.exec(body)) !== null) {
        properties.push({
          name: pm[1]!,
          type: sanitizeMermaidClassType(pm[2]!.trim()),
          visibility: "public",
        });
      }

      if (properties.length > 0) {
        const detail: DiagramNodeDetailClass = { properties, methods: [], stereotype: "type" };
        nodes.push({ id: `class_${name}`, label: name, type: "CLASS", detail });
      }
    }
  }

  // ── Relationship classification ───────────────────────────────────────────
  // Map each ordered (owner → target) pair to its strongest UML relationship.
  type Rel = "INHERITS" | "IMPLEMENTS" | "COMPOSES" | "AGGREGATES" | "ASSOCIATES" | "DEPENDS";
  const PRI: Record<Rel, number> = {
    INHERITS: 5, IMPLEMENTS: 5, COMPOSES: 4, AGGREGATES: 3, ASSOCIATES: 2, DEPENDS: 1,
  };
  const labelToId = new Map(nodes.map((n) => [n.label, n.id]));
  const rel = new Map<string, { fromId: string; toId: string; direction: Rel }>();
  const consider = (fromId: string, toId: string | undefined, direction: Rel) => {
    if (!toId || fromId === toId) return;
    // Collapse mutual association/dependency into a single edge.
    if ((direction === "ASSOCIATES" || direction === "DEPENDS") && rel.has(`${toId}->${fromId}`)) return;
    const key = `${fromId}->${toId}`;
    const cur = rel.get(key);
    if (!cur || PRI[direction] > PRI[cur.direction]) rel.set(key, { fromId, toId, direction });
  };
  const known = (token: string, self: string) => {
    const id = labelToId.get(token);
    return id && id !== self ? id : undefined;
  };

  // Generalization (extends) + realization (implements)
  for (const cm of classMeta) {
    if (cm.parent) consider(cm.id, known(cm.parent, cm.id), "INHERITS");
    for (const i of cm.impls) consider(cm.id, known(i, cm.id), "IMPLEMENTS");
  }
  for (const im of ifaceMeta) {
    for (const p of im.parents) consider(im.id, known(p, im.id), "INHERITS");
  }

  // Composition: a field the owner instantiates itself (`= new X()`).
  for (const cm of classMeta) {
    const compRe = /(?:private|protected|public|readonly)\s+(?:readonly\s+)?\w+\s*(?::\s*[\w<>\[\].]+)?\s*=\s*new\s+(\w+)|this\.\w+\s*=\s*new\s+(\w+)/g;
    let m: RegExpExecArray | null;
    while ((m = compRe.exec(cm.body)) !== null) consider(cm.id, known(m[1] ?? m[2]!, cm.id), "COMPOSES");
  }

  // Aggregation: constructor-injected references (parameter-properties).
  for (const cm of classMeta) {
    const ctor = cm.body.match(/constructor\s*\(([\s\S]*?)\)/);
    if (!ctor) continue;
    const paramRe = /(?:private|protected|public|readonly)\s+(?:readonly\s+)?\w+\s*:\s*(\w+)/g;
    let m: RegExpExecArray | null;
    while ((m = paramRe.exec(ctor[1]!)) !== null) consider(cm.id, known(m[1]!, cm.id), "AGGREGATES");
  }

  // Association: a stored field whose type references another known node.
  for (const node of nodes) {
    for (const prop of (node.detail as DiagramNodeDetailClass).properties) {
      for (const token of prop.type.match(/[A-Za-z_]\w*/g) ?? []) {
        consider(node.id, known(token, node.id), "ASSOCIATES");
      }
    }
  }

  // Dependency: a class referenced only through method parameter / return types.
  for (const cm of classMeta) {
    const sigRe = /\b\w+\s*\(([^)]*)\)\s*(?::\s*([\w<>\[\].]+))?/g;
    let m: RegExpExecArray | null;
    while ((m = sigRe.exec(cm.body)) !== null) {
      for (const token of `${m[1]} ${m[2] ?? ""}`.match(/[A-Za-z_]\w*/g) ?? []) {
        consider(cm.id, known(token, cm.id), "DEPENDS");
      }
    }
  }

  const REL_LABEL: Record<Rel, string> = {
    INHERITS: "extends", IMPLEMENTS: "implements", COMPOSES: "composition",
    AGGREGATES: "aggregation", ASSOCIATES: "uses", DEPENDS: "dependency",
  };
  for (const { fromId, toId, direction } of rel.values()) {
    edges.push({ fromId, toId, label: REL_LABEL[direction], direction });
  }

  if (nodes.length === 0) {
    return {
      definition: "",
      nodes: [],
      edges: [],
      warning:
        "No classes, interfaces, or object types were found in the selected files. " +
        "The files fetched may be configuration or markup files rather than " +
        "source code. The previous diagram (if any) has been kept.",
    };
  }

  const lines: string[] = ["classDiagram"];

  const sortedNodes = [...nodes].sort((a, b) => a.label.localeCompare(b.label));

  for (const node of sortedNodes) {
    const detail = node.detail as DiagramNodeDetailClass;
    lines.push(`  class ${node.label} {`);
    if (detail.stereotype) {
      lines.push(`    <<${detail.stereotype}>>`);
    }
    for (const prop of detail.properties.slice(0, 6)) {
      const vis = prop.visibility === "public" ? "+" : prop.visibility === "private" ? "-" : "#";
      lines.push(`    ${vis}${prop.type} ${prop.name}`);
    }
    for (const method of detail.methods.slice(0, 6)) {
      lines.push(`    +${method}()`);
    }
    lines.push("  }");
  }

  const sortedEdges = [...edges].sort((a, b) =>
    `${a.fromId}-${a.toId}`.localeCompare(`${b.fromId}-${b.toId}`),
  );

  const ARROW: Record<string, string> = {
    INHERITS: "--|>", IMPLEMENTS: "..|>", COMPOSES: "*--",
    AGGREGATES: "o--", ASSOCIATES: "-->", DEPENDS: "..>",
  };
  for (const edge of sortedEdges) {
    const from = edge.fromId.replace("class_", "");
    const to = edge.toId.replace("class_", "");
    const arrow = ARROW[edge.direction] ?? "-->";
    lines.push(`  ${from} ${arrow} ${to} : ${edge.label}`);
  }

  return { definition: lines.join("\n"), nodes: sortedNodes, edges: sortedEdges };
}
