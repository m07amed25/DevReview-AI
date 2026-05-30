# Capabilities — Agent Guide

**Read this whenever you add a new feature or modify an existing one.**
Decide if the feature is plan-gated and, if so, wire it into the capability system below.

## Decision (do this first)

1. Does this feature behave differently per plan (Free / Pro / Ultra / Enterprise)?
   - **No** → nothing to do.
   - **Yes** → pick the kind:
     - **display** — advertised on pricing, no code gating (e.g. "Priority support").
     - **enforced** — must actually block access for plans that don't have it.

## How the system fits together

| Piece | Where |
| --- | --- |
| Capability catalog (`key`, `label`, `description`, `kind`, `sortOrder`) | `Capability` table → Admin ▸ Pricing ▸ **Capabilities** tab (or `/admin/capabilities`) |
| Per-plan on/off | `PlanCapability` join table (toggle matrix in the same UI) |
| Server enforcement | `checkFeature(db, userId, "<key>")` in `src/lib/capabilities.ts` (throws `FORBIDDEN`) |
| Client read (UI gating) | `trpc.profile.getCapabilities` → `{ key, label, kind, enabled }[]` |
| Public pricing comparison + admin matrix | Auto-render from the catalog — no code needed |

**The `key` string is the contract between the DB catalog and the code.** Keep it a stable slug.

## Checklist — NEW feature

- [ ] Choose a stable `key` (e.g. `api_access`).
- [ ] Create the capability: in the admin UI, **or** add it to the seed migration
      `prisma/migrations/20260530120000_add_capabilities/migration.sql` (key, label, kind, per-plan rows).
- [ ] If **enforced**: add the key to `ENFORCED_CAPABILITIES` (`src/lib/capabilities.ts`), then
      gate the action:
      ```ts
      import { checkFeature } from "@/lib/capabilities";
      await checkFeature(ctx.db, ctx.user.id, "api_access");   // throws FORBIDDEN
      ```
      In a **background job** (Inngest) or when you want to **degrade** instead of erroring, use the
      non-throwing `hasFeature(db, userId, key): Promise<boolean>` — see the inline-comments pipeline
      (`post-review-to-github`).
- [ ] Gate **every** server entry point, not just one. For a multi-procedure router,
      use a shared gated procedure (see `analyticsProcedure` in
      `src/server/api/routers/analytics/helpers.ts`).
- [ ] If UI gating: branch on `getCapabilities` (see `src/app/(dashboard)/analytics/page.tsx`
      and `src/components/dashboard-sidebar.tsx`).
- [ ] Verify (below).

## Checklist — EXISTING feature (audit)

- [ ] Is it advertised as plan-specific but **not** enforced? Either mark its capability
      `display` on purpose, or switch to `enforced` + add `checkFeature`.
- [ ] Are **all** entry points gated? (One ungated procedure = bypass.)
- [ ] Does the code's key string exactly match the catalog key? A mismatch means
      `checkFeature` treats it as ungated and **allows** it.

## Current catalog

- **enforced**: `private_repos` (`repository.connect`), `team_collaboration` (`team.create`),
  `advanced_analytics` (analytics router via `analyticsProcedure`), `custom_review_rules`
  (`rules.create`), `pr_inline_comments` (post-review pipeline — degrades, doesn't throw).
- **display** (marketing only — no per-user software feature to gate): `sso_saml` (admin-configured),
  `audit_logs` (admin page), `custom_webhooks` (the GitHub review webhook is core infra, not a
  premium outgoing-webhook feature), `dedicated_support`, `sla_99_9`.

Enforced keys are registered in `ENFORCED_CAPABILITIES` (`src/lib/capabilities.ts`); the contract
test `src/lib/capabilities.contract.test.ts` fails if any registered key isn't gated in code.

## Rules

- Server enforcement is authoritative; UI gating is UX only — never rely on UI alone.
- Unknown/missing key ⇒ `checkFeature` **allows** (treats as not gated). Never reference a key you haven't created.
- A new capability is **off** for any plan with no `PlanCapability` row.
- Changing a plan's capabilities revalidates `/pricing`; no deploy needed for display features.

## Verify

```bash
npx tsc --noEmit
npx eslint <changed-files>
npx jest            # checkFeature has unit tests in src/lib/capabilities.test.ts
```
Manual: a Free user hitting the gated action gets `403 FORBIDDEN`; a plan that has it succeeds.
