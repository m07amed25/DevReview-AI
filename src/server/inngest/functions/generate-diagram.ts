import { inngest } from "../client";
import { db } from "@/server/db";
import {
  fetchPullRequestFiles,
  getGitHubAccessToken,
} from "@/server/services/github";
import { generateMermaidDefinition } from "@/server/services/diagram-generator";
import { getPusherServer } from "@/server/pusher";

// ─── Event types ──────────────────────────────────────────────────────────────

export type GenerateDiagramEvent = {
  name: "diagram/generation.requested";
  data: {
    diagramId: string;
    reviewId: string;
    repositoryId: string;
    userId: string;
    prNumber: number;
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
    onFailure: async ({
      event: {
        data: {
          event: {
            data: { diagramId, reviewId },
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

      if (reviewId) {
        const pusher = getPusherServer();
        if (pusher) {
          await pusher.trigger(
            `private-review-${reviewId}`,
            "diagram.updated",
            {
              diagramId,
              reviewId,
              status: "FAILED",
            },
          );
        }
      }
    },
  },
  { event: "diagram/generation.requested" },
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

    // ── Step 3: Fetch changed files for the PR ────────────────────────────────
    const changedFiles = await step.run("fetch-changed-files", async () => {
      return fetchPullRequestFiles(accessToken, owner, repo, prNumber);
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
      await pusher.trigger(`private-review-${reviewId}`, "diagram.updated", {
        diagramId,
        reviewId,
        type,
        status: "COMPLETED",
      });
    });

    return { success: true, diagramId };
  },
);
