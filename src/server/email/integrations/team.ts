import { sendTeamMemberAddedEmail, getAppUrl } from "../index";
import type { PrismaClient } from "@/server/db/client";

/**
 * Integration utilities for team-related email notifications
 * These functions can be called from your team router or other parts of the application
 */

interface SendTeamInviteEmailParams {
  db: PrismaClient;
  teamId: string;
  invitedUserId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  inviterId: string;
}

/**
 * Send a team member added notification email
 * Call this after successfully adding a member to a team
 *
 * @example
 * // In your team router's inviteMember mutation:
 * const membership = await ctx.db.teamMember.create({ ... });
 * await sendTeamInviteEmailNotification({
 *   db: ctx.db,
 *   teamId: input.teamId,
 *   invitedUserId: user.id,
 *   role: input.role,
 *   inviterId: ctx.user.id,
 * });
 */
export async function sendTeamInviteEmailNotification({
  db,
  teamId,
  invitedUserId,
  role,
  inviterId,
}: SendTeamInviteEmailParams): Promise<void> {
  try {
    // Get the invited user
    const invitedUser = await db.user.findUnique({
      where: { id: invitedUserId },
      select: { name: true, email: true },
    });

    if (!invitedUser || !invitedUser.email) {
      console.warn(
        `⚠️  Cannot send team invite email: user ${invitedUserId} not found or has no email`,
      );
      return;
    }

    // Get the inviter
    const inviter = await db.user.findUnique({
      where: { id: inviterId },
      select: { name: true, email: true },
    });

    if (!inviter) {
      console.warn(
        `⚠️  Cannot send team invite email: inviter ${inviterId} not found`,
      );
      return;
    }

    // Get the team
    const team = await db.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, slug: true },
    });

    if (!team) {
      console.warn(
        `⚠️  Cannot send team invite email: team ${teamId} not found`,
      );
      return;
    }

    const appUrl = getAppUrl();

    // Send the email
    const result = await sendTeamMemberAddedEmail({
      to: invitedUser.email,
      inviteeName: invitedUser.name || "Team Member",
      inviteeEmail: invitedUser.email,
      inviterName: inviter.name || "Team Admin",
      inviterEmail: inviter.email || "",
      teamName: team.name,
      teamId: team.id,
      teamSlug: team.slug,
      role: role,
      teamUrl: `${appUrl}/teams/${team.slug}`,
    });

    if (!result.success) {
      console.error(
        `❌ Failed to send team invite email to ${invitedUser.email}:`,
        result.error,
      );
    }
  } catch (error) {
    // Don't throw - email sending should not block the main operation
    console.error("❌ Error in sendTeamInviteEmailNotification:", error);
  }
}

/**
 * Example usage in a team router (team.ts):
 *
 * import { sendTeamInviteEmailNotification } from "@/server/email/integrations/team";
 *
 * inviteMember: protectedProcedure
 *   .input(...)
 *   .mutation(async ({ ctx, input }) => {
 *     // ... existing logic to add member ...
 *
 *     const membership = await ctx.db.teamMember.create({
 *       data: {
 *         teamId: input.teamId,
 *         userId: user.id,
 *         role: input.role,
 *       },
 *       include: {
 *         user: {
 *           select: { id: true, name: true, email: true, image: true },
 *         },
 *       },
 *     });
 *
 *     // Send email notification (non-blocking)
 *     sendTeamInviteEmailNotification({
 *       db: ctx.db,
 *       teamId: input.teamId,
 *       invitedUserId: user.id,
 *       role: input.role,
 *       inviterId: ctx.user.id,
 *     });
 *
 *     return membership;
 *   }),
 */
