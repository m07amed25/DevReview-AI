import { minimatch } from "minimatch";
import type {
  DiagramType,
  DiagramNode,
  DiagramEdge,
  DiagramTriggerRule,
  DiagramNodeDetailTable,
  DiagramNodeDetailClass,
  DiagramNodeDetailUseCase,
} from "@/features/diagram/types";

export const DIAGRAM_TRIGGER_RULES: DiagramTriggerRule[] = [
  { type: "ERD", patterns: ["prisma/schema.prisma", "**/*.prisma"] },
  {
    type: "CLASS",
    patterns: ["**/*.service.ts", "**/*.model.ts", "**/*.entity.ts"],
  },
  {
    type: "USE_CASE",
    patterns: ["src/app/api/**/*.ts", "**/*.controller.ts", "**/*.router.ts"],
  },
];

export function matchTriggerRules(changedFiles: string[]): DiagramType[] {
  const matched = new Set<DiagramType>();

  for (const rule of DIAGRAM_TRIGGER_RULES) {
    for (const file of changedFiles) {
      if (rule.patterns.some((pattern) => minimatch(file, pattern))) {
        matched.add(rule.type);
        break;
      }
    }
  }

  return Array.from(matched);
}

// ─── ERD generator ────────────────────────────────────────────────────────────

function generateERD(fileContents: Record<string, string>): {
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
} {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  const schemaContent = Object.values(fileContents).join("\n");

  // Extract model blocks
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let modelMatch: RegExpExecArray | null;

  const models = new Map<
    string,
    Array<{
      name: string;
      type: string;
      isPrimaryKey: boolean;
      isForeignKey: boolean;
    }>
  >();

  while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
    const modelName = modelMatch[1]!;
    const modelBody = modelMatch[2]!;
    const columns: Array<{
      name: string;
      type: string;
      isPrimaryKey: boolean;
      isForeignKey: boolean;
    }> = [];

    const lines = modelBody.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("@@") || trimmed.startsWith("//")) {
        continue;
      }
      const fieldMatch = /^(\w+)\s+([\w?[\]]+)/.exec(trimmed);
      if (fieldMatch) {
        const fieldName = fieldMatch[1]!;
        const fieldType = fieldMatch[2]!;
        // Skip relation fields (those with a lowercase first letter that are model references)
        const isPrimitive =
          /^(String|Int|Float|Boolean|DateTime|Json|BigInt|Decimal|Bytes)/.test(
            fieldType,
          );
        if (!isPrimitive) continue;

        const isPrimaryKey = trimmed.includes("@id");
        const isForeignKey = fieldName.endsWith("Id") && !isPrimaryKey;

        columns.push({
          name: fieldName,
          type: fieldType.replace("?", ""),
          isPrimaryKey,
          isForeignKey,
        });
      }
    }

    models.set(modelName, columns);
    const detail: DiagramNodeDetailTable = { columns };
    nodes.push({
      id: `table_${modelName}`,
      label: modelName,
      type: "TABLE",
      detail,
    });
  }

  // Extract relations for edges
  const relationRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let relationMatch: RegExpExecArray | null;
  while ((relationMatch = relationRegex.exec(schemaContent)) !== null) {
    const modelName = relationMatch[1]!;
    const modelBody = relationMatch[2]!;

    const lines = modelBody.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("@@")) continue;

      // Look for @relation fields
      if (trimmed.includes("@relation")) {
        const fieldMatch = /^(\w+)\s+([\w\[\]?]+)/.exec(trimmed);
        if (fieldMatch) {
          const relType = fieldMatch[2]!;
          const isArray = relType.includes("[]");
          const targetModel = relType.replace("[]", "").replace("?", "");

          if (models.has(targetModel)) {
            edges.push({
              fromId: `table_${modelName}`,
              toId: `table_${targetModel}`,
              label: isArray ? "has many" : "has one",
              direction: isArray ? "ONE_TO_MANY" : "ONE_TO_ONE",
            });
          }
        }
      }
    }
  }

  // Build Mermaid ERD definition
  const lines: string[] = ["erDiagram"];

  for (const [modelName, columns] of models) {
    lines.push(`  ${modelName} {`);
    for (const col of columns) {
      const pkMarker = col.isPrimaryKey ? " PK" : col.isForeignKey ? " FK" : "";
      lines.push(`    ${col.type} ${col.name}${pkMarker}`);
    }
    lines.push("  }");
  }

  for (const edge of edges) {
    const fromModel = edge.fromId.replace("table_", "");
    const toModel = edge.toId.replace("table_", "");
    const rel = edge.direction === "ONE_TO_MANY" ? "||--o{" : "||--||";
    lines.push(`  ${fromModel} ${rel} ${toModel} : "${edge.label}"`);
  }

  return {
    definition: lines.join("\n"),
    nodes,
    edges,
  };
}

// ─── Class diagram generator ──────────────────────────────────────────────────

function generateClassDiagram(fileContents: Record<string, string>): {
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
} {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  for (const [, content] of Object.entries(fileContents)) {
    // Extract class definitions
    const classRegex =
      /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    let classMatch: RegExpExecArray | null;

    while ((classMatch = classRegex.exec(content)) !== null) {
      const className = classMatch[1]!;
      const parentClass = classMatch[2];

      const properties: Array<{
        name: string;
        type: string;
        visibility: "public" | "private" | "protected";
      }> = [];
      const methods: string[] = [];

      // Extract properties
      const propRegex =
        /(?:(?:public|private|protected|readonly)\s+)+(\w+)(?:\?)?:\s*([\w<>[\]|,\s]+)/g;
      let propMatch: RegExpExecArray | null;
      while ((propMatch = propRegex.exec(content)) !== null) {
        const visibility = content
          .slice(0, propMatch.index)
          .match(/\b(public|private|protected)\b\s*$/)?.[1] as
          | "public"
          | "private"
          | "protected"
          | undefined;
        properties.push({
          name: propMatch[1]!,
          type: propMatch[2]!.trim(),
          visibility: visibility ?? "public",
        });
      }

      // Extract method signatures
      const methodRegex =
        /(?:(?:public|private|protected|async)\s+)+(\w+)\s*\([^)]*\)/g;
      let methodMatch: RegExpExecArray | null;
      while ((methodMatch = methodRegex.exec(content)) !== null) {
        if (
          methodMatch[1] !== "constructor" &&
          !methods.includes(methodMatch[1]!)
        ) {
          methods.push(methodMatch[1]!);
        }
      }

      const detail: DiagramNodeDetailClass = { properties, methods };
      nodes.push({
        id: `class_${className}`,
        label: className,
        type: "CLASS",
        detail,
      });

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

  if (nodes.length === 0) {
    throw new Error("No classes found in the provided files");
  }

  // Build Mermaid class diagram definition
  const lines: string[] = ["classDiagram"];

  for (const node of nodes) {
    const detail = node.detail as DiagramNodeDetailClass;
    lines.push(`  class ${node.label} {`);
    for (const prop of detail.properties.slice(0, 5)) {
      const vis =
        prop.visibility === "public"
          ? "+"
          : prop.visibility === "private"
            ? "-"
            : "#";
      lines.push(`    ${vis}${prop.type} ${prop.name}`);
    }
    for (const method of detail.methods.slice(0, 5)) {
      lines.push(`    +${method}()`);
    }
    lines.push("  }");
  }

  for (const edge of edges) {
    const from = edge.fromId.replace("class_", "");
    const to = edge.toId.replace("class_", "");
    lines.push(`  ${from} --|> ${to} : ${edge.label}`);
  }

  return {
    definition: lines.join("\n"),
    nodes,
    edges,
  };
}

// ─── Use-case diagram generator ───────────────────────────────────────────────

function generateUseCaseDiagram(fileContents: Record<string, string>): {
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
} {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // Add an actor
  const actorDetail: DiagramNodeDetailUseCase = {
    description: "User interacting with the API",
    interactions: [],
  };
  nodes.push({
    id: "actor_User",
    label: "User",
    type: "ACTOR",
    detail: actorDetail,
  });

  for (const [filePath, content] of Object.entries(fileContents)) {
    // Extract route handlers / exported function names
    const routeRegex =
      /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD)\s*\(/g;
    const namedExportRegex =
      /export\s+(?:const|async function|function)\s+(\w+)\s*[=(]/g;

    let routeMatch: RegExpExecArray | null;
    while ((routeMatch = routeRegex.exec(content)) !== null) {
      const method = routeMatch[1]!;
      const pathSegment = filePath
        .replace(/.*\/app\/api\//, "")
        .replace(/\/route\.(ts|js)$/, "");
      const useCaseId = `usecase_${method}_${pathSegment.replace(/\//g, "_")}`;
      const label = `${method} /${pathSegment}`;

      const detail: DiagramNodeDetailUseCase = {
        description: `HTTP ${method} handler`,
        interactions: ["User"],
      };
      (actorDetail.interactions as string[]).push(label);

      nodes.push({ id: useCaseId, label, type: "USE_CASE", detail });
      edges.push({
        fromId: "actor_User",
        toId: useCaseId,
        label: "calls",
        direction: "ASSOCIATES",
      });
    }

    if (!routeRegex.exec(content)) {
      // Fallback: look for named exports from router/controller files
      let namedMatch: RegExpExecArray | null;
      while ((namedMatch = namedExportRegex.exec(content)) !== null) {
        const fnName = namedMatch[1]!;
        if (
          ["default", "GET", "POST", "PUT", "PATCH", "DELETE"].includes(fnName)
        )
          continue;
        const useCaseId = `usecase_${fnName}`;
        const detail: DiagramNodeDetailUseCase = {
          description: `Handler: ${fnName}`,
          interactions: ["User"],
        };
        nodes.push({ id: useCaseId, label: fnName, type: "USE_CASE", detail });
        edges.push({
          fromId: "actor_User",
          toId: useCaseId,
          label: "triggers",
          direction: "ASSOCIATES",
        });
      }
    }
  }

  if (nodes.length <= 1) {
    throw new Error("No use-case endpoints found in the provided files");
  }

  // Build Mermaid flowchart for use-case approximation
  const lines: string[] = ["flowchart LR", "  User((User))"];

  for (const node of nodes) {
    if (node.type === "USE_CASE") {
      const safeId = node.id.replace(/[^a-zA-Z0-9_]/g, "_");
      lines.push(`  ${safeId}["${node.label}"]`);
    }
  }

  for (const edge of edges) {
    const fromId =
      edge.fromId === "actor_User"
        ? "User"
        : edge.fromId.replace(/[^a-zA-Z0-9_]/g, "_");
    const toId = edge.toId.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`  ${fromId} --> ${toId}`);
  }

  return {
    definition: lines.join("\n"),
    nodes,
    edges,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a Mermaid diagram definition from the given file contents.
 * Throws on unrecoverable parse failure so the Inngest `onFailure` handler
 * captures a structured error message.
 */
export function generateMermaidDefinition(
  type: DiagramType,
  fileContents: Record<string, string>,
): { definition: string; nodes: DiagramNode[]; edges: DiagramEdge[] } {
  switch (type) {
    case "ERD":
      return generateERD(fileContents);
    case "CLASS":
      return generateClassDiagram(fileContents);
    case "USE_CASE":
      return generateUseCaseDiagram(fileContents);
  }
}
