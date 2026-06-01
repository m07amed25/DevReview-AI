import type { DiagramNode, DiagramEdge, DiagramNodeDetailUseCase } from "@/features/diagram/types";

// ─── Utilities ─────────────────────────────────────────────────────────────

const toLabel = (name: string): string =>
  name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_/:.]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/** Produce a URL/ID-safe lowercase identifier from any string. */
const safeId = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

/** HTTP method → readable action verb. */
const HTTP_VERB: Record<string, string> = {
  GET: "View",
  POST: "Create",
  PUT: "Update",
  PATCH: "Update",
  DELETE: "Delete",
  HEAD: "Check",
  OPTIONS: "Inspect",
  ALL: "Manage",
};

/** Infer the feature/domain module from a file path. */
function inferDomain(filePath: string): string {
  const p = filePath.replace(/\\/g, "/");

  // /features/X/ or /feature/X/
  const feat = /\/features?\/([^/]+)/i.exec(p);
  if (feat) return toLabel(feat[1]!);

  // tRPC router: /routers/X.ts
  const router = /\/routers?\/([^/]+?)\.(ts|js)$/i.exec(p);
  if (router && !["index", "root", "_app", "trpc"].includes(router[1]!))
    return toLabel(router[1]!);

  // Inngest function: /inngest/functions/X.ts
  const inn = /\/inngest\/(?:functions?\/)?([^/]+?)\.(ts|js)$/i.exec(p);
  if (inn && !["client", "index", "middleware"].includes(inn[1]!))
    return toLabel(inn[1]!);

  // /app/api/X/
  const api = /\/app\/api\/([^/]+)/i.exec(p);
  if (api && api[1] !== "trpc") return toLabel(api[1]!);

  // Controller / handler file
  const ctrl = /\/(?:controllers?|handlers?|resolvers?)\/([^/]+?)\.(ts|js)$/i.exec(p);
  if (ctrl) return toLabel(ctrl[1]!);

  // Next.js app directory: /app/(group)/X/route.ts or page.tsx
  const appDir = /\/app\/(?:\([^)]+\)\/)*([^/(]+)\/(?:route|page)\.(tsx?|jsx?)$/i.exec(p);
  if (appDir) return toLabel(appDir[1]!);

  // /app/(group)/X/ — any segment before a page/route
  const appSeg = /\/app\/(?:\([^)]+\)\/)*([^/(]+)\//i.exec(p);
  if (appSeg && appSeg[1] !== "api") return toLabel(appSeg[1]!);

  // Fallback: file name without extension
  const file = p.split("/").pop()?.replace(/\.(ts|tsx|js|jsx)$/, "") ?? "System";
  return toLabel(file);
}

// ─── Actor registry ────────────────────────────────────────────────────────

interface ActorDef {
  id: string;
  label: string;
  description: string;
}

const ACTOR_DEFS: ActorDef[] = [
  { id: "actor_User",      label: "User",      description: "Authenticated user of the application" },
  { id: "actor_Admin",     label: "Admin",     description: "Administrator with elevated system privileges" },
  { id: "actor_Guest",     label: "Guest",     description: "Unauthenticated visitor or public API consumer" },
  { id: "actor_GitHub",    label: "GitHub",    description: "GitHub platform — sends webhook events" },
  { id: "actor_Stripe",    label: "Stripe",    description: "Stripe — sends payment lifecycle webhook events" },
  { id: "actor_Inngest",   label: "Inngest",   description: "Background job runner — event-driven & fan-out tasks" },
  { id: "actor_Scheduler", label: "Scheduler", description: "Cron / scheduled task runner" },
];

function detectActiveActors(fileContents: Record<string, string>): Set<string> {
  const active = new Set<string>(["actor_User"]);

  for (const [path, content] of Object.entries(fileContents)) {
    const p = path.replace(/\\/g, "/");

    if (
      /\/admin[/.]/.test(p) ||
      content.includes("adminProcedure") ||
      content.includes("isAdmin") ||
      /@Role\(["']admin/.test(content)
    )
      active.add("actor_Admin");

    if (
      /webhook.*github|github.*webhook/i.test(p) ||
      content.includes("x-github-event") ||
      content.includes("X-GitHub-Event") ||
      content.includes("X-Hub-Signature")
    )
      active.add("actor_GitHub");

    if (
      /\/stripe[./]/.test(p) ||
      content.includes("stripe-signature") ||
      content.includes("Stripe-Signature") ||
      content.includes("constructEvent") ||
      content.includes("stripe.webhooks")
    )
      active.add("actor_Stripe");

    if (
      /inngest/i.test(p) ||
      content.includes("inngest.createFunction") ||
      content.includes("createFunction(")
    )
      active.add("actor_Inngest");

    if (
      /\/cron[./]|\/schedule[./]/.test(p) ||
      content.includes("cron.schedule") ||
      content.includes("node-cron") ||
      /@Cron\(/.test(content)
    )
      active.add("actor_Scheduler");

    if (
      content.includes("publicProcedure") ||
      /\/public\/|\/\(public\)\//.test(p) ||
      /unauthenticated|no.?auth/i.test(content)
    )
      active.add("actor_Guest");
  }

  return active;
}

// ─── Core generator ────────────────────────────────────────────────────────

export function generateUseCaseDiagram(fileContents: Record<string, string>): {
  definition: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  warning?: string;
} {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // 1. Detect actors ──────────────────────────────────────────────────────────
  const activeActors = detectActiveActors(fileContents);

  for (const actor of ACTOR_DEFS) {
    if (activeActors.has(actor.id)) {
      nodes.push({
        id: actor.id,
        label: actor.label,
        type: "ACTOR",
        detail: { description: actor.description, interactions: [] } as DiagramNodeDetailUseCase,
      });
    }
  }

  // 2. Collect use cases ──────────────────────────────────────────────────────
  interface UC {
    id: string;
    label: string;
    description: string;
    actorId: string;
    domain: string;
    requiresAuth: boolean;
    requiresAdmin: boolean;
    isBackground: boolean;
  }

  const ucList: UC[] = [];
  const usedIds = new Set<string>(ACTOR_DEFS.map((a) => a.id));
  /** Normalised label → UC for semantic deduplication. */
  const ucByLabel = new Map<string, UC>();

  const addUC = (
    label: string,
    description: string,
    actorId: string,
    domain: string,
    opts: { requiresAuth?: boolean; requiresAdmin?: boolean; isBackground?: boolean } = {},
  ): UC | null => {
    if (!label.trim()) return null;
    const key = label.toLowerCase().replace(/\s+/g, "");
    if (ucByLabel.has(key)) return ucByLabel.get(key)!;

    let baseId = `uc_${safeId(label)}`;
    if (baseId.length > 60) baseId = baseId.slice(0, 60).replace(/_$/, "");
    let id = baseId;
    let n = 1;
    while (usedIds.has(id)) id = `${baseId}_${n++}`;
    usedIds.add(id);

    const resolvedActor = activeActors.has(actorId) ? actorId : "actor_User";
    const uc: UC = {
      id,
      label,
      description,
      actorId: resolvedActor,
      domain,
      requiresAuth: opts.requiresAuth ?? false,
      requiresAdmin: opts.requiresAdmin ?? false,
      isBackground: opts.isBackground ?? false,
    };
    ucList.push(uc);
    ucByLabel.set(key, uc);
    return uc;
  };

  // 3. Parse each file ────────────────────────────────────────────────────────
  for (const [filePath, content] of Object.entries(fileContents)) {
    const p = filePath.replace(/\\/g, "/");
    const domain = inferDomain(p);

    const isAdminFile = /\/admin[/.]/.test(p) || content.includes("adminProcedure");
    const isPublicAuthPage = /\/\(auth\)\/|\/auth\/|\/login|\/signup|\/register/i.test(p);
    const isWebhookGH =
      /webhook.*github|github.*webhook/i.test(p) ||
      content.includes("X-GitHub-Event") ||
      content.includes("X-Hub-Signature");
    const isWebhookStripe =
      /\/stripe[./]/.test(p) ||
      content.includes("Stripe-Signature") ||
      content.includes("constructEvent");
    const isInngest = /inngest/i.test(p) || content.includes("inngest.createFunction");
    const isCron = /\/cron[./]|\/schedule[./]/.test(p);
    const isServerAction =
      content.includes('"use server"') || content.includes("'use server'");

    const defaultActor = isAdminFile
      ? "actor_Admin"
      : isWebhookStripe
        ? "actor_Stripe"
        : isWebhookGH
          ? "actor_GitHub"
          : isInngest
            ? "actor_Inngest"
            : isCron
              ? "actor_Scheduler"
              : isPublicAuthPage
                ? "actor_Guest"
                : "actor_User";

    // ── a) Next.js App Router HTTP handlers (route.ts / route.js) ─────────────
    if (/\/route\.(ts|js)$/.test(p)) {
      const handlerRegex =
        /export\s+(?:const\s+)?(?:async\s+)?(?:function\s+)?(GET|POST|PUT|PATCH|DELETE|HEAD)\s*[=(]/g;
      let m: RegExpExecArray | null;
      while ((m = handlerRegex.exec(content)) !== null) {
        const method = m[1]!;
        const rawPath = p
          .replace(/.*\/app\//, "/")
          .replace(/\/route\.(ts|js)$/, "")
          .replace(/\/\([^)]+\)/g, "");
        const segments = rawPath.split("/").filter(Boolean);
        const pathLabel = segments
          .map((s) =>
            s.startsWith("[...") ? "Path" : s.startsWith("[") ? "By ID" : toLabel(s),
          )
          .join(" ");
        const verb = HTTP_VERB[method] ?? method;
        const label = pathLabel ? `${verb} ${pathLabel}` : `${verb} ${domain}`;
        const actor = isAdminFile
          ? "actor_Admin"
          : isWebhookGH
            ? "actor_GitHub"
            : isWebhookStripe
              ? "actor_Stripe"
              : "actor_User";
        addUC(label, `HTTP ${method} ${rawPath}`, actor, domain, {
          requiresAuth: !isPublicAuthPage && !isWebhookGH && !isWebhookStripe && method !== "GET",
          requiresAdmin: isAdminFile,
        });
      }
    }

    // ── b) tRPC procedures ────────────────────────────────────────────────────
    {
      const procRegex =
        /(\w+)\s*:\s*(publicProcedure|protectedProcedure|adminProcedure)\s*\./g;
      const skipProc = new Set([
        "default", "createTRPCRouter", "router", "procedure", "t",
        "input", "output", "query", "mutation", "use",
      ]);
      let m: RegExpExecArray | null;
      while ((m = procRegex.exec(content)) !== null) {
        const procName = m[1]!;
        const procType = m[2]!;
        if (skipProc.has(procName)) continue;
        if (/^[A-Z_0-9]{2,}$/.test(procName)) continue;
        const actor = procType === "adminProcedure" ? "actor_Admin" : "actor_User";
        addUC(toLabel(procName), `tRPC ${procType}: ${procName}`, actor, domain, {
          requiresAuth: procType !== "publicProcedure",
          requiresAdmin: procType === "adminProcedure",
        });
      }
    }

    // ── c) Next.js Server Actions ("use server") ──────────────────────────────
    if (isServerAction) {
      const actionRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\(/g;
      const skipNames = new Set([
        "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "default",
        "generateMetadata", "generateStaticParams", "generateViewport",
      ]);
      let m: RegExpExecArray | null;
      while ((m = actionRegex.exec(content)) !== null) {
        const fnName = m[1]!;
        if (skipNames.has(fnName)) continue;
        if (/^[A-Z_0-9]{2,}$/.test(fnName)) continue;
        addUC(toLabel(fnName), `Server Action: ${fnName}`, "actor_User", domain, {
          requiresAuth: true,
          requiresAdmin: isAdminFile,
        });
      }
    }

    // ── d) Inngest background functions ───────────────────────────────────────
    if (isInngest) {
      const fnIdRegex = /\bid\s*:\s*["']([^"']+)["']/g;
      let m: RegExpExecArray | null;
      while ((m = fnIdRegex.exec(content)) !== null) {
        const fnId = m[1]!;
        addUC(toLabel(fnId), `Background job: ${fnId}`, "actor_Inngest", domain, {
          isBackground: true,
        });
      }
    }

    // ── e) Express / Fastify / Hono / Koa routes ─────────────────────────────
    {
      const expressRegex =
        /(?:router|app|server|routes?|hono)\.(get|post|put|patch|delete|all|use)\s*\(\s*["'`]([^"'`\n]+)["'`]/gi;
      let m: RegExpExecArray | null;
      while ((m = expressRegex.exec(content)) !== null) {
        const method = m[1]!.toUpperCase();
        const routePath = m[2]!;
        if (method === "USE" && routePath === "/") continue;
        const verb = HTTP_VERB[method] ?? method;
        const pathLabel =
          routePath
            .split("/")
            .filter((s) => s && !s.startsWith(":") && !s.startsWith("*"))
            .map(toLabel)
            .join(" ")
            .trim() || domain;
        addUC(`${verb} ${pathLabel}`, `${method} ${routePath}`, defaultActor, domain, {
          requiresAuth: method !== "GET" && !isPublicAuthPage,
          requiresAdmin: isAdminFile,
        });
      }
    }

    // ── f) NestJS / Spring-style decorator controllers ────────────────────────
    {
      const nestRegex =
        /@(Get|Post|Put|Patch|Delete|All)\s*\(\s*["'`]?([^"'`)\n]*)["'`]?\s*\)\s*(?:[^\n]*\n){0,6}(?:async\s+)?(\w+)\s*\(/g;
      let m: RegExpExecArray | null;
      while ((m = nestRegex.exec(content)) !== null) {
        const method = m[1]!.toUpperCase();
        const handlerName = m[3]!;
        if (handlerName === "constructor") continue;
        const verb = HTTP_VERB[method] ?? method;
        addUC(`${verb} ${toLabel(handlerName)}`, `${method} (NestJS) ${handlerName}`, defaultActor, domain, {
          requiresAuth: method !== "GET" && !isPublicAuthPage,
          requiresAdmin: isAdminFile,
        });
      }
    }

    // ── g) GraphQL resolvers ──────────────────────────────────────────────────
    {
      // Code-first: @Query() / @Mutation() / @Subscription()
      const gqlDecRegex =
        /@(Query|Mutation|Subscription)\s*\([^)]*\)\s*(?:[^\n]*\n){0,4}(?:async\s+)?(\w+)\s*\(/g;
      let m: RegExpExecArray | null;
      while ((m = gqlDecRegex.exec(content)) !== null) {
        const gqlType = m[1]!;
        const resolverName = m[2]!;
        if (["constructor", "function", "class"].includes(resolverName)) continue;
        const actor = isAdminFile ? "actor_Admin" : "actor_User";
        addUC(toLabel(resolverName), `GraphQL ${gqlType}: ${resolverName}`, actor, domain, {
          requiresAuth: gqlType !== "Query" || isAdminFile,
          requiresAdmin: isAdminFile,
        });
      }
      // Schema-first SDL: type Query/Mutation/Subscription { field... }
      const schemaRegex = /type\s+(Query|Mutation|Subscription)\s*\{([^}]+)\}/g;
      let sm: RegExpExecArray | null;
      while ((sm = schemaRegex.exec(content)) !== null) {
        const gqlType = sm[1]!;
        const body = sm[2]!;
        const fieldRegex = /^\s*(\w+)\s*(?:\([^)]*\))?\s*:/gm;
        let fm: RegExpExecArray | null;
        while ((fm = fieldRegex.exec(body)) !== null) {
          const fieldName = fm[1]!;
          if (fieldName.startsWith("__")) continue;
          addUC(toLabel(fieldName), `GraphQL ${gqlType}: ${fieldName}`, "actor_User", domain, {
            requiresAuth: gqlType !== "Query",
          });
        }
      }
    }

    // ── h) WebSocket event handlers ───────────────────────────────────────────
    {
      const wsRegex =
        /(?:socket|io|ws|wss?|client)\.(on|once)\s*\(\s*["'`]([^"'`\n]+)["'`]/g;
      const skipEvents = new Set([
        "connection", "disconnect", "error", "close", "message", "open",
        "ping", "pong", "connect", "reconnect", "reconnect_attempt",
      ]);
      let m: RegExpExecArray | null;
      while ((m = wsRegex.exec(content)) !== null) {
        const eventName = m[2]!;
        if (skipEvents.has(eventName.toLowerCase())) continue;
        addUC(
          `Subscribe ${toLabel(eventName)}`,
          `WebSocket event: ${eventName}`,
          "actor_User",
          domain,
          { requiresAuth: true },
        );
      }
    }

    // ── i) Next.js page routes (navigation use cases) ─────────────────────────
    if (/\/page\.(tsx|jsx)$/.test(p)) {
      const rawPath = p
        .replace(/.*\/app\//, "/")
        .replace(/\/page\.(tsx|jsx)$/, "")
        .replace(/\/\([^)]+\)/g, "")
        .trim();
      const skipPaths = new Set(["", "/", "layout", "error", "loading", "not-found", "template"]);
      if (!skipPaths.has(rawPath)) {
        const segments = rawPath.split("/").filter(Boolean);
        const leaf = segments[segments.length - 1] ?? "";
        const isIdSegment = /^\[.+\]$/.test(leaf);
        const pageLabel = segments
          .map((s) => (s.startsWith("[") ? "Detail" : toLabel(s)))
          .join(" ");
        const label = isIdSegment
          ? `View ${toLabel(segments[segments.length - 2] ?? domain)} Detail`
          : `View ${pageLabel} Page`;
        const requiresAuth =
          isAdminFile || /dashboard|account|settings|profile|billing/i.test(rawPath);
        addUC(label, `Page: /${rawPath}`, isAdminFile ? "actor_Admin" : requiresAuth ? "actor_User" : "actor_Guest", domain, {
          requiresAuth,
          requiresAdmin: isAdminFile,
        });
      }
    }

    // ── j) Cron / scheduled jobs ──────────────────────────────────────────────
    if (isCron || content.includes("cron.schedule") || content.includes("node-cron")) {
      const cronRegex =
        /(?:cron\.schedule|schedule)\s*\(\s*["'`][^"'`\n]+["'`]\s*,/g;
      let m: RegExpExecArray | null;
      while ((m = cronRegex.exec(content)) !== null) {
        const after = content.slice(m.index, m.index + 300);
        const fnMatch = /function\s+(\w+)|const\s+(\w+)\s*=/.exec(after);
        const label = fnMatch
          ? toLabel((fnMatch[1] ?? fnMatch[2])!)
          : `${domain} Scheduled Task`;
        addUC(label, `Cron job in ${domain}`, "actor_Scheduler", domain, { isBackground: true });
      }
    }

    // ── k) Stripe webhook event types ────────────────────────────────────────
    if (isWebhookStripe) {
      const stripeEventRegex =
        /["'](payment_intent\.\w+|charge\.\w+|customer\.\w+|invoice\.\w+|subscription\.\w+|checkout\.session\.\w+)["']/g;
      let m: RegExpExecArray | null;
      while ((m = stripeEventRegex.exec(content)) !== null) {
        addUC(toLabel(m[1]!), `Stripe webhook: ${m[1]}`, "actor_Stripe", domain, {
          isBackground: true,
        });
      }
    }
  }

  // 4. Fallback: generic exports from well-named files ──────────────────────
  if (ucList.length === 0) {
    for (const [filePath, content] of Object.entries(fileContents)) {
      const p = filePath.replace(/\\/g, "/");
      const fileName = p.split("/").pop()?.replace(/\.(ts|tsx|js|jsx)$/, "") ?? "";
      if (!/route|controller|handler|service|endpoint|action|resolver/i.test(fileName)) continue;
      const domain = inferDomain(p);
      const isAdminFile = /\/admin[/.]/.test(p);
      const namedFnRegex =
        /export\s+(?:async\s+)?function\s+(\w+)\s*\(|export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(/g;
      const skipNames = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "default"]);
      let m: RegExpExecArray | null;
      while ((m = namedFnRegex.exec(content)) !== null) {
        const fnName = (m[1] ?? m[2])!;
        if (skipNames.has(fnName)) continue;
        if (/^[A-Z_0-9]{2,}$/.test(fnName)) continue;
        addUC(toLabel(fnName), `Function: ${fnName}`, isAdminFile ? "actor_Admin" : "actor_User", domain, {
          requiresAuth: true,
          requiresAdmin: isAdminFile,
        });
      }
    }
  }

  // 5. Last resort: skeleton ─────────────────────────────────────────────────
  if (ucList.length === 0) {
    const id = "uc_system_no_patterns";
    nodes.push({
      id,
      label: "System (no patterns detected)",
      type: "USE_CASE",
      detail: {
        description: "No recognisable route, procedure, or action patterns found.",
        interactions: ["User"],
      } as DiagramNodeDetailUseCase,
    });
    edges.push({ fromId: "actor_User", toId: id, label: "interacts", direction: "ASSOCIATES" });
    const definition = buildMermaid(nodes, edges, new Map());
    const sorted = [...edges].sort((a, b) =>
      `${a.fromId}-${a.toId}`.localeCompare(`${b.fromId}-${b.toId}`),
    );
    return { definition, nodes, edges: sorted };
  }

  // 6. Build domain groups ──────────────────────────────────────────────────
  type GroupInfo = { label: string; ucIds: string[]; actorIds: Set<string> };
  const groups = new Map<string, GroupInfo>();
  const authIncludeIds = new Set<string>();
  const adminIncludeIds = new Set<string>();

  for (const uc of ucList) {
    nodes.push({
      id: uc.id,
      label: uc.label,
      type: "USE_CASE",
      detail: {
        description: uc.description,
        interactions: [uc.actorId.replace("actor_", "")],
      } as DiagramNodeDetailUseCase,
    });

    const groupId = `grp_${safeId(uc.domain)}`;
    if (!groups.has(groupId))
      groups.set(groupId, { label: uc.domain, ucIds: [], actorIds: new Set() });
    const g = groups.get(groupId)!;
    g.ucIds.push(uc.id);
    g.actorIds.add(uc.actorId);

    edges.push({
      fromId: uc.actorId,
      toId: uc.id,
      label: uc.isBackground ? "triggers" : "uses",
      direction: "ASSOCIATES",
    });

    if (uc.requiresAuth && !uc.isBackground && uc.actorId !== "actor_Admin")
      authIncludeIds.add(uc.id);
    if (uc.requiresAdmin) adminIncludeIds.add(uc.id);
  }

  // 7. «include» Authenticate ───────────────────────────────────────────────
  if (authIncludeIds.size > 0) {
    const authId = "uc_authenticate";
    nodes.push({
      id: authId,
      label: "Authenticate",
      type: "USE_CASE",
      detail: {
        description: "Verify the user's session / JWT before executing the action.",
        interactions: ["User"],
      } as DiagramNodeDetailUseCase,
    });
    if (!groups.has("grp_authentication"))
      groups.set("grp_authentication", { label: "Authentication", ucIds: [], actorIds: new Set() });
    groups.get("grp_authentication")!.ucIds.push(authId);
    groups.get("grp_authentication")!.actorIds.add("actor_User");
    edges.push({ fromId: "actor_User", toId: authId, label: "performs", direction: "ASSOCIATES" });
    for (const ucId of authIncludeIds) {
      edges.push({ fromId: ucId, toId: authId, label: "«include»", direction: "INCLUDES" });
    }
  }

  // 8. «include» Admin Authorize ────────────────────────────────────────────
  if (adminIncludeIds.size > 0 && activeActors.has("actor_Admin")) {
    const adminAuthId = "uc_admin_authorize";
    nodes.push({
      id: adminAuthId,
      label: "Admin Authorize",
      type: "USE_CASE",
      detail: {
        description: "Verify that the user holds administrator-level permissions.",
        interactions: ["Admin"],
      } as DiagramNodeDetailUseCase,
    });
    if (!groups.has("grp_authentication"))
      groups.set("grp_authentication", { label: "Authentication", ucIds: [], actorIds: new Set() });
    groups.get("grp_authentication")!.ucIds.push(adminAuthId);
    groups.get("grp_authentication")!.actorIds.add("actor_Admin");
    edges.push({ fromId: "actor_Admin", toId: adminAuthId, label: "performs", direction: "ASSOCIATES" });
    for (const ucId of adminIncludeIds) {
      edges.push({ fromId: ucId, toId: adminAuthId, label: "«include»", direction: "INCLUDES" });
    }
  }

  // 9. Actor generalisation — Admin is a specialised User ───────────────────
  if (activeActors.has("actor_Admin") && activeActors.has("actor_User")) {
    edges.push({ fromId: "actor_Admin", toId: "actor_User", label: "«generalize»", direction: "INHERITS" });
  }

  // 10. Render ───────────────────────────────────────────────────────────────
  const definition = buildMermaid(nodes, edges, groups);
  const sortedEdges = [...edges].sort((a, b) =>
    `${a.fromId}-${a.toId}`.localeCompare(`${b.fromId}-${b.toId}`),
  );
  return { definition, nodes, edges: sortedEdges };
}

// ─── Mermaid renderer ──────────────────────────────────────────────────────

function buildMermaid(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  groups: Map<string, { label: string; ucIds: string[] }>,
): string {
  const lines: string[] = ["flowchart LR"];

  // Actors (outside any subgraph)
  for (const n of nodes.filter((n) => n.type === "ACTOR")) {
    lines.push(`  ${n.id}(("${n.label}"))`);
  }

  // Grouped use cases
  const sortedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [groupId, group] of sortedGroups) {
    if (group.ucIds.length === 0) continue;
    lines.push(`  subgraph ${groupId}["${group.label}"]`);
    for (const ucId of [...group.ucIds].sort()) {
      const node = nodes.find((n) => n.id === ucId);
      if (!node) continue;
      lines.push(`    ${ucId}(["${node.label}"])`);
    }
    lines.push("  end");
  }

  // Edges
  const sortedEdges = [...edges].sort((a, b) =>
    `${a.fromId}-${a.toId}`.localeCompare(`${b.fromId}-${b.toId}`),
  );
  for (const edge of sortedEdges) {
    let line: string;
    if (edge.direction === "INCLUDES") {
      line = `  ${edge.fromId} -. "«include»" .-> ${edge.toId}`;
    } else if (edge.direction === "EXTENDS") {
      line = `  ${edge.fromId} -. "«extend»" .-> ${edge.toId}`;
    } else if (edge.direction === "INHERITS") {
      line = `  ${edge.fromId} --> ${edge.toId}`;
    } else {
      line = `  ${edge.fromId} ${edge.label === "triggers" ? "-..->" : "-->"} ${edge.toId}`;
    }
    lines.push(line);
  }

  return lines.join("\n");
}
