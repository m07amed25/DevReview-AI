-- AlterTable
ALTER TABLE "Review" ADD COLUMN "resolvedComments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
