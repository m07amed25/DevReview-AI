-- AlterEnum: add new notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REVIEW_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REVIEW_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REVIEW_CHANGES_REQUESTED';

-- CreateEnum
CREATE TYPE "ReviewApprovalState" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'COMMENTED');
CREATE TYPE "AssignmentPriority"  AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "AssignmentStatus"    AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable: ReviewThreadCommentReaction
CREATE TABLE IF NOT EXISTS "review_thread_comment_reaction" (
    "id"        TEXT            NOT NULL,
    "commentId" TEXT            NOT NULL,
    "userId"    TEXT            NOT NULL,
    "emoji"     VARCHAR(10)     NOT NULL,
    "createdAt" TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_thread_comment_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ReviewApproval
CREATE TABLE IF NOT EXISTS "review_approval" (
    "id"        TEXT                   NOT NULL,
    "reviewId"  TEXT                   NOT NULL,
    "userId"    TEXT                   NOT NULL,
    "state"     "ReviewApprovalState"  NOT NULL,
    "body"      TEXT,
    "createdAt" TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ReviewAssignment
CREATE TABLE IF NOT EXISTS "review_assignment" (
    "id"         TEXT                  NOT NULL,
    "reviewId"   TEXT                  NOT NULL,
    "assigneeId" TEXT                  NOT NULL,
    "assignedBy" TEXT                  NOT NULL,
    "dueDate"    TIMESTAMP(3),
    "priority"   "AssignmentPriority"  NOT NULL DEFAULT 'MEDIUM',
    "status"     "AssignmentStatus"    NOT NULL DEFAULT 'PENDING',
    "note"       TEXT,
    "createdAt"  TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: ReviewThreadCommentReaction
CREATE UNIQUE INDEX IF NOT EXISTS "review_thread_comment_reaction_commentId_userId_emoji_key"
    ON "review_thread_comment_reaction"("commentId", "userId", "emoji");
CREATE INDEX IF NOT EXISTS "review_thread_comment_reaction_commentId_idx"
    ON "review_thread_comment_reaction"("commentId");

-- CreateIndex: ReviewApproval
CREATE UNIQUE INDEX IF NOT EXISTS "review_approval_reviewId_userId_key"
    ON "review_approval"("reviewId", "userId");
CREATE INDEX IF NOT EXISTS "review_approval_reviewId_idx" ON "review_approval"("reviewId");
CREATE INDEX IF NOT EXISTS "review_approval_userId_idx"   ON "review_approval"("userId");

-- CreateIndex: ReviewAssignment
CREATE UNIQUE INDEX IF NOT EXISTS "review_assignment_reviewId_assigneeId_key"
    ON "review_assignment"("reviewId", "assigneeId");
CREATE INDEX IF NOT EXISTS "review_assignment_reviewId_idx"   ON "review_assignment"("reviewId");
CREATE INDEX IF NOT EXISTS "review_assignment_assigneeId_idx" ON "review_assignment"("assigneeId");

-- AddForeignKey: ReviewThreadCommentReaction
ALTER TABLE "review_thread_comment_reaction"
    ADD CONSTRAINT "review_thread_comment_reaction_commentId_fkey"
    FOREIGN KEY ("commentId") REFERENCES "ReviewThreadComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_thread_comment_reaction"
    ADD CONSTRAINT "review_thread_comment_reaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ReviewApproval
ALTER TABLE "review_approval"
    ADD CONSTRAINT "review_approval_reviewId_fkey"
    FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_approval"
    ADD CONSTRAINT "review_approval_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ReviewAssignment
ALTER TABLE "review_assignment"
    ADD CONSTRAINT "review_assignment_reviewId_fkey"
    FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_assignment"
    ADD CONSTRAINT "review_assignment_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_assignment"
    ADD CONSTRAINT "review_assignment_assignedBy_fkey"
    FOREIGN KEY ("assignedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

