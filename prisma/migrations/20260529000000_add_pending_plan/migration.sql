-- AlterTable
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "pendingPlanId" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "pendingBillingCycle" TEXT;
