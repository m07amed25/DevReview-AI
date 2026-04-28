import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { PrismaClient } from "@/server/db/client";
import { sendTeamMemberAddedEmail } from "@/server/email/service";
import { getAppUrl } from "@/server/email/transporter";
import { inngest } from "@/server/inngest";
import {
  getGitHubAccessToken,
  fetchPullRequestByFullName,
} from "@/server/services/github";
import { randomUUID } from "crypto";

// Action types that require approval when requested by MEMBER role
const ACTIONS_REQUIRING_APPROVAL = [
  "INVITE_MEMBER",
  "REMOVE_MEMBER",
  "UPDATE_ROLE",
  "SHARE_REPOSITORY",
  "UNSHARE_REPOSITORY",
  "DELETE_TEAM",
] as const;

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

  get: protectedProcedure
    .input(z.object({ teamId: z.string().max(255) }))
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

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().max(255).min(2).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseSlug = slugify(input.name);

      // Use optimistic creation with P2002 retry to eliminate the TOCTOU race
      // condition of the previous check-then-create loop.
      for (let attempt = 0; attempt <= 10; attempt++) {
        const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
        try {
          return await ctx.db.team.create({
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
        } catch (e) {
          // P2002 = Unique constraint violation; retry with a suffixed slug
          const isUniqueViolation =
            typeof e === "object" &&
            e !== null &&
            (e as { code?: string }).code === "P2002";
          if (isUniqueViolation && attempt < 10) continue;
          throw e;
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not generate a unique team slug",
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        teamId: z.string().max(255),
        name: z.string().max(255).min(2).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN"]);

      return ctx.db.team.update({
        where: { id: input.teamId },
        data: { name: input.name },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ teamId: z.string().max(255) }))
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

  inviteMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string().max(255),
        email: z.string().email().max(255).email(),
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

      // Check for an existing pending invite to avoid duplicate tokens
      const existingInvite = await ctx.db.verification.findFirst({
        where: {
          identifier: `team-invite:${input.teamId}:${user.id}`,
          expiresAt: { gt: new Date() },
        },
      });
      if (existingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A pending invite already exists for this user",
        });
      }

      // Create an invite token in the Verification table (expires in 7 days)
      const token = randomUUID();
      await ctx.db.verification.create({
        data: {
          id: token,
          identifier: `team-invite:${input.teamId}:${user.id}`,
          value: JSON.stringify({
            teamId: input.teamId,
            inviterId: ctx.user.id,
            role: input.role,
          }),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Fetch team info for notifications and email
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        select: { name: true, slug: true },
      });

      const appUrl = getAppUrl();
      const acceptUrl = `${appUrl}/teams/accept-invite?token=${token}`;

      // In-app notification with accept link
      await ctx.db.notification.create({
        data: {
          userId: user.id,
          type: "TEAM_INVITE",
          title: `You've been invited to "${team?.name ?? "a team"}"`,
          message: `${ctx.user.name ?? "A team admin"} has invited you as a ${input.role.toLowerCase()}. Accept or decline via the link below.`,
          link: `/teams/accept-invite?token=${token}`,
        },
      });

      // Send email with acceptance link
      const inviter = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true, email: true },
      });
      if (user.email && team) {
        await sendTeamMemberAddedEmail({
          to: user.email,
          inviteeName: user.name || "Team Member",
          inviteeEmail: user.email,
          inviterName: inviter?.name || "Team Admin",
          inviterEmail: inviter?.email || "",
          teamName: team.name,
          teamId: input.teamId,
          teamSlug: team.slug,
          role: input.role,
          teamUrl: acceptUrl,
          needsGithubConnection: false,
        }).catch((err) =>
          console.error("Failed to send team invite email:", err),
        );
      }

      return { invited: true };
    }),

  /** Accept a pending team invite via the token sent in the invitation email. */
  acceptTeamInvite: protectedProcedure
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const verification = await ctx.db.verification.findUnique({
        where: { id: input.token },
      });

      if (
        !verification ||
        !verification.identifier.startsWith("team-invite:")
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found or already used",
        });
      }

      if (verification.expiresAt < new Date()) {
        await ctx.db.verification.delete({ where: { id: input.token } });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invite has expired",
        });
      }

      // Verify this token belongs to the current user
      const expectedIdentifier = `team-invite:${verification.identifier.split(":")[1]}:${ctx.user.id}`;
      if (verification.identifier !== expectedIdentifier) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite was not sent to your account",
        });
      }

      const meta = JSON.parse(verification.value) as {
        teamId: string;
        inviterId: string;
        role: string;
      };

      // Validate role from the stored token
      const validRoles = ["ADMIN", "MEMBER"] as const;
      const role: "ADMIN" | "MEMBER" = validRoles.includes(
        meta.role as "ADMIN" | "MEMBER",
      )
        ? (meta.role as "ADMIN" | "MEMBER")
        : "MEMBER";

      // Check they're not already a member
      const existing = await ctx.db.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: meta.teamId, userId: ctx.user.id },
        },
      });
      if (existing) {
        await ctx.db.verification.delete({ where: { id: input.token } });
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a member of this team",
        });
      }

      // Create membership and clean up token atomically
      const [membership] = await ctx.db.$transaction([
        ctx.db.teamMember.create({
          data: { teamId: meta.teamId, userId: ctx.user.id, role },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        }),
        ctx.db.verification.delete({ where: { id: input.token } }),
      ]);

      // Notify the inviter
      const team = await ctx.db.team.findUnique({
        where: { id: meta.teamId },
        select: { name: true },
      });
      await ctx.db.notification.create({
        data: {
          userId: meta.inviterId,
          type: "TEAM_MEMBER_ADDED",
          title: `${ctx.user.name ?? "A user"} accepted your invite`,
          message: `They have joined "${team?.name ?? "your team"}" as a ${role.toLowerCase()}.`,
          link: `/teams/${meta.teamId}`,
        },
      });

      return membership;
    }),

  /** Decline a pending team invite. */
  declineTeamInvite: protectedProcedure
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const verification = await ctx.db.verification.findUnique({
        where: { id: input.token },
      });

      if (
        !verification ||
        !verification.identifier.startsWith("team-invite:")
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found or already used",
        });
      }

      const expectedIdentifier = `team-invite:${verification.identifier.split(":")[1]}:${ctx.user.id}`;
      if (verification.identifier !== expectedIdentifier) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite was not sent to your account",
        });
      }

      await ctx.db.verification.delete({ where: { id: input.token } });
      return { declined: true };
    }),

  getPendingInvites: protectedProcedure
    .input(z.object({ teamId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      // Any team member can view pending invites
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN", "MEMBER"]);

      const records = await ctx.db.verification.findMany({
        where: {
          identifier: { startsWith: `team-invite:${input.teamId}:` },
          expiresAt: { gt: new Date() },
        },
        orderBy: { expiresAt: "asc" },
      });

      // Resolve user info for each invite
      return Promise.all(
        records.map(async (record) => {
          const userId = record.identifier.split(":")[2] ?? "";
          const parsed = JSON.parse(record.value) as {
            teamId: string;
            inviterId: string;
            role: string;
          };
          const [invitee, inviter] = await Promise.all([
            ctx.db.user.findUnique({
              where: { id: userId },
              select: { id: true, name: true, email: true, image: true },
            }),
            ctx.db.user.findUnique({
              where: { id: parsed.inviterId },
              select: { id: true, name: true },
            }),
          ]);
          return {
            token: record.id,
            role: parsed.role,
            expiresAt: record.expiresAt,
            invitee,
            inviter,
          };
        }),
      );
    }),

  cancelInvite: protectedProcedure
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const verification = await ctx.db.verification.findUnique({
        where: { id: input.token },
      });
      if (!verification?.identifier.startsWith("team-invite:")) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }
      const teamId = verification.identifier.split(":")[1]!;
      await assertRole(ctx, teamId, ["OWNER", "ADMIN"]);
      await ctx.db.verification.delete({ where: { id: input.token } });
      return { cancelled: true };
    }),

  // ─── Change a member's role ──────────────────────────────────────
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        teamId: z.string().max(255),
        userId: z.string().max(255),
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
        teamId: z.string().max(255),
        userId: z.string().max(255),
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
        teamId: z.string().max(255),
        repositoryId: z.string().max(255),
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
        repositoryId: z.string().max(255),
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

  // ─── Get pending action requests for a team (for admins/owners) ──────
  getPendingActions: protectedProcedure
    .input(z.object({ teamId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      // Must be a member to view pending actions
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN", "MEMBER"]);

      return ctx.db.teamAction.findMany({
        where: {
          teamId: input.teamId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        include: {
          team: {
            select: { id: true, name: true },
          },
        },
      });
    }),

  // ─── Get my requested actions (for all members) ───────────────────────
  getMyRequestedActions: protectedProcedure
    .input(z.object({ teamId: z.string().max(255) }))
    .query(async ({ ctx, input }) => {
      // Must be a member to view their own requested actions
      await assertRole(ctx, input.teamId, ["OWNER", "ADMIN", "MEMBER"]);

      return ctx.db.teamAction.findMany({
        where: {
          teamId: input.teamId,
          requestedBy: ctx.user.id,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // ─── Request an action that requires approval ─────────────────────────
  requestAction: protectedProcedure
    .input(
      z.object({
        teamId: z.string().max(255),
        actionType: z.enum([
          "INVITE_MEMBER",
          "REMOVE_MEMBER",
          "UPDATE_ROLE",
          "SHARE_REPOSITORY",
          "UNSHARE_REPOSITORY",
          "DELETE_TEAM",
          "REVIEW_PR",
          "APPROVE_DISCUSSION",
        ]),
        targetUserId: z.string().max(255).optional(),
        targetRepoId: z.string().max(255).optional(),
        metadata: z
          .object({
            email: z.string().email().max(255).optional(),
            role: z.string().max(50).optional(),
            prNumber: z.number().optional(),
            discussionId: z.string().max(255).optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const membership = await assertRole(ctx, input.teamId, [
          "OWNER",
          "ADMIN",
          "MEMBER",
        ]);

        // Check if approval is required:
        // Only MEMBER role needs approval, and only for the action types
        // listed in ACTIONS_REQUIRING_APPROVAL (e.g. REVIEW_PR and
        // APPROVE_DISCUSSION are self-service actions that skip the gate).
        const requiresApproval =
          membership.role === "MEMBER" &&
          (ACTIONS_REQUIRING_APPROVAL as readonly string[]).includes(
            input.actionType,
          );

        // Create the action request
        const action = await ctx.db.teamAction.create({
          data: {
            teamId: input.teamId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            actionType: input.actionType as any,
            status: requiresApproval ? "PENDING" : "APPROVED",
            requestedBy: ctx.user.id,
            targetUserId: input.targetUserId,
            targetRepoId: input.targetRepoId,
            metadata: input.metadata ?? undefined,
            resolvedAt: requiresApproval ? null : new Date(),
            resolvedBy: requiresApproval ? null : ctx.user.id,
          },
        });

        // If no approval needed, execute the action immediately
        if (!requiresApproval) {
          await executeApprovedAction(ctx, action);
        } else {
          // Notify admins/owners about the pending action
          await notifyAdmins(ctx, input.teamId, action);
        }

        return {
          ...action,
          requiresApproval,
        };
      } catch (error) {
        // Handle specific error cases
        if (error instanceof TRPCError) {
          throw error;
        }
        // Log the error for debugging
        console.error("Error in requestAction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process action request. Please try again.",
        });
      }
    }),

  // ─── Approve a pending action (owner/admin only) ───────────────────────
  approveAction: protectedProcedure
    .input(
      z.object({
        actionId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const action = await ctx.db.teamAction.findUnique({
        where: { id: input.actionId },
      });

      if (!action) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Action not found",
        });
      }

      // Only owner/admin can approve
      await assertRole(ctx, action.teamId, ["OWNER", "ADMIN"]);

      if (action.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Action is not pending",
        });
      }

      // Update action status
      const updatedAction = await ctx.db.teamAction.update({
        where: { id: input.actionId },
        data: {
          status: "APPROVED",
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
        },
      });

      // Execute the approved action
      await executeApprovedAction(ctx, updatedAction);

      return updatedAction;
    }),

  // ─── Reject a pending action (owner/admin only) ───────────────────────
  rejectAction: protectedProcedure
    .input(
      z.object({
        actionId: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const action = await ctx.db.teamAction.findUnique({
        where: { id: input.actionId },
      });

      if (!action) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Action not found",
        });
      }

      // Only owner/admin can reject
      await assertRole(ctx, action.teamId, ["OWNER", "ADMIN"]);

      if (action.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Action is not pending",
        });
      }

      // Update action status
      const updatedAction = await ctx.db.teamAction.update({
        where: { id: input.actionId },
        data: {
          status: "REJECTED",
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
        },
      });

      // Notify the requester that their action was rejected
      const team = await ctx.db.team.findUnique({
        where: { id: action.teamId },
        select: { name: true },
      });

      await ctx.db.notification.create({
        data: {
          userId: action.requestedBy,
          type: "TEAM_MEMBER_ADDED",
          title: `Action rejected in "${team?.name ?? "team"}"`,
          message: `Your request to ${action.actionType.toLowerCase().replace("_", " ")} was rejected by an administrator.`,
          link: `/teams/${action.teamId}`,
        },
      });

      return updatedAction;
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

// ─── Helper: execute an approved action ────────────────────────────────
async function executeApprovedAction(
  ctx: { db: PrismaClient; user: { id: string } },
  action: {
    id: string;
    actionType: string;
    teamId: string;
    targetUserId: string | null;
    targetRepoId: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any;
    requestedBy: string;
  },
) {
  switch (action.actionType) {
    case "INVITE_MEMBER": {
      const meta = action.metadata as { email?: string; role?: string } | null;
      if (!meta?.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "INVITE_MEMBER action requires an email address in metadata",
        });
      }
      const user = await ctx.db.user.findUnique({
        where: { email: meta.email },
      });
      if (user) {
        await ctx.db.teamMember.upsert({
          where: {
            teamId_userId: { teamId: action.teamId, userId: user.id },
          },
          create: {
            teamId: action.teamId,
            userId: user.id,
            role: (meta.role as "ADMIN" | "MEMBER") || "MEMBER",
          },
          update: {
            role: (meta.role as "ADMIN" | "MEMBER") || "MEMBER",
          },
        });

        // Create notification for the invited user
        const team = await ctx.db.team.findUnique({
          where: { id: action.teamId },
          select: { name: true },
        });

        await ctx.db.notification.create({
          data: {
            userId: user.id,
            type: "TEAM_INVITE",
            title: `You've been added to "${team?.name ?? "a team"}"`,
            message: `You have been added to the team as a ${meta.role?.toLowerCase() ?? "member"}.`,
            link: `/teams/${action.teamId}`,
          },
        });
      }
      break;
    }

    case "REMOVE_MEMBER":
      if (action.targetUserId) {
        await ctx.db.teamMember.delete({
          where: {
            teamId_userId: {
              teamId: action.teamId,
              userId: action.targetUserId,
            },
          },
        });
      }
      break;

    case "UPDATE_ROLE":
      if (action.targetUserId) {
        const meta = action.metadata as { role?: string } | null;
        const validRoles = z.enum(["ADMIN", "MEMBER"]);
        const parsedRole = validRoles.safeParse(meta?.role);
        if (!parsedRole.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              'Invalid role value in UPDATE_ROLE action metadata. Expected "ADMIN" or "MEMBER".',
          });
        }
        await ctx.db.teamMember.update({
          where: {
            teamId_userId: {
              teamId: action.teamId,
              userId: action.targetUserId,
            },
          },
          data: { role: parsedRole.data },
        });
      }
      break;

    case "SHARE_REPOSITORY":
      if (action.targetRepoId) {
        // Verify the repository belongs to the user who requested the action
        // so that a team OWNER/ADMIN cannot share any arbitrary repository.
        const repo = await ctx.db.repository.findUnique({
          where: { id: action.targetRepoId },
          select: { userId: true },
        });
        if (!repo || repo.userId !== action.requestedBy) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Repository does not belong to the requesting user.",
          });
        }
        await ctx.db.repository.update({
          where: { id: action.targetRepoId },
          data: { teamId: action.teamId },
        });
      }
      break;

    case "UNSHARE_REPOSITORY":
      if (action.targetRepoId) {
        // Same ownership check as SHARE_REPOSITORY.
        const repo = await ctx.db.repository.findUnique({
          where: { id: action.targetRepoId },
          select: { userId: true },
        });
        if (!repo || repo.userId !== action.requestedBy) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Repository does not belong to the requesting user.",
          });
        }
        await ctx.db.repository.update({
          where: { id: action.targetRepoId },
          data: { teamId: null },
        });
      }
      break;

    case "DELETE_TEAM":
      // Unlink repositories
      await ctx.db.repository.updateMany({
        where: { teamId: action.teamId },
        data: { teamId: null },
      });
      // Delete the team
      await ctx.db.team.delete({ where: { id: action.teamId } });
      break;

    case "REVIEW_PR": {
      const meta = action.metadata as { prNumber?: number } | null;
      if (!meta?.prNumber || !action.targetRepoId) break;

      const repository = await ctx.db.repository.findUnique({
        where: { id: action.targetRepoId },
        select: { userId: true, fullName: true },
      });
      if (!repository) break;

      // Try to fetch the real PR title/URL for a complete review record
      let prTitle = `PR #${meta.prNumber}`;
      let prUrl = "";
      const accessToken = await getGitHubAccessToken(repository.userId);
      if (accessToken) {
        try {
          const pr = await fetchPullRequestByFullName(
            accessToken,
            repository.fullName,
            meta.prNumber,
          );
          prTitle = pr.title;
          prUrl = pr.html_url;
        } catch {
          // Non-fatal: proceed with placeholder values
        }
      }

      const review = await ctx.db.review.create({
        data: {
          repositoryId: action.targetRepoId,
          userId: action.requestedBy,
          prNumber: meta.prNumber,
          prTitle,
          prUrl,
          status: "PENDING",
        },
      });

      await inngest.send({
        name: "review/pr.requested",
        data: {
          reviewId: review.id,
          repositoryId: action.targetRepoId,
          prNumber: meta.prNumber,
          userId: repository.userId, // repo owner's token for GitHub API calls
        },
      });
      break;
    }

    case "APPROVE_DISCUSSION": {
      const meta = action.metadata as { discussionId?: string } | null;
      if (meta?.discussionId) {
        await ctx.db.reviewThread.update({
          where: { id: meta.discussionId },
          data: { resolved: true },
        });
      }
      break;
    }
  }
}
async function notifyAdmins(
  ctx: { db: PrismaClient; user: { id: string } },
  teamId: string,
  action: { id: string; actionType: string; requestedBy: string },
) {
  const team = await ctx.db.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });

  // Get all admins and owners
  const admins = await ctx.db.teamMember.findMany({
    where: {
      teamId,
      role: { in: ["OWNER", "ADMIN"] },
    },
    select: { userId: true },
  });

  // Create notifications for each admin
  const requester = await ctx.db.user.findUnique({
    where: { id: action.requestedBy },
    select: { name: true },
  });

  const actionDescription = action.actionType.toLowerCase().replace("_", " ");

  for (const admin of admins) {
    // Don't notify the person who made the request
    if (admin.userId !== action.requestedBy) {
      await ctx.db.notification.create({
        data: {
          userId: admin.userId,
          type: "TEAM_MEMBER_ADDED",
          title: `Action requires approval in "${team?.name ?? "team"}"`,
          message: `${requester?.name ?? "A member"} has requested to ${actionDescription}. Please review and approve or reject.`,
          link: `/teams/${teamId}`,
        },
      });
    }
  }
}
