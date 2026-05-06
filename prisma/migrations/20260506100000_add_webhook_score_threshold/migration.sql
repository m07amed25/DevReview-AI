-- AlterTable
-- Adds an optional numeric risk-score threshold to webhook_config.
-- When set, reviews with riskScore >= scoreThreshold will fail the GitHub
-- branch-protection status check instead of using the default heuristic.
ALTER TABLE "webhook_config" ADD COLUMN "scoreThreshold" INTEGER;
