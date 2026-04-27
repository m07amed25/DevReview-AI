<div align="center">

<h1>🔍 DevReview AI</h1>

<p><strong>AI-powered code reviews that catch bugs, security issues, and maintainability problems — before they reach production.</strong></p>

<p>
  <a href="https://github.com/m07amed25/DevReview-AI/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License">
  </a>
  <a href="https://github.com/m07amed25/DevReview-AI/stargazers">
    <img src="https://img.shields.io/github/stars/m07amed25/DevReview-AI?style=for-the-badge&logo=github" alt="Stars">
  </a>
  <a href="https://github.com/m07amed25/DevReview-AI/issues">
    <img src="https://img.shields.io/github/issues/m07amed25/DevReview-AI?style=for-the-badge" alt="Issues">
  </a>
  <a href="https://github.com/m07amed25/DevReview-AI/pulls">
    <img src="https://img.shields.io/github/issues-pr/m07amed25/DevReview-AI?style=for-the-badge" alt="Pull Requests">
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/tRPC-11-398CCB?style=for-the-badge" alt="tRPC">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
</p>

<p>
  <a href="#-features">Features</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-project-structure">Structure</a> ·
  <a href="#-deployment">Deployment</a> ·
  <a href="#-contributing">Contributing</a>
</p>

</div>

---

## What is DevReview AI?

DevReview AI is a full-stack platform that integrates directly with your GitHub repositories and automatically reviews every pull request using leading AI models. It detects bugs, security vulnerabilities, code smells, and style violations — then posts structured feedback directly back to your PR, sets commit statuses, and gives your team a rich collaborative dashboard to manage the entire review lifecycle.

---

## ✨ Features

### 🤖 Multi-Provider AI Reviews

Connect one or more AI providers and let DevReview AI pick the best available model for each review. Supports **OpenAI**, **Google Gemini**, **Groq**, and **Hugging Face** with automatic fallback between providers.

### 🔗 Deep GitHub Integration

- Automatically registers webhooks on connected repositories
- Triggers reviews on every new pull request or push
- Posts inline comments, review summaries, and commit statuses back to GitHub
- Generates architecture and ER diagrams from your codebase on demand

### 👥 Team Collaboration

- Create teams, invite members, and share repositories
- Approval workflows for sensitive team actions (role changes, repo sharing, PR reviews)
- Real-time collaborative review threads with resolve/reopen support via **Pusher**
- Role-based access control: `OWNER`, `ADMIN`, `MEMBER`

### 📊 Analytics Dashboard

- Review volume, approval/rejection rates, and quality score trends over time
- Per-repository and per-team breakdowns
- Exportable metrics for engineering reporting

### ⚡ Background Job Processing

All AI review work runs asynchronously via **Inngest** — no request timeouts, retries on failure, scheduled scans for open PRs, and full event-driven observability.

### 🔒 Security & Rate Limiting

- Per-user rate limiting backed by **Upstash Redis** (survives serverless restarts)
- GitHub webhook signature verification
- Magic-byte file type validation on uploads (not just MIME headers)
- Session invalidation on account deletion

### 🎨 Polished UI/UX

- Fluid page transitions and entrance animations powered by **GSAP** + **Lenis**
- Full dark/light mode support via `next-themes`
- Component library built on **shadcn/ui** + **Radix UI**
- Diff viewer, interactive diagram explorer, and real-time notification center

### 📧 Email Notifications

Transactional emails for review completions, team invitations, and account events — sent via **Nodemailer** with React Email templates.

---

## 🛠 Tech Stack

| Layer               | Technology                                            |
| ------------------- | ----------------------------------------------------- |
| **Framework**       | [Next.js 16](https://nextjs.org) (App Router)         |
| **Language**        | TypeScript 5                                          |
| **Database**        | PostgreSQL + [Prisma ORM 6](https://www.prisma.io)    |
| **API Layer**       | [tRPC v11](https://trpc.io) + React Query             |
| **Authentication**  | [Better Auth](https://better-auth.com) + GitHub OAuth |
| **AI Providers**    | OpenAI · Google Gemini · Groq · Hugging Face          |
| **Real-time**       | [Pusher](https://pusher.com)                          |
| **Background Jobs** | [Inngest](https://inngest.com)                        |
| **Rate Limiting**   | [Upstash Redis](https://upstash.com)                  |
| **File Storage**    | [Vercel Blob](https://vercel.com/storage/blob)        |
| **Email**           | Nodemailer + [React Email](https://react.email)       |
| **Styling**         | Tailwind CSS v4 + shadcn/ui + Radix UI                |
| **Animations**      | GSAP + Lenis smooth scroll                            |
| **Diagrams**        | Mermaid + React Flow (XY Flow)                        |
| **Charts**          | Recharts                                              |
| **Package Manager** | pnpm                                                  |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Next.js 16                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   App Router │  │  tRPC API    │  │  Webhooks API │  │
│  │  (RSC + SSR) │  │  (type-safe) │  │  (GitHub)     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                           │                             │
│              ┌────────────▼────────────┐                │
│              │     Server Services     │                │
│              │  AI · GitHub · Diagram  │                │
│              └────────────┬────────────┘                │
│                           │                             │
│     ┌─────────────────────┼───────────────────────┐     │
│     ▼                     ▼                       ▼     │
│  Prisma ORM           Inngest                  Pusher   │
│  (PostgreSQL)     (Background Jobs)         (Real-time) │
│                           │                             │
│              ┌────────────▼────────────┐                │
│              │    AI Provider Pool     │                │
│              │ OpenAI · Gemini · Groq  │                │
│              └─────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

**Request flow for a PR review:**

1. GitHub fires a `pull_request` webhook → `/api/webhooks/github`
2. Webhook handler validates signature, creates a `Review` record, sets a pending commit status
3. An Inngest event `review/pr.requested` is dispatched
4. `review-pr` Inngest function fetches the diff, builds the AI prompt with custom rules, calls the AI provider
5. Result is saved to the DB, a `review/pr.completed` event fires
6. `post-review-to-github` function posts inline comments + overall review to the PR
7. Pusher broadcasts real-time notifications to connected dashboard clients

---

## 🚀 Getting Started

### Prerequisites

| Requirement               | Version |
| ------------------------- | ------- |
| Node.js                   | ≥ 18    |
| pnpm                      | ≥ 9     |
| PostgreSQL                | ≥ 14    |
| GitHub OAuth App          | —       |
| Pusher App                | —       |
| AI API key (at least one) | —       |

### 1 — Clone & install

```bash
git clone https://github.com/m07amed25/DevReview-AI.git
cd DevReview-AI
pnpm install
```

### 2 — Configure environment variables

Copy the example file and fill in your values:

```bash
cp env.example .env
```

See the [Environment Variables Reference](#-environment-variables) section below for a full description of every variable.

### 3 — Set up the database

```bash
pnpm prisma migrate deploy
# or for a fresh local setup:
pnpm prisma db push
```

### 4 — Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5 — Start the Inngest dev server (background jobs)

In a second terminal:

```bash
pnpm inngest-cli dev -u http://localhost:3000/api/inngest
```

### 6 — Configure your GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Set **Homepage URL** to `http://localhost:3000`
3. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and **Client Secret** into your `.env`

---

## 📁 Project Structure

```
depi-code-review/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── src/
│   ├── app/
│   │   ├── (auth)/            # Sign-in / sign-up pages
│   │   ├── (dashboard)/       # Protected user dashboard
│   │   │   ├── analytics/     # Review analytics
│   │   │   ├── repo/          # Repository management
│   │   │   ├── reviews/       # Review list & detail
│   │   │   ├── teams/         # Team management
│   │   │   ├── profile/       # User profile
│   │   │   └── settings/      # User settings
│   │   ├── admin/             # Admin panel
│   │   └── api/
│   │       ├── auth/          # Better Auth handler
│   │       ├── trpc/          # tRPC HTTP handler
│   │       ├── webhooks/      # GitHub webhook receiver
│   │       ├── upload/        # Avatar / file upload
│   │       ├── pusher/        # Pusher channel auth
│   │       ├── badge/         # Public repo badge endpoint
│   │       └── inngest/       # Inngest event receiver
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   └── animations/        # GSAP animation wrappers
│   ├── features/              # Feature-sliced components
│   │   ├── review/            # Review UI + diff viewer
│   │   ├── collaborative-review/ # Real-time threads
│   │   ├── diagram/           # Mermaid diagram explorer
│   │   ├── analytics/         # Charts & metrics
│   │   └── teams/             # Team management UI
│   ├── server/
│   │   ├── api/routers/       # All tRPC routers
│   │   ├── auth/              # Better Auth config
│   │   ├── db/                # Prisma client singleton
│   │   ├── services/          # AI, GitHub, Diagram services
│   │   ├── email/             # React Email templates
│   │   ├── inngest/           # Inngest client + functions
│   │   └── pusher/            # Pusher server client
│   ├── lib/                   # Shared utilities
│   └── types/                 # Shared TypeScript types
├── public/
│   └── uploads/avatars/       # Uploaded avatar files
├── env.example                # Environment variable template
└── package.json
```

---

## 🔌 API Reference

### tRPC Routers

| Router          | Key Procedures                                                                           |
| --------------- | ---------------------------------------------------------------------------------------- |
| `repository`    | `list`, `connect`, `disconnect`, `sync`                                                  |
| `review`        | `trigger`, `list`, `getById`, `getDiff`, `submitFeedback`                                |
| `pullRequest`   | `list`, `getById`                                                                        |
| `collaboration` | `getThreads`, `createThread`, `addComment`, `toggleResolve`                              |
| `team`          | `create`, `list`, `inviteMember`, `updateRole`, `requestAction`, `executeApprovedAction` |
| `analytics`     | `getOverview`, `getTrends`, `getApprovalRejectionRates`, `getQualityScores`              |
| `diagram`       | `requestDiagram`, `getLatest`, `list`                                                    |
| `rules`         | `list`, `create`, `update`, `delete`                                                     |
| `notification`  | `list`, `markAsRead`, `markAllAsRead`                                                    |
| `profile`       | `get`, `update`                                                                          |
| `settings`      | `getPreferences`, `updatePreferences`, `deleteAccount`                                   |
| `admin`         | `getUsers`, `getReviews`, `getStats`, `updateUserRole`                                   |

### Webhook Events

| Event                               | Endpoint                    | Description                 |
| ----------------------------------- | --------------------------- | --------------------------- |
| `pull_request` (opened/synchronize) | `POST /api/webhooks/github` | Triggers an AI review       |
| `push`                              | `POST /api/webhooks/github` | Updates repository metadata |

---

## 🔧 Environment Variables

```bash
# ── Database ─────────────────────────────────────────────
DATABASE_URL=                    # PostgreSQL connection string

# ── Auth ─────────────────────────────────────────────────
BETTER_AUTH_SECRET=              # Random secret (min 32 chars)
BETTER_AUTH_URL=                 # App origin, e.g. http://localhost:3000
NEXT_PUBLIC_APP_URL=             # Same as above (public)
APP_URL=
APP_BASE_URL=

# ── GitHub OAuth ──────────────────────────────────────────
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=           # Shared secret for webhook verification

# ── AI Providers (at least one required) ──────────────────
GROQ_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=

# ── Real-time (Pusher) ────────────────────────────────────
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=          # Same as PUSHER_KEY (exposed to browser)
NEXT_PUBLIC_PUSHER_CLUSTER=      # Same as PUSHER_CLUSTER

# ── Background Jobs (Inngest) ─────────────────────────────
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# ── File Storage (Vercel Blob) ────────────────────────────
BLOB_READ_WRITE_TOKEN=

# ── Email (SMTP / Nodemailer) ─────────────────────────────
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_FROM_NAME=
```

---

## 📝 Available Scripts

```bash
pnpm dev          # Start Next.js development server (port 3000)
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # Run ESLint

pnpm prisma studio          # Open Prisma Studio (DB GUI)
pnpm prisma migrate dev     # Create and apply a new migration
pnpm prisma migrate deploy  # Apply pending migrations (CI/CD)
pnpm prisma db push         # Push schema without migrations (dev only)
```

---

## 🏗 Deployment

### Vercel (Recommended)

1. Push to GitHub and import the project at [vercel.com/new](https://vercel.com/new)
2. Add all environment variables from the table above
3. Set **Framework Preset** to `Next.js`
4. Deploy — Vercel handles the build, serverless functions, and CDN automatically

> **Inngest:** Register your production URL (`https://your-app.vercel.app/api/inngest`) in the [Inngest dashboard](https://app.inngest.com) so background jobs are triggered correctly.

### Docker

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Make your changes** and ensure the app builds without errors:
   ```bash
   pnpm build && pnpm lint
   ```
3. **Commit** using [Conventional Commits](https://www.conventionalcommits.org):
   ```bash
   git commit -m "feat: add your feature description"
   ```
4. **Open a Pull Request** against the `main` branch with a clear description of what was changed and why.

Please open an issue first for significant changes so we can discuss the approach before implementation.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/m07amed25">Mohamed Reda</a></p>
  <p>
    <a href="https://github.com/m07amed25/DevReview-AI/issues">Report a Bug</a> ·
    <a href="https://github.com/m07amed25/DevReview-AI/issues">Request a Feature</a> ·
    <a href="https://github.com/m07amed25/DevReview-AI/pulls">Submit a PR</a>
  </p>
</div>
