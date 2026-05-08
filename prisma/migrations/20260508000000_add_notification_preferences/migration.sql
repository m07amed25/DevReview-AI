-- AlterTable
ALTER TABLE "user" ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "notifyTeamInvites" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "notifyTeamMemberAdded" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "notifyReviewCompleted" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "notifyReviewFailed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "notifyScheduledScanCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN "notifyReviewAssigned" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "notifyReviewApproved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "notifyReviewChangesRequested" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "notificationSoundEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN "desktopNotifications" BOOLEAN NOT NULL DEFAULT true;
