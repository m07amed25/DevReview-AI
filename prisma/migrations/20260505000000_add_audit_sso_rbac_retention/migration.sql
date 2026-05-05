-- CreateEnum
CREATE TYPE "SsoType" AS ENUM ('OIDC', 'SAML');

-- AlterTable: extend SystemSettings with retention policy fields
ALTER TABLE "system_settings"
  ADD COLUMN IF NOT EXISTS "reviewRetentionDays"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "auditLogRetentionDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sessionRetentionDays"  INTEGER NOT NULL DEFAULT 0;

-- CreateTable: AuditLog
CREATE TABLE IF NOT EXISTS "audit_log" (
    "id"         TEXT NOT NULL,
    "actorId"    TEXT,
    "action"     TEXT NOT NULL,
    "resource"   TEXT,
    "resourceId" TEXT,
    "ipAddress"  TEXT,
    "userAgent"  TEXT,
    "country"    TEXT,
    "city"       TEXT,
    "metadata"   JSONB,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SsoProvider
CREATE TABLE IF NOT EXISTS "sso_provider" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "type"         "SsoType" NOT NULL,
    "enabled"      BOOLEAN NOT NULL DEFAULT false,
    "issuer"       TEXT,
    "clientId"     TEXT,
    "clientSecret" TEXT,
    "entryPoint"   TEXT,
    "certificate"  TEXT,
    "emailDomain"  TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sso_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CustomRole
CREATE TABLE IF NOT EXISTS "custom_role" (
    "id"                    TEXT NOT NULL,
    "name"                  TEXT NOT NULL,
    "description"           TEXT,
    "canViewReviews"        BOOLEAN NOT NULL DEFAULT true,
    "canTriggerReviews"     BOOLEAN NOT NULL DEFAULT false,
    "canManageRepositories" BOOLEAN NOT NULL DEFAULT false,
    "canManageTeams"        BOOLEAN NOT NULL DEFAULT false,
    "canViewAnalytics"      BOOLEAN NOT NULL DEFAULT false,
    "canManageUsers"        BOOLEAN NOT NULL DEFAULT false,
    "canAccessAdmin"        BOOLEAN NOT NULL DEFAULT false,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserCustomRole
CREATE TABLE IF NOT EXISTS "user_custom_role" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "roleId"     TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_custom_role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_log_actorId_idx" ON "audit_log"("actorId");
CREATE INDEX IF NOT EXISTS "audit_log_action_idx"  ON "audit_log"("action");
CREATE INDEX IF NOT EXISTS "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "custom_role_name_key" ON "custom_role"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_custom_role_userId_roleId_key" ON "user_custom_role"("userId", "roleId");
CREATE INDEX IF NOT EXISTS "user_custom_role_userId_idx" ON "user_custom_role"("userId");
CREATE INDEX IF NOT EXISTS "user_custom_role_roleId_idx" ON "user_custom_role"("roleId");

-- AddForeignKey
ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_custom_role"
  ADD CONSTRAINT "user_custom_role_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_custom_role"
  ADD CONSTRAINT "user_custom_role_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "custom_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default RBAC roles
INSERT INTO "custom_role" ("id", "name", "description", "canViewReviews", "canTriggerReviews", "canManageRepositories", "canManageTeams", "canViewAnalytics", "canManageUsers", "canAccessAdmin", "updatedAt")
VALUES
  ('role_viewer',   'Viewer',   'Can view reviews and repositories', true,  false, false, false, false, false, false, CURRENT_TIMESTAMP),
  ('role_reviewer', 'Reviewer', 'Can view and trigger reviews',      true,  true,  false, false, false, false, false, CURRENT_TIMESTAMP),
  ('role_manager',  'Manager',  'Full access except user management',true,  true,  true,  true,  true,  false, false, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
