# DevReview AI — Feature Roadmap

---

## Phase 1 — Diagram Drawer ✦ `diagram-drawer`

**Goal:** AI-generated interactive architecture diagrams (use-case, class, database ERD) surfaced per repository, not per PR.

### What it does

- Analyze the codebase structure and generate diagrams using Mermaid or a React-based renderer (e.g. ReactFlow).
- Diagrams are interactive: clicking a node/edge shows a panel with details (description, file path, relationships).
- Smart trigger logic: diagrams are NOT regenerated on every PR — only when structural changes are detected (new models, new routes, schema changes, etc.).

### Implementation areas

- **`src/server/inngest/functions/generate-diagram.ts`** — already scaffolded; extend with diff-based trigger logic using `matchTriggerRules`.
- **`src/server/api/routers/diagram.ts`** — already exists; add procedures for fetching/storing diagram data.
- **`src/features/diagram/`** — UI components for rendering interactive diagrams with `ReactFlow` or `Mermaid`.
- **`prisma/schema.prisma`** — add `Diagram` model to store generated diagram JSON per repository.

### Key decisions

- Use Mermaid for simple ERD/class diagrams (zero dependency); use ReactFlow for interactive use-case / architecture diagrams.
- Trigger condition: rerun only when `prisma/schema.prisma`, model files, or route files have changed in a PR diff.
- Store rendered diagram as JSON in DB; cache until next trigger.

---

## Phase 2 — PR Review Quality Feedback Loop ✦ `review-feedback`

**Goal:** Let PR authors rate the usefulness of each AI review to improve prompt quality over time.

### What it does

- After a review completes, the author sees a thumbs-up / thumbs-down + optional comment widget.
- Ratings are stored and surfaced in the analytics dashboard as a "Review Quality" trend.
- Low-rated reviews are flagged for prompt tuning analysis.

### Implementation areas

- **`prisma/schema.prisma`** — add `ReviewFeedback` model: `reviewId`, `userId`, `rating (1|-1)`, `comment?`, `createdAt`.
- **`src/server/api/routers/review.ts`** — add `submitFeedback` and `getFeedbackStats` procedures.
- **`src/features/review/components/`** — add `FeedbackWidget` component rendered after review result.
- **`src/features/analytics/components/`** — add feedback trend chart to the analytics dashboard.

### Key decisions

- One feedback entry per user per review (upsert).
- Feedback is anonymous to teammates but visible to repo owners in analytics.

---

## Phase 3 — Custom Review Rules / Rulesets ✦ `custom-rules`

**Goal:** Allow teams to define their own code rules that the AI checks in addition to its default analysis.

### What it does

- Teams create named rules (e.g. "No hardcoded secrets", "Require JSDoc on exports", "No `console.log` in production code").
- Rules are stored per repository or per team.
- When a review runs, active rules are injected into the AI prompt as additional constraints.
- Violations are surfaced as a distinct "Custom Rule" category in the review result.

### Implementation areas

- **`prisma/schema.prisma`** — add `ReviewRule` model: `id`, `name`, `description`, `pattern?`, `severity`, `repositoryId?`, `teamId?`, `enabled`.
- **`src/server/api/routers/`** — add `rules.ts` router with CRUD procedures.
- **`src/server/services/ai.ts`** — extend `ReviewPreferences` to accept active rules and inject them into the system prompt.
- **`src/features/settings/components/`** — add rules management UI (create, edit, enable/disable, delete).

### Key decisions

- Rules can be text-based (description only, AI interprets) or regex-based (exact pattern match pre-AI).
- Repository-level rules override team-level rules for the same `name`.

---

## Phase 4 — Review History Diff & Re-run ✦ `review-diff`

**Goal:** Compare two review runs on the same PR to show what was fixed and what's new.

### What it does

- Each review result stores a snapshot of findings.
- A "Compare" view shows a three-state diff: Fixed ✅ / Persisted ⚠️ / New 🆕.
- A "Re-review" button triggers a new review and automatically opens the diff view when complete.

### Implementation areas

- **`prisma/schema.prisma`** — findings are already stored as JSON; add `parentReviewId` FK on `Review` to chain runs.
- **`src/server/api/routers/review.ts`** — add `getDiff(reviewId, compareReviewId)` procedure that diffs findings arrays.
- **`src/features/review/components/`** — add `ReviewDiffPanel` component with color-coded three-state list.
- **`src/app/(dashboard)/repo/[id]/pr/[prNumber]/`** — add "Re-review" button and diff view toggle.

### Key decisions

- Diff is computed server-side by matching findings on `(file, line, message)` fingerprint.
- A review with a `parentReviewId` automatically links in the UI timeline.

---

## Phase 5 — Slack / Discord Webhook Notifications ✦ `external-notifications`

**Goal:** Post review summaries to a team Slack or Discord channel when a review completes.

### What it does

- Teams configure a webhook URL (Slack incoming webhook or Discord webhook) per repository or per team.
- When `review/pr.completed` fires, a formatted summary is posted: PR title, risk score, severity breakdown, deep link.
- Optionally restrict to only notify on high-severity reviews.

### Implementation areas

- **`prisma/schema.prisma`** — add `WebhookConfig` model: `id`, `type (SLACK|DISCORD)`, `url`, `teamId?`, `repositoryId?`, `onlyHighSeverity`, `enabled`.
- **`src/server/inngest/functions/post-review-to-github.ts`** — add a sibling `post-review-to-webhook.ts` Inngest function triggered by `review/pr.completed`.
- **`src/server/api/routers/`** — add `webhooks.ts` router for CRUD on webhook configs.
- **`src/features/settings/components/`** — add Webhook settings card (add/test/delete webhooks).

### Key decisions

- Webhook URLs are encrypted at rest using the existing Prisma setup.
- A "Test" button fires a sample payload so users can verify before enabling.
- Rate-limit webhook delivery per repository to avoid flooding on bulk re-scans.

---

## Phase 6 — PR Review Templates ✦ `review-templates`

**Goal:** Let teams focus AI reviews on specific concerns by selecting a template when triggering a review.

### What it does

- Built-in templates: Security Review, Performance Review, API Contract Review, Accessibility Review.
- Teams can create custom templates with a name, focus areas, and tone.
- Template is selected in the "Trigger Review" dialog on the PR page.
- Selected template is injected as a system-prompt modifier alongside custom rules (Phase 3).

### Implementation areas

- **`prisma/schema.prisma`** — add `ReviewTemplate` model: `id`, `name`, `focusAreas (String[])`, `systemPromptAddition`, `isBuiltIn`, `teamId?`.
- **`src/server/services/ai.ts`** — extend `ReviewPreferences` with `templateId?`; load and apply template prompt additions.
- **`src/server/api/routers/review.ts`** — accept `templateId` in `trigger` input.
- **`src/features/repo/`** — update the trigger review dialog to show template selector.

### Key decisions

- Built-in templates are seeded at app start (not stored in DB).
- Custom templates are scoped to a team; personal templates scoped to a user.

---

## Phase 7 — Stale PR Detection & Nudges ✦ `stale-pr-nudge`

**Goal:** Automatically detect PRs with no activity for N days and send nudge notifications.

### What it does

- Extend the existing scheduled Inngest scan (`scheduled-scan.ts`) to check PR age and last-activity date.
- If a PR has been open > configured threshold (default: 7 days) with no new commits or comments, send a notification.
- Notification targets: PR author + assigned reviewers. Delivered via in-app notifications and email.

### Implementation areas

- **`src/server/inngest/functions/scheduled-scan.ts`** — add stale-PR detection step after the existing scan logic.
- **`src/server/api/routers/automation.ts`** — add `getStalePRs` procedure and configurable threshold per repository.
- **`src/server/email/`** — add stale-PR email template.
- **`prisma/schema.prisma`** — add `stalePrThresholdDays` field to `ScheduledScanConfig`.

### Key decisions

- A PR is only nudged once per stale window — track `lastNudgedAt` on the PR record to avoid spam.
- Nudge threshold is configurable per repository in the settings page.

---

## Phase 8 — Code Smell Trending ✦ `smell-trending`

**Goal:** Track and visualize which issue categories recur most across reviews over time.

### What it does

- After each completed review, aggregate findings by category (security, performance, style, maintainability, etc.).
- Surface a "Top Recurring Issues" widget in the analytics dashboard.
- Show trend lines: is a category improving or worsening over time?

### Implementation areas

- **`prisma/schema.prisma`** — add `ReviewFindingSummary` model: `reviewId`, `category`, `severity`, `count`, `date` — populated as a denormalized aggregate after each review.
- **`src/server/inngest/functions/review-pr.ts`** — after review completion, emit an Inngest step to write finding summaries.
- **`src/server/api/routers/analytics.ts`** — add `getSmellTrends` procedure (group by category + time bucket).
- **`src/features/analytics/components/`** — add `SmellTrendChart` and `TopRecurringIssues` components.

### Key decisions

- Categories are normalized server-side from the AI's free-text output using a category map.
- Trends are computed over the existing `timePeriod` filter already on the analytics page.

---

## Phase 9 — GitHub Status Check Gate ✦ `status-check-gate`

**Goal:** Block PR merges in GitHub when the AI risk score exceeds a team-configured threshold.

### What it does

- After a review completes, write a GitHub Checks API status (`success` / `failure`) back to the PR commit.
- Teams configure the maximum allowed risk score per repository (e.g. fail if score > 7).
- The status check name is `DevReview AI` and links back to the review detail page.

### Implementation areas

- **`src/server/services/github.ts`** — `postCommitStatus` already exists; extend to also call the Checks API with a detailed summary.
- **`src/server/inngest/functions/post-review-to-github.ts`** — already has `postCommitStatus` call; update to use threshold from `AutoReviewConfig`.
- **`prisma/schema.prisma`** — add `maxRiskScoreThreshold Int?` to `AutoReviewConfig` (or `ScheduledScanConfig`).
- **`src/features/settings/components/auto-review-toggle.tsx`** — add threshold slider UI.

### Key decisions

- Default threshold: disabled (no blocking) — opt-in per repository.
- When threshold is not set, always post a neutral informational status check.
- Failing status check includes a one-line summary: "Risk score 8.2 exceeds the 7.0 threshold. See review →".

---

## Phase 10 — Team Leaderboard ✦ `team-leaderboard`

**Goal:** Surface a lightweight leaderboard inside team pages to recognize code quality contributions.

### What it does

- Track per-member metrics: average risk score on their PRs, number of reviews completed, issues resolved rate.
- Show a ranked leaderboard card on the team detail page.
- Opt-out: team admins can disable the leaderboard for their team.

### Implementation areas

- **`src/server/api/routers/team.ts`** — add `getLeaderboard(teamId, timePeriod)` procedure that aggregates review stats per team member.
- **`src/features/teams/components/`** — add `LeaderboardCard` component with rank badges and animated counters.
- **`prisma/schema.prisma`** — no new models needed; query from existing `Review`, `Repository`, `TeamMember` relations.
- **`src/features/teams/types.ts`** — add `LeaderboardEntry` type.

### Key decisions

- Leaderboard uses the same `timePeriod` filter as analytics (7d / 30d / 90d).
- Metrics are read-only aggregates, never editable.
- Disabled by default; team admin toggles it on in team settings.
