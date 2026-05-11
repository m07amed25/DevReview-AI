import { getEmailTransporter, getFromAddress, getAppUrl } from "./transporter";
import { renderTeamMemberAddedEmail } from "./templates/team-member-added";
import { renderReviewCompletedEmail } from "./templates/review-completed";
import { renderGithubConnectionWarningEmail } from "./templates/github-connection-warning";
import { renderSupportReplyEmail } from "./templates/support-reply";
import { renderAdminPromotedEmail } from "./templates/admin-promoted";
import { renderAdminDemotedEmail } from "./templates/admin-demoted";
import { renderSecurityAlertEmail } from "./templates/security-alert";
import { renderPasswordResetEmail } from "./templates/password-reset";
import type {
  TeamMemberAddedEmailParams,
  ReviewCompletionEmailParams,
  GithubConnectionWarningEmailParams,
  SupportReplyEmailParams,
  AdminPromotedEmailParams,
  AdminDemotedEmailParams,
  SecurityAlertEmailParams,
  EmailSendResult,
} from "@/types/email";

export interface PasswordResetEmailParams {
  to: string;
  userName: string;
  resetUrl: string;
}

/**
 * Send an email using nodemailer
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<EmailSendResult> {
  const transporter = getEmailTransporter();
  const fromAddress = getFromAddress();

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to ${to}:`, info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);

    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      console.warn("⚠️  SMTP not configured. Email logged but not sent.", {
        to,
        subject,
      });
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Send team member added notification email
 */
export async function sendTeamMemberAddedEmail(
  params: TeamMemberAddedEmailParams,
): Promise<EmailSendResult> {
  const { to, teamName } = params;
  const appUrl = getAppUrl();

  try {
    // Generate HTML content using react-email
    const html = await renderTeamMemberAddedEmail(params);

    const subject = `You've been added to the "${teamName}" team`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating team member added email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send review completed notification email
 */
export async function sendReviewCompletedEmail(
  params: ReviewCompletionEmailParams,
): Promise<EmailSendResult> {
  const { to, prNumber, reviewStatus } = params;

  try {
    // Generate HTML content using react-email
    const html = await renderReviewCompletedEmail(params);

    const subject = `Review completed for PR #${prNumber} - ${reviewStatus.label}`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating review completed email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send GitHub connection warning email
 */
export async function sendGithubConnectionWarningEmail(
  params: GithubConnectionWarningEmailParams,
): Promise<EmailSendResult> {
  const { to } = params;

  try {
    const html = await renderGithubConnectionWarningEmail(params);
    const subject = `Action Required: Connect GitHub to DEPI Code Review`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error(
      "❌ Error generating GitHub connection warning email:",
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send support reply email
 */
export async function sendSupportReplyEmail(
  params: SupportReplyEmailParams,
): Promise<EmailSendResult> {
  const { to } = params;

  try {
    const html = await renderSupportReplyEmail(params);
    const subject = `Re: Support Inquiry Response - DEPI Code Review`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating support reply email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

export async function sendAdminPromotedEmail(
  params: AdminPromotedEmailParams,
): Promise<EmailSendResult> {
  const { to } = params;

  try {
    const html = await renderAdminPromotedEmail(params);
    const subject = `Congratulations! You've been promoted to Admin - DEPI Code Review`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating admin promoted email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

export async function sendAdminDemotedEmail(
  params: AdminDemotedEmailParams,
): Promise<EmailSendResult> {
  const { to } = params;

  try {
    const html = await renderAdminDemotedEmail(params);
    const subject = `Administrator privileges revoked - DEPI Code Review`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating admin demoted email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

export async function sendTestEmail(to: string): Promise<EmailSendResult> {
  const appUrl = getAppUrl();

  const testHtml = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111;">Test Email from DEPI Code Review</h2>
      <p style="color: #333; line-height: 1.6;">
        This is a test email to verify your SMTP configuration is working correctly.
      </p>
      <p style="color: #333; line-height: 1.6;">
        If you're receiving this email, your email notifications are set up properly!
      </p>
      <a
        href="${appUrl}"
        style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; border-radius: 6px; text-decoration: none; margin-top: 8px;"
      >
        Go to App
      </a>
    </div>
  `;

  return sendEmail(to, "Test Email - DEPI Code Review", testHtml);
}

/**
 * Send security alert email when critical/high severity issues are found
 */
export async function sendSecurityAlertEmail(
  params: SecurityAlertEmailParams,
): Promise<EmailSendResult> {
  const { to, repositoryName, prNumber, criticalCount, highCount } = params;

  try {
    const html = await renderSecurityAlertEmail(params);

    const severityLabel =
      criticalCount > 0
        ? `${criticalCount} critical${highCount > 0 ? ` & ${highCount} high` : ""}`
        : `${highCount} high`;

    const subject = `⚠️ Security Alert: ${severityLabel} issue${criticalCount + highCount !== 1 ? "s" : ""} in ${repositoryName} PR #${prNumber}`;

    return await sendEmail(to, subject, html);
  } catch (error) {
    console.error("❌ Error generating security alert email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  params: PasswordResetEmailParams,
): Promise<EmailSendResult> {
  const { to, userName, resetUrl } = params;

  try {
    const html = await renderPasswordResetEmail(userName, resetUrl);
    return await sendEmail(to, "Reset your DevReview AI password", html);
  } catch (error) {
    console.error("❌ Error generating password reset email:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate email",
    };
  }
}
