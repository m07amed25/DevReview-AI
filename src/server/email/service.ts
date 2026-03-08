import nodemailer from "nodemailer";
import { getEmailTransporter, getFromAddress, getAppUrl } from "./transporter";
import { renderTeamMemberAddedEmail } from "./templates/team-member-added";
import { renderReviewCompletedEmail } from "./templates/review-completed";
import type {
  TeamMemberAddedEmailParams,
  ReviewCompletionEmailParams,
  EmailSendResult,
} from "@/types/email";

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
 * Send a test email to verify SMTP configuration
 */
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
