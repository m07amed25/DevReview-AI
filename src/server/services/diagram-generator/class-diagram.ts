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
): Array<{ name: string; parent?: string; body: string }> {
  const results: Array<{ name: string; parent?: string; body: string }> = [];
  const headerRegex =
    /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?[^{]*\{/g;
  let header: RegExpExecArray | null;
  while ((header = headerRegex.exec(content)) !== null) {
    const className = header[1]!;
    const parentClass = header[2];
    const openBrace = header.index + header[0].length - 1;
    let depth = 1;
    let i = openBrace + 1;
    while (i < content.length && depth > 0) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") depth--;
      i++;
    }
    results.push({ name: className, parent: parentClass, body: content.slice(openBrace + 1, i - 1) });
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

  for (const [, content] of Object.entries(fileContents)) {
    const classBodies = extractClassBodies(content);

    for (const { name: className, parent: parentClass, body } of classBodies) {
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

      if (parentClass) {
        edges.push({
          fromId: `class_${className}`,
          toId: `class_${parentClass}`,
          label: "extends",
          direction: "INHERITS",
        });
      }
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

      for (const parent of parents) {
        edges.push({
          fromId: `class_${name}`,
          toId: `class_${parent}`,
          label: "extends",
          direction: "INHERITS",
        });
      }
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

  for (const node of nodes) {
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

  for (const edge of edges) {
    const from = edge.fromId.replace("class_", "");
    const to = edge.toId.replace("class_", "");
    lines.push(`  ${from} --|> ${to} : ${edge.label}`);
  }

  return { definition: lines.join("\n"), nodes, edges };
}
