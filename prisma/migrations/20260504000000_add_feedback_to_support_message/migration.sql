-- AlterTable
ALTER TABLE "support_message" ADD COLUMN "userId" TEXT,
ADD COLUMN "name" TEXT,
ADD COLUMN "subject" TEXT,
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'SUPPORT';
