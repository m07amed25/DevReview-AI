import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { PrismaClient } from "@/server/db/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const teamRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.teamMember.findMany({
      where: { userId: ctx.user.id },
      include: {
        team: {
          include: {
            _count: { select: { members: true, repositories: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      ...m.team,
      role: m.role,
      memberCount: m.team._count.members,
      repoCount: m.team._count.repositories,
    }));
  }),

  // ─── Get team details ────────────────────────────────────────────
  get: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: input.teamId, userId: ctx.user.id },
        },
      });
      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          repositories: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return { ...team, currentUserRole: membership.role };
    }),

  // ─── Create a team ───────────────────────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseSlug = slugify(input.name);
      let slug = baseSlug;
      let attempt = 0;

      // Ensure slug uniqueness
      while (await ctx.db.team.findUnique({ where: { slug } })) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }

      const team = await ctx.db.team.create({
        data: {
          name: input.name,
          slug,
          members: {
            create: {
              userId: ctx.user.id,
              role: "OWNER",
            },
          },
        },
      });

      return team;
    }),

  // ─── Update team name ────────────────────────────────────────────
  update: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        name: z.string().min(2).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN"]);

      return ctx.db.team.update({
        where: { id: input.teamId },
        data: { name: input.name },
      });
    }),

  // ─── Delete team (owner only) ────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER"]);

      // Unlink repositories (don't delete them, just remove team association)
      await ctx.db.repository.updateMany({
        where: { teamId: input.teamId },
        data: { teamId: null },
      });

      await ctx.db.team.delete({ where: { id: input.teamId } });
      return { deleted: true };
    }),

  // ─── Invite a member by email ────────────────────────────────────
  inviteMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN"]);

      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user found with that email. They must sign up first.",
        });
      }

      const existing = await ctx.db.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: input.teamId, userId: user.id },
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this team",
        });
      }

      const membership = await ctx.db.teamMember.create({
        data: {
          teamId: input.teamId,
          userId: user.id,
          role: input.role,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      // Create in-app notification for the invited user
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        select: { name: true },
      });

      await ctx.db.notification.create({
        data: {
          userId: user.id,
          type: "TEAM_INVITE",
          title: `You've been added to "${team?.name ?? "a team"}"`,
          message: `${ctx.user.name ?? "A team admin"} has added you as a ${input.role.toLowerCase()} to the team.`,
          link: `/teams/${input.teamId}`,
        },
      });

      return membership;
    }),

  // ─── Change a member's role ──────────────────────────────────────
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
        role: z.enum(["ADMIN", "MEMBER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER"]);

      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      return ctx.db.teamMember.update({
        where: {
          teamId_userId: { teamId: input.teamId, userId: input.userId },
        },
        data: { role: input.role },
      });
    }),

  // ─── Remove a member ─────────────────────────────────────────────
  removeMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Allow admins/owners to remove others, or members to leave
      if (input.userId !== ctx.user.id) {
        await assertRole(ctx, input.teamId, ["OWNER", "ADMIN"]);
      }

      // Owners cannot remove themselves (must delete team or transfer)
      const target = await ctx.db.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: input.teamId, userId: input.userId },
        },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }
      if (target.role === "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot remove the team owner",
        });
      }

      await ctx.db.teamMember.delete({
        where: {
          teamId_userId: { teamId: input.teamId, userId: input.userId },
        },
      });
      return { removed: true };
    }),

  // ─── Share a repository with the team ────────────────────────────
  shareRepository: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        repositoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN"]);

      const repo = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId, userId: ctx.user.id },
      });
      if (!repo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      return ctx.db.repository.update({
        where: { id: input.repositoryId },
        data: { teamId: input.teamId },
      });
    }),

  // ─── Unshare a repository from the team ──────────────────────────
  unshareRepository: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId, userId: ctx.user.id },
      });
      if (!repo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      return ctx.db.repository.update({
        where: { id: input.repositoryId },
        data: { teamId: null },
      });
    }),
});

// ─── Helper: assert the caller has one of the required roles ─────────
async function assertRole(
  ctx: { db: PrismaClient; user: { id: string } },
  teamId: string,
  roles: string[],
) {
  const membership = await ctx.db.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: ctx.user.id },
    },
  });
  if (!membership || !roles.includes(membership.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action",
    });
  }
  return membership;
}
