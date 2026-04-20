export {
  createEmailTransporter,
  verifyEmailConnection,
  getFromAddress,
  getAppUrl,
  getEmailTransporter,
} from "./transporter";

export {
  sendTeamMemberAddedEmail,
  sendReviewCompletedEmail,
  sendTestEmail,
} from "./service";

export { sendTeamInviteEmailNotification } from "./integrations/team";

export {
  sendReviewCompletedEmailNotification,
  sendReviewCompletedEmailExplicit,
} from "./integrations/review";

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
