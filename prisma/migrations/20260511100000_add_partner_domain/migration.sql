-- CreateTable
CREATE TABLE "partner_domain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "overrideMonthlyPrice" DOUBLE PRECISION,
    "overrideYearlyPrice" DOUBLE PRECISION,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_domain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_domain_domain_key" ON "partner_domain"("domain");
CREATE INDEX "partner_domain_domain_idx" ON "partner_domain"("domain");
CREATE INDEX "partner_domain_active_idx" ON "partner_domain"("active");
