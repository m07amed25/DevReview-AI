// Email module exports
// This module provides email notification functionality using nodemailer and react-email

// Transporter configuration
export {
  createEmailTransporter,
  verifyEmailConnection,
  getFromAddress,
  getAppUrl,
  getEmailTransporter,
} from "./transporter";

// Email service functions
export {
  sendTeamMemberAddedEmail,
  sendReviewCompletedEmail,
  sendTestEmail,
} from "./service";

// Integration utilities for team notifications
export { sendTeamInviteEmailNotification } from "./integrations/team";

// Integration utilities for review notifications
export {
  sendReviewCompletedEmailNotification,
  sendReviewCompletedEmailExplicit,
} from "./integrations/review";

// Email templates (for custom rendering if needed)
export {
  TeamMemberAddedEmail,
  renderTeamMemberAddedEmail,
} from "./templates/team-member-added";
export {
  ReviewCompletedEmail,
  renderReviewCompletedEmail,
} from "./templates/review-completed";

// Types
export type {
  TeamMemberAddedEmailParams,
  ReviewCompletionEmailParams,
  ReviewStatus,
  EmailSendResult,
  EmailServiceConfig,
} from "@/types/email";

export { REVIEW_STATUS_CONFIG } from "@/types/email";
