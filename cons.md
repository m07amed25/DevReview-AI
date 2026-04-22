# DevReview AI — Project Constitution

**Version:** 1.0.0
**Ratification Date:** 2026-04-22
**Last Amended:** 2026-04-22

---

## 1. Project Identity

**DevReview AI** is an AI-powered code review platform that integrates with GitHub to automatically analyze pull requests for bugs, security vulnerabilities, and maintainability issues — before they reach production. It provides real-time collaboration, team management, analytics, and configurable automation for engineering teams of any size.

---

## 2. Core Principles

### 2.1 User Data Ownership

Every resource (repository, review, thread, notification) MUST be scoped to an authenticated user or team. No cross-user data leakage is permitted. All database queries MUST include ownership checks via `userId` or verified team membership before returning data.

### 2.2 Type Safety End-to-End

The project MUST maintain TypeScript strict mode across the entire stack. All API surface area MUST be typed via tRPC procedures with Zod input validation. Prisma-generated types are the single source of truth for database models. Casting with `as any` is a last resort and MUST be accompanied by a comment explaining why.

### 2.3 Security First

- All mutations MUST require authentication via `protectedProcedure`.
- User-controlled strings (e.g., comment keys, file paths) used in database operations MUST use parameterized queries (`$executeRaw` with template literals, never string concatenation).
- Rate limiting via Upstash Redis MUST be applied to all AI-invoking and write-heavy endpoints.
- GitHub tokens and secrets MUST never be logged or returned to the client.

### 2.4 Optimistic UI with Rollback

Client-side state changes that involve a server mutation MUST update local state immediately (optimistic update) and roll back to the previous state if the mutation fails. This applies to all toggle/mark operations (e.g., resolve comment, mark notification read).

### 2.5 AI Provider Agnosticism

The AI review logic MUST remain provider-agnostic. The `ai.ts` service is the single entry point for all AI calls. Adding or swapping providers (OpenAI, Gemini, Groq, Hugging Face) MUST NOT require changes outside of `src/server/services/ai.ts` and environment configuration.

### 2.6 Background Jobs for Long-Running Work

Operations that may exceed request timeouts (AI review processing, scheduled scans, webhook-triggered analysis) MUST be offloaded to Inngest background functions. Direct API route handlers MUST return quickly and delegate heavy work.

### 2.7 Real-Time via Pusher

Live features (collaborative review presence, notifications, review status updates) MUST use Pusher channels. Channel naming MUST follow the convention `private-{resource}-{id}` for authenticated channels.

### 2.8 Accessibility and Responsiveness

All UI components MUST be keyboard-navigable and screen-reader friendly. Interactive elements MUST have appropriate `role`, `tabIndex`, and `onKeyDown` handlers. Layouts MUST be responsive from 320px upward.

### 2.9 No Silent Failures

Every background job, webhook handler, and AI call MUST write structured error state back to the database (`status: FAILED`, `error: string`) so the UI can surface the failure to the user. Errors MUST NOT be swallowed silently.

### 2.10 Incremental Feature Delivery

New features (see `Plan.md`) MUST be implemented behind clear code boundaries and MUST NOT break existing routes or data models. Additive schema changes require migrations; destructive changes require discussion and a migration strategy.

---

## 3. Architecture Constraints

| Layer           | Technology               | Constraint                                                                      |
| --------------- | ------------------------ | ------------------------------------------------------------------------------- |
| Framework       | Next.js 16 App Router    | All pages use server/client components appropriately; no Pages Router           |
| API             | tRPC v11                 | All client↔server communication through tRPC; no raw `fetch` to internal routes |
| Database        | PostgreSQL + Prisma      | All schema changes via Prisma migrations; no raw DDL outside migrations         |
| Auth            | Better Auth              | Session validation via `auth()` helper; no custom JWT logic                     |
| Background      | Inngest                  | All async work via Inngest functions; no `setTimeout`/`setInterval` for jobs    |
| Styling         | Tailwind CSS + shadcn/ui | No inline styles; no CSS modules; utility classes only                          |
| Animations      | GSAP                     | Complex entrance/exit animations via GSAP; simple transitions via Tailwind      |
| Package Manager | pnpm                     | No npm or yarn usage; lockfile MUST be committed                                |

---

## 4. Data Model Invariants

- A `Review` belongs to exactly one `Repository` and one `User`.
- A `Repository` belongs to exactly one `User` and optionally one `Team`.
- `ReviewThread` and `ReviewThreadComment` form the collaborative annotation layer; they are separate from the AI-generated `Review.comments` JSON field.
- `Review.resolvedComments` stores stable comment keys of the form `${file}:${line}:${severity}:${category}` — this format MUST NOT change without a migration.
- `TeamMember.role` MUST be enforced at the API layer for all team-scoped mutations (OWNER can remove members, MEMBER cannot).

---

## 5. Code Quality Standards

- **Linting:** ESLint MUST pass with zero errors before merge. Warnings are permitted only for known unavoidable cases (e.g., `react-hooks/exhaustive-deps` with explicit comments).
- **Naming:** React components use PascalCase. Utility functions, hooks, and server-side helpers use camelCase. Prisma models and DB columns use snake_case in the DB, PascalCase in the schema.
- **File Structure:** Feature components live under `src/components/{feature}/`. Server logic lives under `src/server/{layer}/`. No business logic in route handlers or React components — delegate to tRPC routers and services.
- **Imports:** Absolute imports via `@/` alias only. No relative `../../` imports crossing feature boundaries.

---

## 6. Governance

### Amendment Procedure

1. Propose the change in a pull request with a description of the impacted principle(s) and rationale.
2. At least one team member review is required before merging.
3. Update `Last Amended` date and increment the version number per semantic versioning (MAJOR for principle removal/redefinition, MINOR for new principles, PATCH for clarifications).

### Versioning Policy

- `MAJOR`: Principle removed, renamed in a breaking way, or architectural constraint changed.
- `MINOR`: New principle or section added.
- `PATCH`: Wording clarification, typo fix, non-semantic update.

### Compliance

All new code MUST be reviewed against this constitution. Pull request reviewers are responsible for flagging violations. This document takes precedence over individual preferences.
