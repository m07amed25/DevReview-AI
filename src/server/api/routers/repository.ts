import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  fetchGitHubRepos,
  getGitHubAccessToken,
  fetchCommits,
  fetchBranches,
  fetchDefaultBranch,
  GitHubCommit,
  GitHubBranch,
  registerWebhook,
  deleteWebhook,
} from "@/server/services/github";
import { getAccessibleRepository } from "@/lib/repository";

const sortOptions = ["name", "updatedAt", "createdAt"] as const;
export type SortOption = (typeof sortOptions)[number];

export const repositoryRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          sortBy: z.enum(sortOptions).optional().default("createdAt"),
          order: z.enum(["asc", "desc"]).optional().default("desc"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const sortBy = input?.sortBy ?? "createdAt";
      const order = input?.order ?? "desc";

      return ctx.db.repository.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { team: { members: { some: { userId: ctx.user.id } } } },
          ],
        },
        include: {
          team: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: {
          [sortBy]: order,
        },
      });
    }),

  fetchFromGithub: protectedProcedure.query(async ({ ctx }) => {
    const accessToken = await getGitHubAccessToken(ctx.user.id);

    if (!accessToken) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "GitHub access token not found. Please connect your GitHub account.",
      });
    }

    const repos = await fetchGitHubRepos(accessToken);

    return repos.map((repo) => ({
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      htmlUrl: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
    }));
  }),

  connect: protectedProcedure
    .input(
      z.object({
        repos: z.array(
          z.object({
            githubId: z.number(),
            name: z.string(),
            fullName: z.string(),
            private: z.boolean(),
            htmlUrl: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await Promise.all(
        input.repos.map(async (repo) => {
          return ctx.db.repository.upsert({
            where: {
              userId_githubId: {
                userId: ctx.user.id,
                githubId: repo.githubId,
              },
            },
            create: {
              userId: ctx.user.id,
              githubId: repo.githubId,
              name: repo.name,
              fullName: repo.fullName,
              private: repo.private,
              htmlUrl: repo.htmlUrl,
            },
            update: {
              name: repo.name,
              fullName: repo.fullName,
              private: repo.private,
              htmlUrl: repo.htmlUrl,
              updatedAt: new Date(),
            },
          });
        }),
      );

      return {
        connected: result.length,
      };
    }),

  disconnect: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.repository.delete({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });
      return {
        success: true,
      };
    }),

  getWebhookConfig: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getAccessibleRepository(ctx.db, ctx.user.id, input.repositoryId);

      return ctx.db.webhookConfig.findUnique({
        where: { repositoryId: input.repositoryId },
      });
    }),

  updateWebhookConfig: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().cuid(),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findFirst({
        where: {
          id: input.repositoryId,
          OR: [
            { userId: ctx.user.id },
            {
              team: {
                members: {
                  some: {
                    userId: ctx.user.id,
                    role: { in: ["OWNER", "ADMIN"] },
                  },
                },
              },
            },
          ],
        },
      });

      if (!repository) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only repository owners or team admins can update webhook config",
        });
      }

      const accessToken = await getGitHubAccessToken(repository.userId);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub access token not found for repository owner",
        });
      }

      const appBaseUrl = process.env.APP_BASE_URL ?? process.env.BETTER_AUTH_URL;
      const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

      if (!appBaseUrl || !webhookSecret) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "APP_BASE_URL and GITHUB_WEBHOOK_SECRET are required",
        });
      }

      const existingConfig = await ctx.db.webhookConfig.findUnique({
        where: { repositoryId: repository.id },
      });

      try {
        if (input.enabled) {
          const githubWebhookId = await registerWebhook(
            accessToken,
            repository.fullName,
            `${appBaseUrl}/api/webhooks/github`,
            webhookSecret,
          );

          return ctx.db.webhookConfig.upsert({
            where: { repositoryId: repository.id },
            create: {
              repositoryId: repository.id,
              enabled: true,
              githubWebhookId,
            },
            update: {
              enabled: true,
              githubWebhookId,
            },
            select: {
              id: true,
              repositoryId: true,
              enabled: true,
              githubWebhookId: true,
            },
          });
        }

        if (existingConfig?.githubWebhookId) {
          await deleteWebhook(
            accessToken,
            repository.fullName,
            existingConfig.githubWebhookId,
          );
        }

        return ctx.db.webhookConfig.upsert({
          where: { repositoryId: repository.id },
          create: {
            repositoryId: repository.id,
            enabled: false,
            githubWebhookId: null,
          },
          update: {
            enabled: false,
            githubWebhookId: null,
          },
          select: {
            id: true,
            repositoryId: true,
            enabled: true,
            githubWebhookId: true,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update webhook configuration",
        });
      }
    }),

  getScheduledScanConfig: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await getAccessibleRepository(ctx.db, ctx.user.id, input.repositoryId);

      return ctx.db.scheduledScanConfig.findUnique({
        where: { repositoryId: input.repositoryId },
      });
    }),

  updateScheduledScanConfig: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().cuid(),
        enabled: z.boolean(),
        cadence: z.enum(["DAILY", "WEEKLY"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId },
      });

      if (!repository) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      if (repository.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only repository owner can update scheduled scan config",
        });
      }

      const existingConfig = await ctx.db.scheduledScanConfig.findUnique({
        where: { repositoryId: input.repositoryId },
      });

      const cadenceToSave =
        input.cadence ?? existingConfig?.cadence ?? "WEEKLY";

      return ctx.db.scheduledScanConfig.upsert({
        where: { repositoryId: input.repositoryId },
        create: {
          repositoryId: input.repositoryId,
          enabled: input.enabled,
          cadence: cadenceToSave,
        },
        update: {
          enabled: input.enabled,
          ...(input.cadence ? { cadence: input.cadence } : {}),
        },
        select: {
          id: true,
          repositoryId: true,
          enabled: true,
          cadence: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }),

  getCommits: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        branch: z.string().optional(),
        page: z.number().optional().default(1),
        perPage: z.number().optional().default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.user.id },
            { team: { members: { some: { userId: ctx.user.id } } } },
          ],
        },
      });

      if (!repository) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      const accessToken = await getGitHubAccessToken(ctx.user.id);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "GitHub access token not found. Please connect your GitHub account.",
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      const commits = await fetchCommits(accessToken, owner, repo, {
        page: input.page,
        perPage: input.perPage,
        sha: input.branch,
      });

      return commits.map((commit: GitHubCommit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.author
          ? {
              login: commit.author.login,
              avatarUrl: commit.author.avatar_url,
            }
          : {
              login: commit.commit.author.name,
              avatarUrl: null,
            },
        date: commit.commit.author.date,
        htmlUrl: commit.html_url,
        parents: commit.parents.map((p) => p.sha),
      }));
    }),

  getBranches: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.user.id },
            { team: { members: { some: { userId: ctx.user.id } } } },
          ],
        },
      });

      if (!repository) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      const accessToken = await getGitHubAccessToken(ctx.user.id);
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "GitHub access token not found. Please connect your GitHub account.",
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      const [branches, defaultBranch] = await Promise.all([
        fetchBranches(accessToken, owner, repo),
        fetchDefaultBranch(accessToken, owner, repo),
      ]);

      return {
        branches: branches.map((branch: GitHubBranch) => ({
          name: branch.name,
          sha: branch.commit.sha,
          isProtected: branch.protected,
        })),
        defaultBranch,
      };
    }),
});
