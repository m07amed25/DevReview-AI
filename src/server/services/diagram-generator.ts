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
  {
    type: "ERD",
    patterns: [
      // Prisma
      "prisma/schema.prisma",
      "**/*.prisma",
      // SQL DDL
      "**/schema.sql",
      "**/migrations/**/*.sql",
      "**/*.ddl.sql",
      // TypeORM
      "**/*.entity.ts",
      "**/*.entity.js",
      "**/entities/**/*.ts",
      // Sequelize
      "**/models/**/*.js",
      "**/models/**/*.ts",
      "**/*.model.js",
      "**/*.model.ts",
      // Drizzle ORM
      "**/drizzle/schema.ts",
      "**/drizzle/schema/**/*.ts",
      "**/schema/drizzle.ts",
      // Mongoose
      "**/schemas/**/*.ts",
      "**/schemas/**/*.js",
      "**/*.schema.ts",
      "**/*.schema.js",
      // Knex
      "**/migrations/**/*.js",
      "**/migrations/**/*.ts",
      "knexfile.js",
      "knexfile.ts",
    ],
  },
  {
    type: "CLASS",
    patterns: ["**/*.service.ts", "**/*.controller.ts"],
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

// ─── Helper types for all parsers ─────────────────────────────────────────────

interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

interface RelationField {
  name: string;
  targetModel: string;
  isArray: boolean;
  isOptional: boolean;
}

interface ERDResult {
  models: Map<string, TableColumn[]>;
  modelRelations: Map<string, RelationField[]>;
  edges: DiagramEdge[];
}

// ─── Prisma Parser ────────────────────────────────────────────────────────────

function parsePrismaSchema(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  function extractModelBlocks(
    schema: string,
  ): Array<{ name: string; body: string }> {
    const results: Array<{ name: string; body: string }> = [];
    const headerRegex = /model\s+(\w+)\s*\{/g;
    let header: RegExpExecArray | null;
    while ((header = headerRegex.exec(schema)) !== null) {
      const modelName = header[1]!;
      const openBrace = header.index + header[0].length - 1;
      let depth = 1;
      let i = openBrace + 1;
      while (i < schema.length && depth > 0) {
        if (schema[i] === "{") depth++;
        else if (schema[i] === "}") depth--;
        i++;
      }
      const body = schema.slice(openBrace + 1, i - 1);
      results.push({ name: modelName, body });
    }
    return results;
  }

  const modelBlocks = extractModelBlocks(content);

  // Collect all model names first so we can identify relation fields
  const allModelNames = new Set(modelBlocks.map((b) => b.name));

  for (const { name: modelName, body: modelBody } of modelBlocks) {
    const columns: TableColumn[] = [];
    const relations: RelationField[] = [];
    const attributes: string[] = [];

    const lines = modelBody.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//")) continue;

      // Capture @@-level directives as attributes
      if (trimmed.startsWith("@@")) {
        const attrMatch = /^@@(\w+)\s*\((.*)\)$/.exec(trimmed);
        if (attrMatch) attributes.push(`@@${attrMatch[1]}(${attrMatch[2]})`);
        else attributes.push(trimmed);
        continue;
      }

      const fieldMatch = /^(\w+)\s+([\w?[\]]+)/.exec(trimmed);
      if (fieldMatch) {
        const fieldName = fieldMatch[1]!;
        const fieldType = fieldMatch[2]!;
        const baseType = fieldType.replace(/[?[\]]/g, "");
        const isPrimitive =
          /^(String|Int|Float|Boolean|DateTime|Json|BigInt|Decimal|Bytes)/.test(
            fieldType,
          );

        if (!isPrimitive) {
          // Relation field — skip columns but record for the info panel
          if (allModelNames.has(baseType)) {
            relations.push({
              name: fieldName,
              targetModel: baseType,
              isArray: fieldType.includes("[]"),
              isOptional: fieldType.endsWith("?"),
            });
          }
          continue;
        }

        const isPrimaryKey = trimmed.includes("@id");
        const isForeignKey = fieldName.endsWith("Id") && !isPrimaryKey;

        columns.push({
          name: fieldName,
          type: baseType,
          isPrimaryKey,
          isForeignKey,
        });
      }
    }

    models.set(modelName, columns);
    if (relations.length > 0) modelRelations.set(modelName, relations);
  }

  // Extract relations
  const edgeKey = (a: string, b: string) => [a, b].sort().join("__");
  const processedEdgePairs = new Map<
    string,
    { fromId: string; toId: string; fromIsArray: boolean }
  >();

  for (const { name: modelName, body: modelBody } of modelBlocks) {
    const lines = modelBody.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("@@")) continue;

      if (trimmed.includes("@relation")) {
        const fieldMatch = /^(\w+)\s+([\w\[\]?]+)/.exec(trimmed);
        if (fieldMatch) {
          const relType = fieldMatch[2]!;
          const isArray = relType.includes("[]");
          const targetModel = relType.replace(/[\[\]?]/g, "");

          if (models.has(targetModel)) {
            const key = edgeKey(modelName, targetModel);
            if (processedEdgePairs.has(key)) {
              const existing = processedEdgePairs.get(key)!;
              if (isArray && existing.fromIsArray) {
                const existingEdge = edges.find(
                  (e) =>
                    e.fromId === existing.fromId && e.toId === existing.toId,
                );
                if (existingEdge) {
                  existingEdge.direction = "MANY_TO_MANY";
                  existingEdge.label = "many to many";
                }
              }
            } else {
              processedEdgePairs.set(key, {
                fromId: `table_${modelName}`,
                toId: `table_${targetModel}`,
                fromIsArray: isArray,
              });
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
  }

  return { models, modelRelations, edges };
}

// ─── SQL DDL Parser ───────────────────────────────────────────────────────────

function parseSQLDDL(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  // Match CREATE TABLE statements
  const tableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|"|')?(\w+)(?:`|"|')?\s*\(([\s\S]*?)\);/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(content)) !== null) {
    const tableName = tableMatch[1]!;
    const tableBody = tableMatch[2]!;

    const columns: TableColumn[] = [];
    const foreignKeys: Array<{ from: string; to: string; toColumn: string }> =
      [];

    // Split by commas but ignore commas inside parentheses
    const parts = tableBody.split(/,(?![^(]*\))/);

    for (const part of parts) {
      const trimmed = part.trim();

      // Column definition
      const colMatch =
        /^(?:`|"|')?(\w+)(?:`|"|')?\s+([\w()]+)(?:\s+(?:PRIMARY\s+KEY|NOT\s+NULL|NULL|AUTO_INCREMENT|DEFAULT\s+.+?))*$/i.exec(
          trimmed,
        );
      if (colMatch) {
        const colName = colMatch[1]!;
        const colType = colMatch[2]!.replace(/[()0-9]/g, "").toUpperCase();

        const isPrimaryKey =
          /PRIMARY\s+KEY/i.test(trimmed) || /\bid\b/i.test(colName);
        const isForeignKey = colName.toLowerCase().endsWith("_id");

        columns.push({
          name: colName,
          type: colType,
          isPrimaryKey,
          isForeignKey,
        });
      }

      // FOREIGN KEY constraint
      const fkMatch =
        /FOREIGN\s+KEY\s*\((?:`|"|')?(\w+)(?:`|"|')?\)\s*REFERENCES\s+(?:`|"|')?(\w+)(?:`|"|')?\s*\((?:`|"|')?(\w+)(?:`|"|')?\)/i.exec(
          trimmed,
        );
      if (fkMatch) {
        foreignKeys.push({
          from: fkMatch[1]!,
          to: fkMatch[2]!,
          toColumn: fkMatch[3]!,
        });
      }
    }

    models.set(tableName, columns);

    // Create edges for foreign keys
    for (const fk of foreignKeys) {
      edges.push({
        fromId: `table_${tableName}`,
        toId: `table_${fk.to}`,
        label: "references",
        direction: "ONE_TO_MANY",
      });
    }
  }

  return { models, modelRelations, edges };
}

// ─── TypeORM Parser ───────────────────────────────────────────────────────────

function parseTypeORM(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  // Extract @Entity classes
  const entityRegex = /@Entity\s*\([^)]*\)?\s*export\s+class\s+(\w+)/g;
  const entities: string[] = [];
  let entityMatch: RegExpExecArray | null;

  while ((entityMatch = entityRegex.exec(content)) !== null) {
    entities.push(entityMatch[1]!);
  }

  // For each entity, extract columns
  for (const entityName of entities) {
    const columns: TableColumn[] = [];

    // Find class body
    const classRegex = new RegExp(
      `class\\s+${entityName}[^{]*\\{([\\s\\S]*?)\\n\\}`,
      "m",
    );
    const classMatch = classRegex.exec(content);
    if (!classMatch) continue;

    const classBody = classMatch[1]!;

    // Match @Column, @PrimaryGeneratedColumn, etc.
    const columnRegex =
      /@(PrimaryGeneratedColumn|PrimaryColumn|Column|CreateDateColumn|UpdateDateColumn)\s*\([^)]*\)?\s*(\w+)(?:\?)?:\s*([\w<>\[\]]+)/g;
    let colMatch: RegExpExecArray | null;

    while ((colMatch = columnRegex.exec(classBody)) !== null) {
      const decorator = colMatch[1]!;
      const colName = colMatch[2]!;
      let colType = colMatch[3]!;

      // Simplify type
      colType = colType.replace(/[<>\[\]]/g, "");

      const isPrimaryKey =
        decorator === "PrimaryGeneratedColumn" || decorator === "PrimaryColumn";
      const isForeignKey =
        colName.toLowerCase().endsWith("id") && !isPrimaryKey;

      columns.push({
        name: colName,
        type: colType,
        isPrimaryKey,
        isForeignKey,
      });
    }

    // Extract relations
    const relationRegex =
      /@(OneToOne|OneToMany|ManyToOne|ManyToMany)\s*\(\s*\(\)\s*=>\s*(\w+)/g;
    let relMatch: RegExpExecArray | null;

    while ((relMatch = relationRegex.exec(classBody)) !== null) {
      const relationType = relMatch[1]!;
      const targetEntity = relMatch[2]!;

      if (entities.includes(targetEntity)) {
        let direction: DiagramEdge["direction"] = "ASSOCIATES";
        let label = "relates to";

        switch (relationType) {
          case "OneToOne":
            direction = "ONE_TO_ONE";
            label = "one to one";
            break;
          case "OneToMany":
            direction = "ONE_TO_MANY";
            label = "has many";
            break;
          case "ManyToOne":
            direction = "ONE_TO_MANY";
            label = "belongs to";
            break;
          case "ManyToMany":
            direction = "MANY_TO_MANY";
            label = "many to many";
            break;
        }

        edges.push({
          fromId: `table_${entityName}`,
          toId: `table_${targetEntity}`,
          label,
          direction,
        });
      }
    }

    models.set(entityName, columns);
  }

  return { models, modelRelations, edges };
}

function parseSequelize(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  // Match sequelize.define or Model.init
  const defineRegex =
    /(?:sequelize\.define|Model\.init)\s*\(\s*['"`](\w+)['"`]\s*,\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let defineMatch: RegExpExecArray | null;

  while ((defineMatch = defineRegex.exec(content)) !== null) {
    const modelName = defineMatch[1]!;
    const modelBody = defineMatch[2]!;

    const columns: TableColumn[] = [];

    // Match column definitions
    const colRegex =
      /(\w+):\s*\{[^}]*type:\s*DataTypes\.(\w+)(?:[^}]*primaryKey:\s*true)?(?:[^}]*references:\s*\{[^}]*model:\s*['"`](\w+)['"`])?/g;
    let colMatch: RegExpExecArray | null;

    while ((colMatch = colRegex.exec(modelBody)) !== null) {
      const colName = colMatch[1]!;
      const colType = colMatch[2]!;
      const isPrimaryKey = /primaryKey:\s*true/.test(colMatch[0]);
      const referencedModel = colMatch[3];

      const isForeignKey =
        !!referencedModel || (colName.toLowerCase().endsWith("id") && !isPrimaryKey);

      columns.push({
        name: colName,
        type: colType,
        isPrimaryKey,
        isForeignKey,
      });

      // Add edge if there's a reference
      if (referencedModel) {
        edges.push({
          fromId: `table_${modelName}`,
          toId: `table_${referencedModel}`,
          label: "references",
          direction: "ONE_TO_MANY",
        });
      }
    }

    models.set(modelName, columns);
  }

  // Also match hasMany, belongsTo, etc.
  const assocRegex =
    /(\w+)\.(hasMany|belongsTo|hasOne|belongsToMany)\s*\(\s*(\w+)/g;
  let assocMatch: RegExpExecArray | null;

  while ((assocMatch = assocRegex.exec(content)) !== null) {
    const fromModel = assocMatch[1]!;
    const assocType = assocMatch[2]!;
    const toModel = assocMatch[3]!;

    let direction: DiagramEdge["direction"] = "ASSOCIATES";
    let label = "relates to";

    switch (assocType) {
      case "hasMany":
        direction = "ONE_TO_MANY";
        label = "has many";
        break;
      case "hasOne":
        direction = "ONE_TO_ONE";
        label = "has one";
        break;
      case "belongsTo":
        direction = "ONE_TO_MANY";
        label = "belongs to";
        break;
      case "belongsToMany":
        direction = "MANY_TO_MANY";
        label = "many to many";
        break;
    }

    if (models.has(fromModel) && models.has(toModel)) {
      edges.push({
        fromId: `table_${fromModel}`,
        toId: `table_${toModel}`,
        label,
        direction,
      });
    }
  }

  return { models, modelRelations, edges };
}

// ─── Drizzle ORM Parser ───────────────────────────────────────────────────────

function parseDrizzleORM(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  // Match table definitions: export const tableName = pgTable(...) or mysqlTable(...)
  const tableRegex =
    /export\s+const\s+(\w+)\s*=\s*(?:pg|mysql|sqlite)Table\s*\(\s*['"`](\w+)['"`]\s*,\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(content)) !== null) {
    const tableName = tableMatch[2]!;
    const tableBody = tableMatch[3]!;

    const columns: TableColumn[] = [];

    // Match column definitions
    const colRegex = /(\w+):\s*(?:\w+\.)?(\w+)\([^)]*\)(?:\.(primaryKey|notNull|unique|references)\([^)]*\))*/g;
    let colMatch: RegExpExecArray | null;

    while ((colMatch = colRegex.exec(tableBody)) !== null) {
      const colName = colMatch[1]!;
      const colType = colMatch[2]!;
      const modifiers = colMatch[0];

      const isPrimaryKey = /\.primaryKey\(/.test(modifiers);
      const hasReferences = /\.references\(/.test(modifiers);
      const isForeignKey =
        hasReferences || (colName.toLowerCase().endsWith("id") && !isPrimaryKey);

      columns.push({
        name: colName,
        type: colType,
        isPrimaryKey,
        isForeignKey,
      });

      // Extract references
      const refMatch = /\.references\(\s*\(\)\s*=>\s*(\w+)\.(\w+)/. exec(modifiers);
      if (refMatch) {
        const refTable = refMatch[1]!;
        edges.push({
          fromId: `table_${tableName}`,
          toId: `table_${refTable}`,
          label: "references",
          direction: "ONE_TO_MANY",
        });
      }
    }

    models.set(tableName, columns);
  }

  // Match relations
  const relationRegex =
    /export\s+const\s+\w+Relations\s*=\s*relations\s*\(\s*(\w+)\s*,\s*\(\{\s*(\w+)\s*\}\)\s*=>\s*\(\{([^}]+)\}\)/g;
  let relationMatch: RegExpExecArray | null;

  while ((relationMatch = relationRegex.exec(content)) !== null) {
    const fromTable = relationMatch[1]!;
    const relationsBody = relationMatch[3]!;

    // Match relation definitions
    const relRegex = /(\w+):\s*(one|many)\s*\(\s*(\w+)/g;
    let relMatch: RegExpExecArray | null;

    while ((relMatch = relRegex.exec(relationsBody)) !== null) {
      const relType = relMatch[2]!;
      const toTable = relMatch[3]!;

      edges.push({
        fromId: `table_${fromTable}`,
        toId: `table_${toTable}`,
        label: relType === "one" ? "has one" : "has many",
        direction: relType === "one" ? "ONE_TO_ONE" : "ONE_TO_MANY",
      });
    }
  }

  return { models, modelRelations, edges };
}

// ─── Mongoose Parser ──────────────────────────────────────────────────────────

function parseMongoose(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  // Match mongoose.model or new Schema
  const schemaRegex =
    /(?:const|let|var)\s+(\w+)Schema\s*=\s*new\s+(?:mongoose\.)?Schema\s*\(\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let schemaMatch: RegExpExecArray | null;

  const schemaNames = new Map<string, string>();

  while ((schemaMatch = schemaRegex.exec(content)) !== null) {
    const schemaVar = schemaMatch[1]!;
    const schemaBody = schemaMatch[2]!;

    const columns: TableColumn[] = [];

    // Match field definitions
    const fieldRegex =
      /(\w+):\s*\{[^}]*type:\s*(?:mongoose\.Schema\.Types\.)?(\w+)(?:[^}]*ref:\s*['"`](\w+)['"`])?/g;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = fieldRegex.exec(schemaBody)) !== null) {
      const fieldName = fieldMatch[1]!;
      const fieldType = fieldMatch[2]!;
      const refModel = fieldMatch[3];

      const isPrimaryKey = fieldName === "_id" || fieldName === "id";
      const isForeignKey = fieldType === "ObjectId" || !!refModel;

      columns.push({
        name: fieldName,
        type: fieldType,
        isPrimaryKey,
        isForeignKey,
      });

      // Add edge for refs
      if (refModel) {
        edges.push({
          fromId: `table_${schemaVar}`,
          toId: `table_${refModel}Schema`,
          label: "references",
          direction: "ONE_TO_MANY",
        });
      }
    }

    // Also match simple field definitions (field: Type)
    const simpleFieldRegex = /(\w+):\s*(String|Number|Boolean|Date|Buffer|Mixed|ObjectId|Array)/g;
    let simpleMatch: RegExpExecArray | null;

    while ((simpleMatch = simpleFieldRegex.exec(schemaBody)) !== null) {
      const fieldName = simpleMatch[1]!;
      const fieldType = simpleMatch[2]!;

      if (!columns.find((c) => c.name === fieldName)) {
        columns.push({
          name: fieldName,
          type: fieldType,
          isPrimaryKey: fieldName === "_id",
          isForeignKey: fieldType === "ObjectId",
        });
      }
    }

    schemaNames.set(schemaVar, schemaVar);
    models.set(schemaVar, columns);
  }

  // Match mongoose.model definitions
  const modelRegex =
    /mongoose\.model\s*\(\s*['"`](\w+)['"`]\s*,\s*(\w+)Schema\s*\)/g;
  let modelMatch: RegExpExecArray | null;

  while ((modelMatch = modelRegex.exec(content)) !== null) {
    const modelName = modelMatch[1]!;
    const schemaVar = modelMatch[2]!;

    if (models.has(schemaVar)) {
      const columns = models.get(schemaVar)!;
      models.delete(schemaVar);
      models.set(modelName, columns);

      // Update edges
      edges.forEach((edge) => {
        if (edge.fromId === `table_${schemaVar}`) {
          edge.fromId = `table_${modelName}`;
        }
        if (edge.toId === `table_${schemaVar}`) {
          edge.toId = `table_${modelName}`;
        }
      });
    }
  }

  return { models, modelRelations, edges };
}

// ─── Knex Parser ──────────────────────────────────────────────────────────────

function parseKnex(content: string): ERDResult {
  const models = new Map<string, TableColumn[]>();
  const modelRelations = new Map<string, RelationField[]>();
  const edges: DiagramEdge[] = [];

  // Match table.create or createTable
  const tableRegex =
    /(?:knex\.schema\.)?createTable\s*\(\s*['"`](\w+)['"`]\s*,\s*(?:function\s*\(|\()\s*(\w+)\s*\)\s*(?:=>)?\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(content)) !== null) {
    const tableName = tableMatch[1]!;
    const tableVar = tableMatch[2]!;
    const tableBody = tableMatch[3]!;

    const columns: TableColumn[] = [];

    // Match column definitions
    const colRegex = new RegExp(
      `${tableVar}\\.(increments|integer|string|text|boolean|date|datetime|timestamp|json|uuid|binary|float|decimal|bigInteger)\\s*\\(\\s*['"\`]?(\\w+)['"\`]?`,
      "g",
    );
    let colMatch: RegExpExecArray | null;

    while ((colMatch = colRegex.exec(tableBody)) !== null) {
      const colType = colMatch[1]!;
      const colName = colMatch[2]!;

      // Find if there's a .primary() call
      const colDefRegex = new RegExp(
        `${tableVar}\\.${colType}\\s*\\(\\s*['"\`]?${colName}['"\`]?[^;]*`,
        "g",
      );
      const colDef = colDefRegex.exec(tableBody)?.[0] || "";

      const isPrimaryKey =
        /\.primary\(\)/.test(colDef) ||
        colType === "increments" ||
        colName === "id";
      const hasForeignKey = /\.references\(/.test(colDef);
      const isForeignKey =
        hasForeignKey || (colName.toLowerCase().endsWith("_id") && !isPrimaryKey);

      columns.push({
        name: colName,
        type: colType,
        isPrimaryKey,
        isForeignKey,
      });

      // Extract foreign key reference
      const fkMatch =
        /\.references\(\s*['"`](\w+)['"`]\s*\)\.inTable\(\s*['"`](\w+)['"`]\s*\)/.exec(
          colDef,
        );
      if (fkMatch) {
        const refTable = fkMatch[2]!;
        edges.push({
          fromId: `table_${tableName}`,
          toId: `table_${refTable}`,
          label: "references",
          direction: "ONE_TO_MANY",
        });
      }
    }

    models.set(tableName, columns);
  }

  return { models, modelRelations, edges };
}


function generateERD(fileContents: Record<string, string>): {
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  warning?: string;
} {
  const nodes: DiagramNode[] = [];
  const schemaContent = Object.values(fileContents).join("\n");
  const filePaths = Object.keys(fileContents);

  // Detect schema format
  let result: ERDResult | null = null;

  // Check for Prisma
  if (/model\s+\w+\s*\{/.test(schemaContent) || filePaths.some((p) => p.endsWith(".prisma"))) {
    result = parsePrismaSchema(schemaContent);
  }
  // Check for SQL DDL
  else if (/CREATE\s+TABLE/i.test(schemaContent) || filePaths.some((p) => p.endsWith(".sql"))) {
    result = parseSQLDDL(schemaContent);
  }
  // Check for TypeORM
  else if (/@Entity\s*\(/.test(schemaContent) || /@Column\s*\(/.test(schemaContent)) {
    result = parseTypeORM(schemaContent);
  }
  // Check for Drizzle
  else if (/(?:pg|mysql|sqlite)Table\s*\(/.test(schemaContent)) {
    result = parseDrizzleORM(schemaContent);
  }
  // Check for Sequelize
  else if (/sequelize\.define|Model\.init/.test(schemaContent)) {
    result = parseSequelize(schemaContent);
  }
  // Check for Mongoose
  else if (/new\s+(?:mongoose\.)?Schema\s*\(/.test(schemaContent) || /mongoose\.model/.test(schemaContent)) {
    result = parseMongoose(schemaContent);
  }
  // Check for Knex
  else if (/createTable\s*\(/.test(schemaContent) || /knex\.schema/.test(schemaContent)) {
    result = parseKnex(schemaContent);
  }

  if (!result || result.models.size === 0) {
    return {
      definition: "",
      nodes: [],
      edges: [],
      warning:
        "No database schema detected. Supported formats: Prisma, SQL DDL, TypeORM, Sequelize, Drizzle ORM, Mongoose, Knex.js",
    };
  }

  // Convert to nodes
  for (const [modelName, columns] of result.models) {
    const relations = result.modelRelations.get(modelName);
    const detail: DiagramNodeDetailTable = {
      columns,
      ...(relations && relations.length > 0 ? { relations } : {}),
    };
    nodes.push({
      id: `table_${modelName}`,
      label: modelName,
      type: "TABLE",
      detail,
    });
  }

  // Build Mermaid ERD definition
  const lines: string[] = ["erDiagram"];

  for (const [modelName, columns] of result.models) {
    lines.push(`  ${modelName} {`);
    for (const col of columns) {
      const pkMarker = col.isPrimaryKey ? " PK" : col.isForeignKey ? " FK" : "";
      lines.push(`    ${col.type} ${col.name}${pkMarker}`);
    }
    lines.push("  }");
  }

  for (const edge of result.edges) {
    const fromModel = edge.fromId.replace("table_", "");
    const toModel = edge.toId.replace("table_", "");
    const rel =
      edge.direction === "ONE_TO_MANY"
        ? "||--o{"
        : edge.direction === "MANY_TO_MANY"
          ? "}o--o{"
          : "||--||";
    lines.push(`  ${fromModel} ${rel} ${toModel} : "${edge.label}"`);
  }

  return {
    definition: lines.join("\n"),
    nodes,
    edges: result.edges,
  };
}

// ─── Class diagram generator ──────────────────────────────────────────────────

/**
 * Sanitise a TypeScript type string so it is valid inside a Mermaid
 * classDiagram member definition.
 *  • Union types  (string | null)  → keep only the first constituent
 *  • Generic types (Array<T>)       → use Mermaid tilde notation (Array~T~)
 *  • Strips any remaining chars that aren't word chars, brackets, or tildes
 */
function sanitizeMermaidClassType(raw: string): string {
  return (
    raw
      // Keep only the first union member
      .replace(/\s*\|.*/g, "")
      // Convert generics: Map<K, V> → Map~K_V~
      .replace(
        /<([^>]*)>/g,
        (_, inner: string) => `~${inner.replace(/[,\s]+/g, "_")}~`,
      )
      // Remove any remaining chars that would break Mermaid parsing
      .replace(/[^\w[\]~]/g, "")
      .trim() || "any"
  );
}

/**
 * Use brace-balanced extraction to find each class body.
 * Returns an array of { name, parent?, body } entries in source order.
 */
function extractClassBodies(
  content: string,
): Array<{ name: string; parent?: string; body: string }> {
  const results: Array<{ name: string; parent?: string; body: string }> = [];
  // Match class declarations including `implements ...` clauses before the `{`
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
    const body = content.slice(openBrace + 1, i - 1);
    results.push({ name: className, parent: parentClass, body });
  }
  return results;
}

/**
 * Extract TypeScript interface declarations, including optional `extends` parents.
 */
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
      ? extendsStr
          .split(",")
          .map((s) =>
            s
              .trim()
              .replace(/<[^>]*>/g, "")
              .trim(),
          )
          .filter(Boolean)
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

/**
 * Extract TypeScript object-type alias bodies: `type X = { ... }`.
 * Only captures plain object shapes, not union/function types.
 */
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

function generateClassDiagram(fileContents: Record<string, string>): {
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

      // ── Properties ──────────────────────────────────────────────────────────
      // Match lines like:
      //   public  name: string
      //   private readonly _value: number
      //   protected data?: string[]
      //   name: string          (implied public)
      const propRegex =
        /^\s*(public|private|protected)?\s*(?:readonly\s+)?(\w+)\??:\s*([\w<>\[\]\s|,]+)/gm;
      let propMatch: RegExpExecArray | null;
      while ((propMatch = propRegex.exec(body)) !== null) {
        const vis = (propMatch[1] ?? "public") as
          | "public"
          | "private"
          | "protected";
        properties.push({
          name: propMatch[2]!,
          type: sanitizeMermaidClassType(propMatch[3]!.trim()),
          visibility: vis,
        });
      }

      // ── Methods ─────────────────────────────────────────────────────────────
      // Match lines like:
      //   public async doSomething(
      //   private _helper(
      //   async fetchData(
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

  // ── TypeScript interfaces ──────────────────────────────────────────────────
  // Skips any interface that was already captured as a class above.
  for (const [, content] of Object.entries(fileContents)) {
    for (const { name, parents, body } of extractInterfaceBodies(content)) {
      if (nodes.find((n) => n.id === `class_${name}`)) continue;

      const properties: DiagramNodeDetailClass["properties"] = [];
      // Match property lines; exclude method signatures (they have `(` after the name)
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

      const detail: DiagramNodeDetailClass = {
        properties,
        methods: [],
        stereotype: "interface",
      };
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

  // ── TypeScript object-type aliases ─────────────────────────────────────────
  // Only added when they have at least one property (filters out opaque / scalar aliases).
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
        const detail: DiagramNodeDetailClass = {
          properties,
          methods: [],
          stereotype: "type",
        };
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

  // Build Mermaid class diagram definition
  const lines: string[] = ["classDiagram"];

  for (const node of nodes) {
    const detail = node.detail as DiagramNodeDetailClass;
    lines.push(`  class ${node.label} {`);
    if (detail.stereotype) {
      lines.push(`    <<${detail.stereotype}>>`);
    }
    for (const prop of detail.properties.slice(0, 6)) {
      const vis =
        prop.visibility === "public"
          ? "+"
          : prop.visibility === "private"
            ? "-"
            : "#";
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
  warning?: string;
} {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // ── Helper: humanise camelCase / kebab-case / snake_case identifiers ─────────
  const toLabel = (name: string) =>
    name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

  // ── Step 1: Detect which actors appear in the provided files ─────────────────
  // Start with the primary actor; others are added when evidence is found.
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

  // ── Step 2: Extract use cases from each file ──────────────────────────────────

  type GroupInfo = { label: string; ucIds: string[]; actorIds: Set<string> };
  const groups = new Map<string, GroupInfo>();

  // Helper: resolve the primary actor for a given file
  const resolveActor = (filePath: string, content: string): string => {
    if (/webhook/i.test(filePath)) return "actor_GitHub";
    if (/inngest/i.test(filePath) || content.includes("inngest.createFunction"))
      return "actor_Inngest";
    if (/[/\\]admin[/\\.]/.test(filePath)) return "actor_Admin";
    return "actor_User";
  };

  for (const [filePath, content] of Object.entries(fileContents)) {
    const fileName =
      filePath
        .split(/[/\\]/)
        .pop()
        ?.replace(/\.(ts|tsx|js|jsx)$/, "") ?? "unknown";
    const groupId = `grp_${fileName.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const groupLabel = toLabel(fileName);

    if (!groups.has(groupId)) {
      groups.set(groupId, {
        label: groupLabel,
        ucIds: [],
        actorIds: new Set(),
      });
    }
    const group = groups.get(groupId)!;

    const defaultActor = resolveActor(filePath, content);

    // ── 2a. HTTP route handlers (Next.js route.ts files) ───────────────────────
    const routeRegex =
      /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD)\s*\(/g;
    let routeMatch: RegExpExecArray | null;
    while ((routeMatch = routeRegex.exec(content)) !== null) {
      const method = routeMatch[1]!;
      const pathSeg = filePath
        .replace(/.*\/app\/api\//, "")
        .replace(/\/route\.(ts|js)$/, "");
      const ucId = `uc_${method}_${pathSeg.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const label = `${method} /${pathSeg}`;

      if (!nodes.find((n) => n.id === ucId)) {
        nodes.push({
          id: ucId,
          label,
          type: "USE_CASE",
          detail: {
            description: `HTTP ${method} handler`,
            interactions: [defaultActor.replace("actor_", "")],
          } as DiagramNodeDetailUseCase,
        });
        group.ucIds.push(ucId);
        group.actorIds.add(defaultActor);
        edges.push({
          fromId: defaultActor,
          toId: ucId,
          label: "calls",
          direction: "ASSOCIATES",
        });
      }
    }

    // ── 2b. tRPC procedures (router files) ─────────────────────────────────────
    // Matches:  procedureName: publicProcedure. / protectedProcedure. / adminProcedure.
    const procRegex =
      /(\w+):\s*(publicProcedure|protectedProcedure|adminProcedure)\b/g;
    let procMatch: RegExpExecArray | null;
    while ((procMatch = procRegex.exec(content)) !== null) {
      const procName = procMatch[1]!;
      const procType = procMatch[2]!;

      // Skip common non-procedure identifiers
      if (
        ["default", "createTRPCRouter", "router", "procedure"].includes(
          procName,
        )
      )
        continue;

      const ucId = `uc_trpc_${groupId}_${procName}`;
      const label = toLabel(procName);
      const actor =
        procType === "adminProcedure" ? "actor_Admin" : "actor_User";

      if (!nodes.find((n) => n.id === ucId)) {
        nodes.push({
          id: ucId,
          label,
          type: "USE_CASE",
          detail: {
            description: `tRPC ${procType.replace("Procedure", "")} – ${label}`,
            interactions: [actor.replace("actor_", "")],
          } as DiagramNodeDetailUseCase,
        });
        group.ucIds.push(ucId);
        group.actorIds.add(actor);
        edges.push({
          fromId: actor,
          toId: ucId,
          label: "uses",
          direction: "ASSOCIATES",
        });
      }
    }

    // ── 2c. Inngest background functions ───────────────────────────────────────
    if (
      /inngest/i.test(filePath) ||
      content.includes("inngest.createFunction")
    ) {
      const fnIdRegex = /\bid:\s*["']([^"']+)["']/g;
      let fnIdMatch: RegExpExecArray | null;
      while ((fnIdMatch = fnIdRegex.exec(content)) !== null) {
        const fnId = fnIdMatch[1]!;
        const ucId = `uc_inngest_${fnId.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const label = toLabel(fnId);

        if (!nodes.find((n) => n.id === ucId)) {
          nodes.push({
            id: ucId,
            label,
            type: "USE_CASE",
            detail: {
              description: `Background job: ${fnId}`,
              interactions: ["Inngest"],
            } as DiagramNodeDetailUseCase,
          });
          group.ucIds.push(ucId);
          group.actorIds.add("actor_Inngest");
          edges.push({
            fromId: "actor_Inngest",
            toId: ucId,
            label: "runs",
            direction: "ASSOCIATES",
          });
        }
      }
    }

    // ── 2d. Express / Fastify / Koa / Hono routes ──────────────────────────────
    // Matches: router.get('/path', ...) / app.post('/path', ...) / server.put(...)
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
          id: ucId,
          label,
          type: "USE_CASE",
          detail: {
            description: `${method} ${routePath}`,
            interactions: [defaultActor.replace("actor_", "")],
          } as DiagramNodeDetailUseCase,
        });
        group.ucIds.push(ucId);
        group.actorIds.add(defaultActor);
        edges.push({
          fromId: defaultActor,
          toId: ucId,
          label: "calls",
          direction: "ASSOCIATES",
        });
      }
    }

    // ── 2e. NestJS / Spring-style decorators ───────────────────────────────────
    // Matches: @Get('/path') / @Post('/users') followed by method name
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
          id: ucId,
          label,
          type: "USE_CASE",
          detail: {
            description: `${method} ${routePath || "/"}`,
            interactions: [defaultActor.replace("actor_", "")],
          } as DiagramNodeDetailUseCase,
        });
        group.ucIds.push(ucId);
        group.actorIds.add(defaultActor);
        edges.push({
          fromId: defaultActor,
          toId: ucId,
          label: "calls",
          direction: "ASSOCIATES",
        });
      }
    }

    // ── 2f. FastAPI / Flask / Django style decorators ──────────────────────────
    // Matches: @app.route('/path', methods=['GET']) / @app.get('/path')
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
          id: ucId,
          label,
          type: "USE_CASE",
          detail: {
            description: `Route: ${routePath}`,
            interactions: [defaultActor.replace("actor_", "")],
          } as DiagramNodeDetailUseCase,
        });
        group.ucIds.push(ucId);
        group.actorIds.add(defaultActor);
        edges.push({
          fromId: defaultActor,
          toId: ucId,
          label: "calls",
          direction: "ASSOCIATES",
        });
      }
    }

    // ── 2g. Generic fallback: exported named functions ─────────────────────────
    // Only run when no framework-specific pattern matched for this file, and
    // the file looks like it could contain handlers (route/controller/api/handler in filename).
    if (
      group.ucIds.length === 0 &&
      /route|controller|handler|service|endpoint|action|resolver/i.test(
        fileName,
      )
    ) {
      const namedFnRegex =
        /export\s+(?:async\s+)?function\s+(\w+)\s*\(|export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(/g;
      const skipNames = new Set([
        "default",
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "HEAD",
        "OPTIONS",
      ]);
      let fnMatch: RegExpExecArray | null;
      while ((fnMatch = namedFnRegex.exec(content)) !== null) {
        const fnName = (fnMatch[1] ?? fnMatch[2])!;
        if (skipNames.has(fnName)) continue;
        // Skip ALL_CAPS constants
        if (/^[A-Z_0-9]+$/.test(fnName)) continue;

        const ucId = `uc_fn_${groupId}_${fnName}`;
        const label = toLabel(fnName);

        if (!nodes.find((n) => n.id === ucId)) {
          nodes.push({
            id: ucId,
            label,
            type: "USE_CASE",
            detail: {
              description: `Function: ${fnName}`,
              interactions: [defaultActor.replace("actor_", "")],
            } as DiagramNodeDetailUseCase,
          });
          group.ucIds.push(ucId);
          group.actorIds.add(defaultActor);
          edges.push({
            fromId: defaultActor,
            toId: ucId,
            label: "triggers",
            direction: "ASSOCIATES",
          });
        }
      }
    }
  }

  // Discard groups with no use cases
  for (const [id, g] of groups) {
    if (g.ucIds.length === 0) groups.delete(id);
  }

  // ── Fallback: if nothing was extracted, create a minimal skeleton ─────────────
  if (nodes.filter((n) => n.type === "USE_CASE").length === 0) {
    const skeletonId = "uc_system_boundary";
    nodes.push({
      id: skeletonId,
      label: "System (no route patterns detected)",
      type: "USE_CASE",
      detail: {
        description:
          "No recognisable route or procedure patterns found in the provided files.",
        interactions: ["User"],
      } as DiagramNodeDetailUseCase,
    });
    edges.push({
      fromId: "actor_User",
      toId: skeletonId,
      label: "interacts",
      direction: "ASSOCIATES",
    });
    const fallbackGroupId = "grp_system";
    groups.set(fallbackGroupId, {
      label: "System",
      ucIds: [skeletonId],
      actorIds: new Set(["actor_User"]),
    });
  }

  // ── Step 3: Build Mermaid flowchart ──────────────────────────────────────────
  const lines: string[] = ["flowchart LR"];

  // Actors (top-level circles)
  for (const actorName of actorSet) {
    lines.push(`  actor_${actorName}(("${actorName}"))`);
  }

  // One subgraph per file/router group
  for (const [groupId, group] of groups) {
    lines.push(`  subgraph ${groupId}["${group.label}"]`);
    for (const ucId of group.ucIds) {
      const node = nodes.find((n) => n.id === ucId);
      if (!node) continue;
      lines.push(`    ${ucId}(["${node.label}"])`);
    }
    lines.push("  end");
  }

  // Edges: actor ──► use case
  for (const edge of edges) {
    const arrow = edge.label === "runs" ? "-..->" : "-->";
    lines.push(`  ${edge.fromId} ${arrow} ${edge.toId}`);
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
): {
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  warning?: string;
} {
  switch (type) {
    case "ERD":
      return generateERD(fileContents);
    case "CLASS":
      return generateClassDiagram(fileContents);
    case "USE_CASE":
      return generateUseCaseDiagram(fileContents);
  }
}
