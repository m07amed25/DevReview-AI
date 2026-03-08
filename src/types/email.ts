// ============================================
// Email Notification Types
// ============================================

// Base email interface
export interface BaseEmailParams {
  to: string;
  subject: string;
}

// ============================================
// Team Addition Email Types
// ============================================

export interface TeamMemberAddedEmailParams {
  to: string;
  inviteeName: string;
  inviteeEmail: string;
  inviterName: string;
  inviterEmail: string;
  teamName: string;
  teamId: string;
  teamSlug: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  teamUrl: string;
}

// ============================================
// Review Completion Email Types
// ============================================

export interface ReviewStatus {
  status: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED";
  label: string;
  color: string;
}

export interface ReviewCompletionEmailParams {
  to: string;
  recipientName: string;
  reviewerName: string;
  reviewerEmail: string;
  prTitle: string;
  prNumber: number;
  prUrl: string;
  repositoryName: string;
  repositoryFullName: string;
  reviewStatus: ReviewStatus;
  summary?: string;
  issuesFound?: number;
  viewReviewUrl: string;
}

// ============================================
// Email Service Result Types
// ============================================

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailServiceConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

// ============================================
// Environment Variable Types (for .env)
// ============================================

export interface EmailEnvConfig {
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  SMTP_FROM_NAME: string;
  APP_URL: string;
}

// ============================================
// Default Review Statuses
// ============================================

export const REVIEW_STATUS_CONFIG: Record<string, ReviewStatus> = {
  APPROVED: {
    status: "APPROVED",
    label: "Approved",
    color: "#10b981", // green
  },
  CHANGES_REQUESTED: {
    status: "CHANGES_REQUESTED",
    label: "Changes Requested",
    color: "#f59e0b", // amber
  },
  COMMENTED: {
    status: "COMMENTED",
    label: "Commented",
    color: "#6366f1", // indigo
  },
};
