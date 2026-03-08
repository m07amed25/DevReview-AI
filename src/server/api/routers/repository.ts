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
} from "@/server/services/github";

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
