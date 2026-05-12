-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "bannerEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "bannerText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "bannerLink" TEXT NOT NULL DEFAULT '';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "bannerLinkText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "bannerColor" TEXT NOT NULL DEFAULT 'indigo';
