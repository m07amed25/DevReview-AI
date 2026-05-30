-- AlterTable
ALTER TABLE "pricing_plan" ADD COLUMN IF NOT EXISTS "cta" TEXT;
ALTER TABLE "pricing_plan" ADD COLUMN IF NOT EXISTS "badge" TEXT;
