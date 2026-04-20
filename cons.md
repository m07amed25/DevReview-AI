# DevReview AI — Project Constitution

> This document defines the guiding principles, conventions, and standards for the **DevReview AI** codebase. All contributors must follow these rules to maintain consistency and quality.

---

## 1. Project Overview

**DevReview AI** is an AI-powered code review platform that integrates with GitHub to catch bugs, security issues, and maintainability problems before they reach production. It supports team collaboration, real-time updates, and analytics.

- **Author:** Mohamed Reda
- **License:** MIT

---

## 2. Tech Stack

| Layer              | Technology                                    |
| ------------------ | --------------------------------------------- |
| Framework          | Next.js 16 (App Router)                       |
| Language           | TypeScript (strict mode)                      |
| Package Manager    | pnpm (with workspace support)                 |
| Database           | PostgreSQL + Prisma ORM 6.x                   |
| API Layer          | tRPC v11                                      |
| Authentication     | Better Auth (GitHub OAuth)                    |
| AI Providers       | Google Gemini, Groq, Hugging Face, OpenAI     |
| Real-time          | Pusher (server + client)                      |
| Background Jobs    | Inngest                                       |
| Rate Limiting      | Upstash Redis                                 |
| Styling            | Tailwind CSS 4 + shadcn/ui + Radix primitives |
| Animations         | GSAP                                          |
| Email              | Resend + React Email                          |
| File Storage       | Vercel Blob                                   |
| Validation         | Zod                                           |
| State / Data       | TanStack React Query (via tRPC bindings)      |

---

## 3. Project Structure

```
src/
├── app/                 # Next.js App Router (pages, layouts, API routes)
│   ├── (auth)/          # Public auth pages (sign-in, sign-up)
│   ├── (dashboard)/     # Protected dashboard (uses route groups)
│   └── api/             # API route handlers (auth, trpc, webhooks, etc.)
├── components/          # Reusable React components
│   ├── ui/              # shadcn/ui primitives (button, dialog, card…)
│   ├── animations/      # GSAP animation wrappers
│   ├── analytics/       # Analytics dashboard widgets
│   ├── home/            # Landing page sections
│   └── teams/           # Team management components
├── hooks/               # Custom React hooks
├── lib/                 # Client-side utilities (tRPC client, Pusher client, helpers)
├── server/              # Server-only code
│   ├── api/             # tRPC routers & rate-limiter
│   ├── auth/            # Better Auth configuration
│   ├── db/              # Prisma client instance
│   ├── email/           # Email templates (React Email)
│   ├── inngest/         # Background job definitions
│   ├── pusher/          # Pusher server instance
│   └── services/        # Business logic (AI providers, GitHub integration)
├── types/               # Shared TypeScript type definitions
prisma/
└── schema.prisma        # Database schema (single source of truth)
```

### Rules

- **Route groups** (`(auth)`, `(dashboard)`) are used for layout separation — never nest pages outside their designated group.
- **`src/server/`** must never be imported from client components. Use tRPC to bridge server ↔ client.
- **`src/lib/`** is for client-safe utilities only.
- **`src/components/ui/`** is managed by shadcn/ui — do not manually edit generated files. Customize through wrapper components.

---

## 4. Coding Standards

### TypeScript

- **Strict mode** is enabled (`"strict": true`). Never disable it.
- Use `@/*` path aliases for all imports (maps to `./src/*`).
- Prefer **interfaces** for object shapes and **type aliases** for unions/intersections.
- All functions interacting with external input must validate using **Zod** schemas.
- No `any` types. Use `unknown` and narrow appropriately.

### React & Next.js

- Default to **Server Components**. Only add `"use client"` when strictly required (interactivity, hooks, browser APIs).
- Use the **App Router** exclusively — no `pages/` directory.
- Co-locate page-specific components near their route; shared components go in `src/components/`.
- Layouts must not fetch data — use `page.tsx` or Server Components for data loading.

### Naming Conventions

| Item               | Convention                                | Example                      |
| ------------------ | ----------------------------------------- | ---------------------------- |
| Files (components) | `kebab-case.tsx`                          | `diff-viewer.tsx`            |
| Files (utilities)  | `kebab-case.ts`                           | `auth-client.ts`             |
| React components   | `PascalCase`                              | `DiffViewer`                 |
| Hooks              | `camelCase` prefixed with `use`           | `useTeam`                    |
| tRPC routers       | `camelCase`                               | `repository`, `pullRequest`  |
| Database models    | `PascalCase` (Prisma), `snake_case` (SQL) | `TeamMember` → `team_member` |
| Enums              | `UPPER_SNAKE_CASE` values                 | `PENDING`, `COMPLETED`       |
| Environment vars   | `UPPER_SNAKE_CASE`                        | `DATABASE_URL`               |

### Styling

- Use **Tailwind CSS** utility classes as the primary styling method.
- Use `cn()` helper (from `src/lib/utils.ts`) for conditional class merging.
- Use **CSS variables** defined in `globals.css` for theming — support both light and dark modes.
- No inline `style` attributes unless absolutely necessary (e.g., GSAP-driven animations).

---

## 5. API & Data Layer

### tRPC

- All client ↔ server communication goes through tRPC (except auth, webhooks, and file uploads).
- Routers live in `src/server/api/routers/`.
- Always use **protected procedures** for authenticated endpoints.
- Input validation is required on every procedure using Zod.
- Use `superjson` as the transformer for serialization.

### Prisma

- `schema.prisma` is the single source of truth for the database.
- Use `@@map()` to map model names to snake_case table names.
- Always add `@@index()` on foreign keys and frequently queried columns.
- Database migrations: use `prisma db push` in development, `prisma migrate` for production.
- Prisma Client output is at `src/server/db/client`.

### Rate Limiting

- All public-facing API routes must be rate-limited using Upstash Redis.
- Rate limiter config lives in `src/server/api/rate-limiter/`.

---

## 6. Authentication & Authorization

- **Better Auth** handles all authentication (session-based, GitHub OAuth).
- Auth config lives in `src/server/auth/`.
- Client auth utilities are in `src/lib/auth-client.ts`.
- Middleware (`src/middleware.ts`) handles auth error redirects.
- Team roles: `OWNER` > `ADMIN` > `MEMBER`. Enforce role checks on every team-related mutation.
- Team actions (invite, remove, role change) go through the `TeamAction` approval system.

---

## 7. Real-time & Background Jobs

### Pusher

- Server instance in `src/server/pusher/`, client in `src/lib/pusher/`.
- Used for live notifications and collaborative review features.
- Channel naming: `private-user-{userId}`, `private-team-{teamId}`.

### Inngest

- Background functions defined in `src/server/inngest/`.
- API route at `/api/inngest`.
- Use for: long-running AI reviews, email delivery, webhook processing.
- Every function must have idempotency safeguards.

---

## 8. Testing

- Test framework: **Jest**.
- Write tests for: tRPC routers, services, utility functions.
- Test files live next to the code they test (`*.test.ts` / `*.test.tsx`).
- AI service tests should use mocked responses — never call real AI APIs in tests.

---

## 9. Environment & Configuration

- All secrets go in `.env` (never committed — listed in `.gitignore`).
- At least **one AI provider key** is required for the app to function.
- Required variables are documented in `README.md` § Environment Variables Reference.
- Use `zod` to validate env vars at startup where possible.

---

## 10. Git & Contribution Workflow

### Branching

- `main` — stable, production-ready code.
- `dev` — integration branch for features.
- Feature branches: `feat/<short-description>`
- Bug fixes: `fix/<short-description>`
- Hotfixes: `hotfix/<short-description>`

### Commits

Follow **Conventional Commits**:

```
feat: add team analytics dashboard
fix: resolve race condition in review status update
chore: upgrade Prisma to 6.19
docs: update API routes table in README
```

### Pull Requests

- Every PR must pass ESLint (`pnpm lint`) and TypeScript compilation (`pnpm build`).
- PRs should target `dev` (or `main` for hotfixes).
- Include a description of **what** changed and **why**.
- Squash-merge to keep history clean.

---

## 11. Deployment

- **Primary target:** Vercel.
- Database hosted on a managed PostgreSQL provider.
- Inngest cloud for background job execution.
- Pusher cloud for real-time channels.
- Upstash for serverless Redis (rate limiting).
- Vercel Blob for file uploads (avatars, etc.).

---

## 12. Security Principles

- Never expose API keys or secrets in client-side code.
- All user input is validated with Zod before processing.
- Rate limit all public endpoints.
- GitHub webhook payloads must be signature-verified.
- Use parameterized queries (Prisma handles this) — no raw SQL unless absolutely necessary.
- AI prompts must not include raw user credentials.

---

*Last updated: April 2026*

