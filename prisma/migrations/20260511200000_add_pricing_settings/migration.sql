-- CreateTable
CREATE TABLE "pricing_settings" (
    "id"                   TEXT NOT NULL DEFAULT 'global',
    "pricingEnabled"       BOOLEAN NOT NULL DEFAULT true,
    "annualDiscount"       INTEGER NOT NULL DEFAULT 20,
    "trialDays"            INTEGER NOT NULL DEFAULT 14,
    "trialPlan"            TEXT NOT NULL DEFAULT 'pro',
    "gracePeriodDays"      INTEGER NOT NULL DEFAULT 3,
    "refundEnabled"        BOOLEAN NOT NULL DEFAULT true,
    "refundWindowDays"     INTEGER NOT NULL DEFAULT 14,
    "taxEnabled"           BOOLEAN NOT NULL DEFAULT false,
    "taxRate"              DOUBLE PRECISION NOT NULL DEFAULT 0,
    "promoCodesAtCheckout" BOOLEAN NOT NULL DEFAULT true,
    "freeSignupEnabled"    BOOLEAN NOT NULL DEFAULT true,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_settings_pkey" PRIMARY KEY ("id")
);

-- Seed the single global row
INSERT INTO "pricing_settings" ("id", "updatedAt") VALUES ('global', NOW())
ON CONFLICT ("id") DO NOTHING;
