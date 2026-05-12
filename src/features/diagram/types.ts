export type DiagramType = "ERD" | "CLASS" | "USE_CASE" | "SEQUENCE";

export type DiagramStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface DiagramNodeDetailTable {
  columns: Array<{
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
  }>;
  /** Relation / association fields (not shown as columns in the ERD but shown in the detail panel) */
  relations?: Array<{
    name: string;
    targetModel: string;
    isArray: boolean;
    isOptional: boolean;
  }>;
  /** Optional extra metadata (indexes, uniques, etc.) */
  attributes?: string[];
}

export interface DiagramNodeDetailClass {
  properties: Array<{
    name: string;
    type: string;
    visibility: "public" | "private" | "protected";
  }>;
  methods: string[];
  /** UML stereotype shown in the Mermaid diagram header */
  stereotype?: "interface" | "type";
}

export interface DiagramNodeDetailUseCase {
  description: string;
  interactions: string[];
}

export type DiagramNodeDetail =
  | DiagramNodeDetailTable
  | DiagramNodeDetailClass
  | DiagramNodeDetailUseCase;

export interface DiagramNode {
  id: string;
  label: string;
  type: "TABLE" | "CLASS" | "ACTOR" | "USE_CASE";
  detail: DiagramNodeDetail;
}

export interface DiagramEdge {
  fromId: string;
  toId: string;
  label: string;
  direction:
    | "ONE_TO_ONE"
    | "ONE_TO_MANY"
    | "MANY_TO_MANY"
    | "INHERITS"
    | "ASSOCIATES";
}

export interface DiagramTriggerRule {
  type: DiagramType;
  patterns: string[];
}
