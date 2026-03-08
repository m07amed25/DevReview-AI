import {
  sendReviewCompletedEmail,
  getAppUrl,
  REVIEW_STATUS_CONFIG,
} from "../index";
import type { PrismaClient } from "@/server/db/client";

/**
 * Integration utilities for review-related email notifications
 * These functions can be called from your review router or Inngest functions
 */

interface SendReviewCompletedEmailParams {
  db: PrismaClient;
  reviewId: string;
}

/**
 * Send a review completed notification email
 * Call this after a review is completed (status changed to COMPLETED)
 *
 * @example
 * // In your Inngest function or review router:
 * await sendReviewCompletedEmailNotification({
 *   db: prismaClient,
 *   reviewId: review.id,
 * });
 */
export async function sendReviewCompletedEmailNotification({
  db,
  reviewId,
}: SendReviewCompletedEmailParams): Promise<void> {
  try {
    // Get the review with related data
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        repository: {
          select: { fullName: true, name: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!review) {
      console.warn(
        `⚠️  Cannot send review completed email: review ${reviewId} not found`,
      );
      return;
    }

    if (!review.user?.email) {
      console.warn(
        `⚠️  Cannot send review completed email: reviewer has no email`,
      );
      return;
    }

    // Determine review status based on the review data
    const reviewStatus = determineReviewStatus(review.status);

    // Count issues from comments (if available)
    const comments = review.comments as Array<{ issues?: unknown[] }> | null;
    const issuesFound =
      comments?.reduce((acc, c) => acc + (c.issues?.length ?? 0), 0) ?? 0;

    const appUrl = getAppUrl();

    // Send the email
    const result = await sendReviewCompletedEmail({
      to: review.user.email,
      recipientName: review.user.name || "Developer",
      reviewerName: review.user.name || "Reviewer",
      reviewerEmail: review.user.email,
      prTitle: review.prTitle,
      prNumber: review.prNumber,
      prUrl: review.prUrl,
      repositoryName: review.repository.name,
      repositoryFullName: review.repository.fullName,
      reviewStatus,
      summary: review.summary || undefined,
      issuesFound,
      viewReviewUrl: `${appUrl}/reviews/${review.id}`,
    });

    if (!result.success) {
      console.error(
        `❌ Failed to send review completed email to ${review.user.email}:`,
        result.error,
      );
    }
  } catch (error) {
    // Don't throw - email sending should not block the main operation
    console.error("❌ Error in sendReviewCompletedEmailNotification:", error);
  }
}

/**
 * Determine review status from review data
 * This is a simple implementation - adjust based on your actual review model
 */
function determineReviewStatus(status: string) {
  // Map Prisma ReviewStatus to our email status
  switch (status) {
    case "COMPLETED":
      // For completed, we default to COMMENTED - you might want to determine
      // APPROVED vs CHANGES_REQUESTED based on quality metrics or comments
      return REVIEW_STATUS_CONFIG.COMMENTED;
    case "FAILED":
      return REVIEW_STATUS_CONFIG.COMMENTED;
    case "PENDING":
    case "PROCESSING":
      // These shouldn't trigger completion emails
      return REVIEW_STATUS_CONFIG.COMMENTED;
    default:
      return REVIEW_STATUS_CONFIG.COMMENTED;
  }
}

/**
 * Alternative: Send review completed email with explicit parameters
 * Use this when you have all the data available
 */
interface SendReviewCompletedEmailExplicitParams {
  to: string;
  recipientName: string;
  reviewerName: string;
  reviewerEmail: string;
  prTitle: string;
  prNumber: number;
  prUrl: string;
  repositoryName: string;
  repositoryFullName: string;
  reviewStatus: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED";
  summary?: string;
  issuesFound?: number;
  reviewId: string;
}

/**
 * Send a review completed notification with explicit parameters
 */
export async function sendReviewCompletedEmailExplicit({
  to,
  recipientName,
  reviewerName,
  reviewerEmail,
  prTitle,
  prNumber,
  prUrl,
  repositoryName,
  repositoryFullName,
  reviewStatus,
  summary,
  issuesFound = 0,
  reviewId,
}: SendReviewCompletedEmailExplicitParams): Promise<void> {
  try {
    const appUrl = getAppUrl();

    const statusConfig =
      REVIEW_STATUS_CONFIG[reviewStatus] || REVIEW_STATUS_CONFIG.COMMENTED;

    const result = await sendReviewCompletedEmail({
      to,
      recipientName,
      reviewerName,
      reviewerEmail,
      prTitle,
      prNumber,
      prUrl,
      repositoryName,
      repositoryFullName,
      reviewStatus: statusConfig,
      summary,
      issuesFound,
      viewReviewUrl: `${appUrl}/reviews/${reviewId}`,
    });

    if (!result.success) {
      console.error(
        `❌ Failed to send review completed email to ${to}:`,
        result.error,
      );
    }
  } catch (error) {
    console.error("❌ Error in sendReviewCompletedEmailExplicit:", error);
  }
}

/**
 * Example usage in an Inngest function (review-pr.ts):
 *
 * import { sendReviewCompletedEmailNotification } from "@/server/email/integrations/review";
 *
 * // After completing a review:
 * await sendReviewCompletedEmailNotification({
 *   db: prisma,
 *   reviewId: review.id,
 * });
 *
 * Example usage in a review router:
 *
 * import { sendReviewCompletedEmailExplicit } from "@/server/email/integrations/review";
 *
 * // When updating review status:
 * await sendReviewCompletedEmailExplicit({
 *   to: authorEmail,
 *   recipientName: authorName,
 *   reviewerName: reviewerName,
 *   reviewerEmail: reviewerEmail,
 *   prTitle: pr.title,
 *   prNumber: pr.number,
 *   prUrl: pr.html_url,
 *   repositoryName: repo.name,
 *   repositoryFullName: repo.fullName,
 *   reviewStatus: "APPROVED",
 *   summary: reviewSummary,
 *   issuesFound: issues.length,
 *   reviewId: review.id,
 * });
 */
