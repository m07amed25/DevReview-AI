-- CreateTable
CREATE TABLE IF NOT EXISTS "capability" (
    "id"          TEXT         NOT NULL,
    "key"         TEXT         NOT NULL,
    "label"       TEXT         NOT NULL,
    "description" TEXT,
    "kind"        TEXT         NOT NULL DEFAULT 'display',
    "sortOrder"   INTEGER      NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "plan_capability" (
    "planId"       TEXT    NOT NULL,
    "capabilityId" TEXT    NOT NULL,
    "enabled"      BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "plan_capability_pkey" PRIMARY KEY ("planId","capabilityId")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "capability_key_key" ON "capability"("key");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "plan_capability" ADD CONSTRAINT "plan_capability_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pricing_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "plan_capability" ADD CONSTRAINT "plan_capability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Seed the current capability catalog
INSERT INTO "capability" ("id","key","label","description","kind","sortOrder","updatedAt") VALUES
  ('cap_private_repos','private_repos','Private repositories','Connect and review private GitHub repositories.','enforced',0,NOW()),
  ('cap_team_collab','team_collaboration','Team collaboration','Create teams and invite members.','enforced',1,NOW()),
  ('cap_custom_rules','custom_review_rules','Custom review rules','Define custom AI review rules.','display',2,NOW()),
  ('cap_pr_inline','pr_inline_comments','PR inline comments','Inline AI comments on pull requests.','display',3,NOW()),
  ('cap_advanced_analytics','advanced_analytics','Advanced analytics','Access the analytics dashboard.','enforced',4,NOW()),
  ('cap_sso_saml','sso_saml','SSO / SAML','Single sign-on via SAML.','display',5,NOW()),
  ('cap_custom_webhooks','custom_webhooks','Custom webhooks','Configure custom outgoing webhooks.','display',6,NOW()),
  ('cap_audit_logs','audit_logs','Audit logs','Access organization audit logs.','display',7,NOW()),
  ('cap_dedicated_support','dedicated_support','Dedicated support','24/7 dedicated support.','display',8,NOW()),
  ('cap_sla','sla_99_9','99.9% SLA','Guaranteed uptime SLA.','display',9,NOW())
ON CONFLICT DO NOTHING;

-- Pro + Ultra capabilities
INSERT INTO "plan_capability" ("planId","capabilityId","enabled")
SELECT p."id", c."id", true
FROM "pricing_plan" p
CROSS JOIN "capability" c
WHERE p."id" IN ('pro','ultra','enterprise')
  AND c."key" IN ('private_repos','team_collaboration','custom_review_rules','pr_inline_comments')
ON CONFLICT DO NOTHING;

-- Ultra-only capabilities
INSERT INTO "plan_capability" ("planId","capabilityId","enabled")
SELECT p."id", c."id", true
FROM "pricing_plan" p
CROSS JOIN "capability" c
WHERE p."id" IN ('ultra','enterprise')
  AND c."key" IN ('advanced_analytics','sso_saml','custom_webhooks','audit_logs','dedicated_support','sla_99_9')
ON CONFLICT DO NOTHING;
