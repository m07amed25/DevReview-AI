import { inngest } from "../client";
import { db } from "@/server/db";
import {
  fetchPullRequestFiles,
  fetchRepositoryFiles,
  getGitHubAccessToken,
} from "@/server/services/github";
import { generateMermaidDefinition } from "@/server/services/diagram-generator";
import { getPusherServer } from "@/server/pusher";

// ─── Event types ──────────────────────────────────────────────────────────────

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
    const changedFiles = await step.run("fetch-files", async () => {
      if (prNumber) {
        const prFiles = await fetchPullRequestFiles(
          accessToken,
          owner,
          repo,
          prNumber,
        );
        return prFiles.map((f) => ({ filename: f.filename }));
      }

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
        // ── CLASS: prioritise service / model / entity files ─────────────────
        if (type === "CLASS") {
          if (/\.(service|model|entity|class)\.(ts|js)$/.test(path)) return 100;
          if (path.endsWith(".ts") || path.endsWith(".tsx")) return 50;
          if (path.endsWith(".js") || path.endsWith(".jsx")) return 40;
          return 0;
        }
        // ── USE_CASE: prioritise route / controller / handler / API files ─────
        if (/route\.(ts|js)$/.test(path)) return 100;
        if (/\.(controller|router|handler|endpoint)\.(ts|js)$/.test(path))
          return 100;
        if (/routes?\/|controllers?\/|handlers?\/|endpoints?\//i.test(path))
          return 90;
        if (
          /api\//i.test(path) &&
          (path.endsWith(".ts") || path.endsWith(".js"))
        )
          return 85;
        if (/inngest/i.test(path)) return 80;
        if (/webhook/i.test(path)) return 80;
        if (path.endsWith("package.json")) return 30;
        if (path.endsWith(".ts") || path.endsWith(".tsx")) return 20;
        if (path.endsWith(".js") || path.endsWith(".jsx")) return 10;
        return 0;
      };

      return repoFiles
        .map((f) => ({ filename: f.path, score: scoreFile(f.path) }))
        .sort((a, b) => b.score - a.score)
        .map((f) => ({ filename: f.filename }));
    });

    // ── Step 4: Fetch file contents ───────────────────────────────────────────
    const fileContents = await step.run("fetch-file-contents", async () => {
      const contents: Record<string, string> = {};

      // Limit to reasonable number of files to avoid token/time explosion
      const MAX_FILES = 20;
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

    // ── Step 5: Generate diagram definition ──────────────────────────────────
    const generated = await step.run("generate-definition", async () => {
      return generateMermaidDefinition(type, fileContents);
    });

    // ── Step 6: Persist result ────────────────────────────────────────────────
    await step.run("save-result", async () => {
      await db.diagram.update({
        where: { id: diagramId },
        data: {
          status: "COMPLETED",
          definition: generated.definition,
          nodes: generated.nodes as object[],
          edges: generated.edges as object[],
          error: null,
          generatedAt: new Date(),
        },
      });
    });

    // ── Step 7: Notify via Pusher ─────────────────────────────────────────────
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
