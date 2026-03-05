import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.EMAIL_FROM ?? "DEPI Code Review <onboarding@resend.dev>";

interface InviteEmailParams {
  to: string;
  inviteeName: string;
  inviterName: string;
  teamName: string;
  role: string;
  teamUrl: string;
}

export async function sendTeamInviteEmail({
  to,
  inviteeName,
  inviterName,
  teamName,
  role,
  teamUrl,
}: InviteEmailParams) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You've been added to the "${teamName}" team`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111;">You're now part of <strong>${teamName}</strong></h2>
        <p style="color: #333; line-height: 1.6;">
          Hi ${inviteeName || "there"},
        </p>
        <p style="color: #333; line-height: 1.6;">
          <strong>${inviterName}</strong> has added you to the
          <strong>${teamName}</strong> team as a <strong>${role}</strong>.
        </p>
        <p style="color: #333; line-height: 1.6;">
          You can view the team and start collaborating right away:
        </p>
        <a
          href="${teamUrl}"
          style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; border-radius: 6px; text-decoration: none; margin-top: 8px;"
        >
          Go to team
        </a>
        <p style="color: #888; font-size: 13px; margin-top: 32px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send invite email:", error);
  }
}
