import { inngest } from "../client";
import { db } from "@/server/db";
import {
  fetchPullRequestFiles,
  fetchRepositoryFiles,
  getGitHubAccessToken,
} from "@/server/services/github";
import { generateMermaidDefinition } from "@/server/services/diagram-generator";
import { getPusherServer } from "@/server/pusher";
import sanitizeHtml from "sanitize-html";

export type GenerateDiagramEvent = {
  name: "diagram/generation.requested";
  data: {
    diagramId: string;
    reviewId?: string; // Optional, only if triggered from a PR review
    repositoryId: string;
    userId: string;
    prNumber?: number; // Optional, fallbacks to full repository scan (not fully implemented in fetch yet, but typed as optional)
    type: "ERD" | "CLASS" | "USE_CASE";
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<string | null> {
  const refParam = ref ? `?ref=${ref}` : "";
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${refParam}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { content?: string; encoding?: string };
  if (json.encoding === "base64" && json.content) {
    return Buffer.from(json.content.replace(/\s/g, ""), "base64").toString(
      "utf-8",
    );
  }
  return null;
}

// ─── Function ─────────────────────────────────────────────────────────────────

export const generateDiagram = inngest.createFunction(
  {
    id: "generate-diagram",
    retries: 1,
    timeouts: { finish: "1m" },
    triggers: [{ event: "diagram/generation.requested" }],
    onFailure: async ({
      event: {
        data: {
          event: {
            data: { diagramId, repositoryId },
          },
        },
      },
      error,
    }) => {
      if (diagramId) {
        await db.diagram.update({
          where: { id: diagramId },
          data: {
            status: "FAILED",
            error: error?.message ?? "Diagram generation failed",
          },
        });
      }

      if (repositoryId) {
        const pusher = getPusherServer();
        if (pusher) {
          await pusher.trigger(
            `private-repository-${repositoryId}`,
            "diagram.updated",
            {
              diagramId,
              repositoryId,
              status: "FAILED",
            },
          );
        }
      }
    },
  },
  async ({ event, step }) => {
    const { diagramId, reviewId, repositoryId, userId, prNumber, type } =
      event.data;

    // ── Step 1: Load review & repository ─────────────────────────────────────
    const repository = await step.run("get-repository", async () => {
      return db.repository.findUnique({ where: { id: repositoryId } });
    });

    if (!repository) {
      await step.run("mark-failed-no-repo", async () => {
        await db.diagram.update({
          where: { id: diagramId },
          data: { status: "FAILED", error: "Repository not found" },
        });
      });
      return { success: false };
    }

    // ── Step 2: Get GitHub token ──────────────────────────────────────────────
    const accessToken = await step.run("get-github-token", async () => {
      return getGitHubAccessToken(userId);
    });

    if (!accessToken) {
      await step.run("mark-failed-no-token", async () => {
        await db.diagram.update({
          where: { id: diagramId },
          data: { status: "FAILED", error: "GitHub access token not found" },
        });
      });
      return { success: false };
    }

    const [owner, repo] = repository.fullName.split("/");
    if (!owner || !repo) {
      await step.run("mark-failed-invalid-repo", async () => {
        await db.diagram.update({
          where: { id: diagramId },
          data: { status: "FAILED", error: "Invalid repository name" },
        });
      });
      return { success: false };
    }

    // ── Step 3: Fetch files to map ────────────────────────────────────────────
    // All diagram types always scan the full codebase so the generated diagram
    // reflects the entire system, not just the files changed in a single PR.
    const changedFiles = await step.run("fetch-files", async () => {
      const repoFiles = await fetchRepositoryFiles(accessToken, owner, repo);
      // Score files differently depending on what diagram we're generating
      const scoreFile = (path: string) => {
        // ── ERD: prioritise DB schema & migration files ───────────────────────
        if (type === "ERD") {
          if (path.endsWith("schema.prisma") || path.endsWith(".prisma"))
            return 100;
          if (/migration/i.test(path) && path.endsWith(".sql")) return 90;
          if (path.endsWith("package.json")) return 20;
          if (path.endsWith(".ts") || path.endsWith(".tsx")) return 10;
          return 0;
        }
        // ── CLASS: prioritise service / model / entity / hook files ──────
        if (type === "CLASS") {
          // Skip test, spec, page, layout, config, and generated files entirely
          if (/\.(test|spec)\.(ts|js|tsx|jsx)$/.test(path)) return 0;
          if (
            /(page|layout|not-found|error|loading|template)\.(tsx|jsx)$/.test(
              path,
            )
          )
            return 0;
          if (/\.(config|setup)\.(ts|js)$/.test(path)) return 0;
          if (/node_modules|\.next|\.prisma|prisma\/migrations/.test(path))
            return 0;
          // Highest priority: explicit OOP naming convention
          if (
            /\.(service|model|entity|class|controller|repository|store)\.(ts|js)$/.test(
              path,
            )
          )
            return 100;
          // High priority: files in service/model/feature directories
          if (
            /\/(services?|models?|entities|controllers?|repositories?|stores?)\//i.test(
              path,
            ) &&
            /\.(ts|js)$/.test(path)
          )
            return 90;
          if (
            /\/server\/(api|services?|auth|db)\//i.test(path) &&
            path.endsWith(".ts")
          )
            return 85;
          if (/\/features?\//i.test(path) && path.endsWith(".ts")) return 70;
          if (/\/hooks?\//i.test(path) && path.endsWith(".ts")) return 60;
          // Generic TypeScript files
          if (path.endsWith(".ts")) return 50;
          if (path.endsWith(".tsx")) return 30;
          if (path.endsWith(".js") || path.endsWith(".jsx")) return 20;
          return 0;
        }
        // ── USE_CASE: prioritise route / controller / handler / API files ─────
        // Immediately discard files that can never contain use-case patterns
        if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(path)) return 0;
        if (/node_modules|\.next|prisma\/migrations/.test(path)) return 0;
        if (/\.(css|scss|sass|less|svg|png|jpg|gif|ico|md)$/.test(path))
          return 0;
        if (
          /(layout|not-found|error|loading|template)\.(tsx|jsx)$/.test(path)
        )
          return 0;
        if (/\.(config|setup)\.(ts|js)$/.test(path)) return 0;
        // Route handlers (highest value)
        if (/route\.(ts|js)$/.test(path)) return 100;
        if (/\.(controller|router|handler|endpoint)\.(ts|js)$/.test(path))
          return 100;
        // tRPC routers
        if (/\/routers?\/[^/]+\.(ts|js)$/.test(path)) return 95;
        // Route directories
        if (/routes?\/|controllers?\/|handlers?\/|endpoints?\//i.test(path))
          return 90;
        // API directory files
        if (
          /\/app\/api\//i.test(path) &&
          (path.endsWith(".ts") || path.endsWith(".js"))
        )
          return 88;
        // Server action files
        if (
          /\/actions?\//i.test(path) &&
          (path.endsWith(".ts") || path.endsWith(".js"))
        )
          return 85;
        if (/\.(action|actions)\.(ts|js)$/.test(path)) return 85;
        // Inngest / webhook / cron files
        if (/inngest/i.test(path)) return 82;
        if (/webhook/i.test(path)) return 80;
        if (/cron|schedule/i.test(path)) return 78;
        // Next.js pages (navigation use cases)
        if (/\/page\.(tsx|jsx)$/.test(path)) return 70;
        // Server-side files that may contain procedures / actions
        if (
          /\/server\//i.test(path) &&
          (path.endsWith(".ts") || path.endsWith(".js"))
        )
          return 40;
        // Generic TypeScript — may have tRPC procedures or server actions
        if (path.endsWith(".ts")) return 15;
        if (path.endsWith(".tsx")) return 8;
        if (path.endsWith(".js") || path.endsWith(".jsx")) return 5;
        return 0;
      };

      return repoFiles
        .map((f) => ({ filename: f.path, score: scoreFile(f.path) }))
        .filter((f) => f.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((f) => ({ filename: f.filename }));
    });

    // ── Step 4: Fetch file contents ───────────────────────────────────────────
    const fileContents = await step.run("fetch-file-contents", async () => {
      const contents: Record<string, string> = {};

      // Limit to reasonable number of files to avoid token/time explosion.
      // USE_CASE needs a wide scan of the whole codebase; CLASS also needs many files.
      const MAX_FILES = type === "CLASS" ? 60 : type === "USE_CASE" ? 80 : 20;
      const relevant = changedFiles.slice(0, MAX_FILES);

      await Promise.all(
        relevant.map(async (file) => {
          const content = await fetchFileContent(
            accessToken,
            owner,
            repo,
            file.filename,
          );
          if (content) {
            contents[file.filename] = content;
          }
        }),
      );

      return contents;
    });

    const generated = await step.run("generate-definition", async () => {
      const result = await generateMermaidDefinition(type, fileContents);
      
      if (result.definition) {
        let sanitized = sanitizeHtml(result.definition, {
          allowedTags: [], // Strip all HTML tags to prevent XSS
          allowedAttributes: {},
        });
        sanitized = sanitized
          .replace(/&gt;/g, ">")
          .replace(/&lt;/g, "<")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        result.definition = sanitized;
      }
      
      return result;
    });

    // Step 6: Persist result
    await step.run("save-result", async () => {
      // If the generator produced no content (e.g. no classes found) but
      // returned a warning instead of throwing, keep the previous diagram
      // definition so the UI can continue showing it with a tip.
      if (generated.warning && !generated.definition) {
        const existing = await db.diagram.findUnique({
          where: { id: diagramId },
          select: { definition: true, nodes: true, edges: true },
        });

        await db.diagram.update({
          where: { id: diagramId },
          data: {
            status: "COMPLETED",
            // Restore previous definition/nodes/edges when available
            ...(existing?.definition
              ? {
                  definition: existing.definition,
                  nodes: existing.nodes ?? undefined,
                  edges: existing.edges ?? undefined,
                }
              : {}),
            // Surface the warning as a non-fatal error so the panel can show a tip
            error: generated.warning,
            generatedAt: new Date(),
          },
        });
        return;
      }

      // Flag nodes that didn't exist in the previous generation (skip on first run).
      const prev = await db.diagram.findUnique({
        where: { id: diagramId },
        select: { nodes: true },
      });
      const prevIds = new Set(
        (Array.isArray(prev?.nodes) ? (prev.nodes as Array<{ id?: string }>) : [])
          .map((n) => n?.id)
          .filter(Boolean),
      );
      const nodes =
        prevIds.size > 0
          ? generated.nodes.map((n) => (prevIds.has(n.id) ? n : { ...n, isNew: true }))
          : generated.nodes;

      await db.diagram.update({
        where: { id: diagramId },
        data: {
          status: "COMPLETED",
          definition: generated.definition,
          nodes: nodes as object[],
          edges: generated.edges as object[],
          error: null,
          generatedAt: new Date(),
        },
      });
    });

    // Step 7: Notify via Pusher
    await step.run("notify-pusher", async () => {
      const pusher = getPusherServer();
      if (!pusher) return;
      await pusher.trigger(
        `private-repository-${repositoryId}`,
        "diagram.updated",
        {
          diagramId,
          repositoryId,
          type,
          status: "COMPLETED",
        },
      );
      if (reviewId) {
        // Also notify the review channel if requested from a PR
        await pusher.trigger(`private-review-${reviewId}`, "diagram.updated", {
          diagramId,
          repositoryId,
          type,
          status: "COMPLETED",
        });
      }
    });

    return { success: true, diagramId };
  },
);
