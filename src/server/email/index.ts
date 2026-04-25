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
  sendGithubConnectionWarningEmail,
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

export type {
  TeamMemberAddedEmailParams,
  ReviewCompletionEmailParams,
  GithubConnectionWarningEmailParams,
  ReviewStatus,
  EmailSendResult,
  EmailServiceConfig,
} from "@/types/email";

export { REVIEW_STATUS_CONFIG } from "@/types/email";
