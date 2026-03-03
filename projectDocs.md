# DevReview AI — Project Guide

> This document is written for someone who **has not seen the project** and needs to fully understand it — either to explain it to a team or to build a similar one from scratch. Every section describes the _idea_, _why_ it was done that way, and _how_ it works.

---

## What Is This Project?

**DevReview AI** is a web application where developers can:

1. Sign up / sign in (with email or GitHub)
2. Connect their GitHub repositories to the platform
3. Browse pull requests inside those repositories
4. View code diffs (the changes made in each PR)
5. Receive AI-powered code reviews — the system analyzes the PR diff and returns a summary, a risk score, and per-file comments about bugs, security issues, performance, and style

Think of it as a simplified **SonarQube + GitHub PR interface** — but as a standalone web app with its own authentication, dashboard, and AI review engine.

---

## Table of Contents

1. [Project Logic & How to Build It](#1-project-logic--how-to-build-it)
2. [Database Analysis](#2-database-analysis)
3. [Pages & Content](#3-pages--content)
4. [Project Features](#4-project-features)
5. [Libraries & Why They Were Chosen](#5-libraries--why-they-were-chosen)

---

## 1. Project Logic & How to Build It

### 1.1 The Big Idea

This is a **full-stack application** — both the frontend (what the user sees) and the backend (server logic, database, APIs) live in a single codebase. This is made possible by **Next.js App Router**, which lets you write React pages and server-side API routes in the same project.

The key architectural decisions:

| Decision                           | Why                                                                                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js as the framework**       | Gives us React pages, server components, API routes, and deployment to Vercel — all in one. No separate backend needed.                                                                                                             |
| **tRPC as the API layer**          | Instead of building REST endpoints manually, tRPC lets the frontend call backend functions directly with full TypeScript type safety. If you change a backend function's parameters, the frontend gets a compile error immediately. |
| **Prisma as the ORM**              | Write your database schema once in a `.prisma` file, and Prisma generates typed functions for you (`db.user.findMany()`, etc.). No raw SQL needed.                                                                                  |
| **Better Auth for authentication** | Handles email/password sign-up, OAuth with GitHub/Discord/etc., session management, and account linking out of the box.                                                                                                             |
| **PostgreSQL as the database**     | A robust relational database that handles the structured relationships between users, repositories, and reviews well.                                                                                                               |

### 1.2 How the Parts Connect (Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  React Pages ──> tRPC hooks (useQuery / useMutation)            │
│       ↓              ↓                                          │
│  UI Components   React Query (caching, loading states)          │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP requests to /api/trpc
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Next.js API)                         │
│                                                                 │
│  /api/trpc/[trpc]  ──> tRPC Router ──> Procedures               │
│  /api/auth/[...all] ──> Better Auth handler                     │
│  /api/upload        ──> File upload handler                     │
│                              │                                  │
│                    ┌─────────┴──────────┐                       │
│                    ▼                    ▼                        │
│              Prisma ORM          GitHub REST API                 │
│            (PostgreSQL)       (fetch repos, PRs, diffs)          │
└─────────────────────────────────────────────────────────────────┘
```

**Step by step — what happens when a user views their repos:**

1. User opens `/repo` in the browser
2. The React page calls `trpc.repository.list.useQuery()` — this is a tRPC hook
3. Under the hood, this sends an HTTP request to `/api/trpc/repository.list`
4. The tRPC server receives it, checks if the user is authenticated (via Better Auth session cookie)
5. If authenticated, it runs `db.repository.findMany({ where: { userId: user.id } })` through Prisma
6. Prisma queries PostgreSQL and returns the data
7. tRPC serializes the response (using SuperJSON to handle Dates, etc.) and sends it back
8. React Query caches the result, and the UI renders the repository cards

### 1.3 Folder Structure Explained

```
src/
├── app/                          # All pages and API routes (Next.js App Router)
│   ├── layout.tsx                # Root layout — wraps everything with providers
│   ├── page.tsx                  # Landing page (/)
│   ├── not-found.tsx             # Custom 404 page
│   ├── (auth)/                   # Auth pages (grouped — parentheses = no URL segment)
│   │   ├── sign-in/page.tsx      #   /sign-in
│   │   └── sign-up/page.tsx      #   /sign-up
│   ├── (dashboard)/              # Protected pages — requires login
│   │   ├── layout.tsx            #   Checks auth, shows header
│   │   ├── repo/page.tsx         #   /repo — repository list
│   │   ├── repo/[id]/page.tsx    #   /repo/abc123 — PR list for a repo
│   │   ├── repo/[id]/pr/[prNumber]/page.tsx  # /repo/abc123/pr/42 — PR detail
│   │   ├── profile/page.tsx      #   /profile
│   │   └── settings/page.tsx     #   /settings
│   └── api/                      # Backend API routes
│       ├── auth/[...all]/        #   Better Auth catch-all handler
│       ├── trpc/[trpc]/          #   tRPC HTTP endpoint
│       └── upload/route.ts       #   File upload endpoint
│
├── components/                   # Reusable UI components
│   ├── ui/                       #   shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── animations/               #   Animated background components
│   ├── header.tsx                #   Dashboard navigation header
│   ├── user-menu.tsx             #   User avatar dropdown menu
│   ├── diff-viewer.tsx           #   Code diff display component (~1650 lines)
│   ├── review-result.tsx         #   AI review results display
│   ├── connect-github.tsx        #   GitHub connection prompt card
│   ├── crop-dialog.tsx           #   Image crop modal
│   └── image-cropper.tsx         #   Interactive image cropper
│
├── lib/                          # Client-side utilities
│   ├── auth-client.ts            #   Better Auth client (signIn, signUp, signOut)
│   ├── utils.ts                  #   Helpers like cn() for class merging
│   └── trpc/                     #   tRPC client setup
│       ├── client.ts             #     createTRPCReact instance
│       └── provider.tsx          #     React context provider for tRPC + React Query
│
├── server/                       # Server-only code (never sent to browser)
│   ├── auth/index.ts             #   Better Auth configuration
│   ├── db/index.ts               #   Prisma client singleton
│   ├── api/
│   │   ├── trpc.ts               #   tRPC context, router factory, middleware
│   │   ├── root.ts               #   Root router (combines all sub-routers)
│   │   └── routers/              #   Individual feature routers
│   │       ├── repository.ts     #     CRUD for connected repositories
│   │       ├── pull-request.ts   #     Fetch PRs and PR files from GitHub
│   │       ├── profile.ts        #     User profile read/update
│   │       └── settings.ts       #     Session management, account deletion
│   └── services/
│       └── github.ts             #   GitHub API wrapper (repos, PRs, diffs)
│
└── proxy.ts                      # Middleware to redirect auth errors to friendly pages
```

**Key concept — Route Groups:** `(auth)` and `(dashboard)` are _route groups_ in Next.js. The parentheses mean they organize files without adding a URL segment. So `(auth)/sign-in/page.tsx` maps to `/sign-in`, not `/(auth)/sign-in`.

**Key concept — Layouts:** The `(dashboard)/layout.tsx` checks authentication server-side. If the user isn't logged in, it redirects to `/sign-in`. All pages inside `(dashboard)/` automatically get this protection plus the shared header.

### 1.4 How to Build It (Step by Step)

If you want to recreate this project from scratch:

```bash
# 1. Create the Next.js project
pnpm create next-app@latest my-code-review --typescript --tailwind --app --src-dir

# 2. Install core dependencies
pnpm add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
pnpm add @prisma/client better-auth superjson zod
pnpm add -D prisma

# 3. Install UI dependencies
pnpm add radix-ui lucide-react react-icons next-themes
pnpm add class-variance-authority clsx tailwind-merge
pnpm add -D shadcn
npx shadcn@latest init    # Initialize shadcn/ui components

# 4. Install animation library
pnpm add gsap @gsap/react

# 5. Set up Prisma
npx prisma init --datasource-provider postgresql
# Edit prisma/schema.prisma (define your models)
npx prisma db push        # Push schema to database
npx prisma generate       # Generate typed client

# 6. Set up environment variables (.env)
# DATABASE_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, etc.

# 7. Start development
pnpm dev
```

### 1.5 Build & Run Commands

| Command      | What It Does                                                      |
| ------------ | ----------------------------------------------------------------- |
| `pnpm dev`   | Starts the development server at `localhost:3000` with hot reload |
| `pnpm build` | Compiles the project for production (optimized)                   |
| `pnpm start` | Runs the production build                                         |
| `pnpm lint`  | Checks code quality with ESLint                                   |

### 1.6 Environment Variables

These secrets must be configured in a `.env` file:

| Variable                                        | What It's For                                                                  | Required?           |
| ----------------------------------------------- | ------------------------------------------------------------------------------ | ------------------- |
| `DATABASE_URL`                                  | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/dbname`) | Yes                 |
| `BETTER_AUTH_URL`                               | The app's public URL — used for auth redirects and cookie security             | Yes                 |
| `GITHUB_CLIENT_ID`                              | From GitHub OAuth App settings                                                 | Yes                 |
| `GITHUB_CLIENT_SECRET`                          | From GitHub OAuth App settings                                                 | Yes                 |
| `BLOB_READ_WRITE_TOKEN`                         | Vercel Blob Storage token for production image uploads                         | Only for production |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`   | Enables Discord as a login option                                              | Optional            |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | Enables LinkedIn as a login option                                             | Optional            |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET`     | Enables Twitch as a login option                                               | Optional            |
| `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET`       | Enables Apple as a login option                                                | Optional            |

---

## 2. Database Analysis

### 2.1 Overview

The database uses **PostgreSQL** with **Prisma ORM**. There are **6 tables** organized around a central User model:

```
User ──┬── Session        (login sessions — one per device/browser)
       ├── Account        (auth methods — GitHub, email+password, Discord, etc.)
       ├── Repository     (GitHub repos the user connected)
       │     └── Review   (AI code reviews per pull request)
       └── Review         (also linked directly to user)

Verification              (standalone — email verification tokens)
```

### 2.2 Entity-Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│     User     │────<│   Session    │     │  Verification    │
│──────────────│     │──────────────│     │──────────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)          │
│ name         │     │ expiresAt    │     │ identifier       │
│ email (UQ)   │     │ token (UQ)   │     │ value            │
│ emailVerified│     │ ipAddress    │     │ expiresAt        │
│ image?       │     │ userAgent    │     │ createdAt        │
│ createdAt    │     │ userId (FK)──│─┐   │ updatedAt        │
│ updatedAt    │     │ createdAt    │ │   └──────────────────┘
└──────┬───────┘     │ updatedAt    │ │
       │             └──────────────┘ │
       │                              │
       ├────<┌──────────────┐         │
       │     │   Account    │         │
       │     │──────────────│         │
       │     │ id (PK)      │         │
       │     │ accountId    │         │  ←── "────<" means "has many"
       │     │ providerId   │         │       User has many Sessions
       │     │ userId (FK)──│─────────┘
       │     │ accessToken? │
       │     │ refreshToken?│
       │     │ scope?       │
       │     │ password?    │
       │     └──────────────┘
       │
       ├────<┌──────────────────┐      ┌──────────────┐
       │     │   Repository     │────<│    Review     │
       │     │──────────────────│     │──────────────│
       │     │ id (PK, cuid)   │     │ id (PK, cuid)│
       │     │ userId (FK)      │     │ repositoryId │
       │     │ githubId         │     │ userId (FK)  │
       │     │ name             │     │ prNumber     │
       │     │ fullName         │     │ prTitle      │
       │     │ private          │     │ prUrl        │
       │     │ htmlUrl          │     │ status (enum)│
       │     │ (UQ: userId+     │     │ summary?     │
       │     │  githubId)       │     │ riskScore?   │
       │     └──────────────────┘     │ comments?    │
       │                              │ error?       │
       └─────────────────────────────>│ createdAt    │
                                      │ updatedAt    │
                                      └──────────────┘
```

### 2.3 Tables Explained — One by One

---

#### Table 1: User (`user`)

**What it stores:** Every registered user of the platform.

| Column          | Type              | Notes                                                             |
| --------------- | ----------------- | ----------------------------------------------------------------- |
| `id`            | String            | Primary key. Generated by Better Auth.                            |
| `name`          | String            | Display name — entered during sign-up.                            |
| `email`         | String            | **Unique.** Used for credential login and as a display field.     |
| `emailVerified` | Boolean           | Defaults to `false`. Could be used to gate features.              |
| `image`         | String (nullable) | URL to the user's avatar — either from GitHub or a custom upload. |
| `createdAt`     | DateTime          | Auto-set when the row is created.                                 |
| `updatedAt`     | DateTime          | Auto-updated on every change.                                     |

**Relationships:**

- A User can have **many Sessions** (one per device).
- A User can have **many Accounts** (one per auth provider — GitHub account, email+password, Discord, etc.).
- A User can have **many Repositories** (GitHub repos they've connected).
- A User can have **many Reviews** (AI reviews they've requested).

**Why it's designed this way:** This model is shaped by Better Auth's requirements. Better Auth expects `user`, `session`, `account`, and `verification` tables with specific columns. The `repositories` and `reviews` relations are the app-specific additions.

---

#### Table 2: Session (`session`)

**What it stores:** Active login sessions. Created when a user signs in.

| Column      | Type              | Notes                                                             |
| ----------- | ----------------- | ----------------------------------------------------------------- |
| `id`        | String            | Primary key.                                                      |
| `expiresAt` | DateTime          | Session expires after **7 days**.                                 |
| `token`     | String            | **Unique.** The session token stored in the user's cookie.        |
| `ipAddress` | String (nullable) | The IP address the user logged in from.                           |
| `userAgent` | String (nullable) | Browser/device info (e.g., "Chrome on Windows").                  |
| `userId`    | String (FK)       | Which user this session belongs to. **Indexed** for fast lookups. |

**Cascade rule:** When a User is deleted, all their Sessions are deleted too.

**Why it matters:** The Settings page lets users see all their active sessions and revoke them. The IP and userAgent fields power the "Chrome on Windows" display.

---

#### Table 3: Account (`account`)

**What it stores:** Authentication methods. A user who signed up with email AND linked GitHub will have **2 account rows**.

| Column         | Type              | Notes                                                               |
| -------------- | ----------------- | ------------------------------------------------------------------- |
| `id`           | String            | Primary key.                                                        |
| `accountId`    | String            | The ID of the user on the external provider (e.g., GitHub user ID). |
| `providerId`   | String            | `"credential"` (email+password), `"github"`, `"discord"`, etc.      |
| `userId`       | String (FK)       | Which user this account belongs to. **Indexed.**                    |
| `accessToken`  | String (nullable) | OAuth access token — used to call GitHub API on behalf of the user. |
| `refreshToken` | String (nullable) | OAuth refresh token.                                                |
| `scope`        | String (nullable) | What permissions were granted (e.g., `"read:user,repo"`).           |
| `password`     | String (nullable) | Hashed password — only for `"credential"` provider.                 |

**Why `accessToken` is critical:** When the app fetches a user's GitHub repos or PRs, it reads the `accessToken` from the Account row where `providerId = "github"`. Without it, the app can't call the GitHub API.

---

#### Table 4: Verification (`verification`)

**What it stores:** Temporary tokens for email verification, password resets, etc.

| Column       | Type     | Notes                                                    |
| ------------ | -------- | -------------------------------------------------------- |
| `id`         | String   | Primary key.                                             |
| `identifier` | String   | What's being verified (typically an email). **Indexed.** |
| `value`      | String   | The verification token/code.                             |
| `expiresAt`  | DateTime | When this token expires.                                 |

**Standard Better Auth table** — used internally by the auth library.

---

#### Table 5: Repository

**What it stores:** GitHub repositories that users have connected to the platform.

| Column     | Type        | Notes                                     |
| ---------- | ----------- | ----------------------------------------- |
| `id`       | String      | Primary key (auto-generated CUID).        |
| `userId`   | String (FK) | The user who connected this repo.         |
| `githubId` | Int         | The numeric ID of the repo on GitHub.     |
| `name`     | String      | Short name (e.g., `"my-project"`).        |
| `fullName` | String      | Full name (e.g., `"octocat/my-project"`). |
| `private`  | Boolean     | Whether the repo is private on GitHub.    |
| `htmlUrl`  | String      | Link to the repo on GitHub.               |

**Unique constraint:** `(userId, githubId)` — prevents a user from connecting the same GitHub repo twice.

**Important:** The app does **not** store the repo's code. It only stores a reference to the GitHub repo so it can fetch PRs and diffs on demand via the GitHub API.

---

#### Table 6: Review

**What it stores:** AI code review results for specific pull requests.

| Column         | Type                    | Notes                                                            |
| -------------- | ----------------------- | ---------------------------------------------------------------- |
| `id`           | String                  | Primary key (CUID).                                              |
| `repositoryId` | String (FK)             | Which repository this PR belongs to. **Indexed.**                |
| `userId`       | String (FK)             | Who requested the review. **Indexed.**                           |
| `prNumber`     | Int                     | The pull request number (e.g., `#42`).                           |
| `prTitle`      | String                  | Snapshot of the PR title at review time.                         |
| `prUrl`        | String                  | Link to the PR on GitHub.                                        |
| `status`       | Enum                    | `PENDING` → `PROCESSING` → `COMPLETED` or `FAILED`. **Indexed.** |
| `summary`      | String (nullable, Text) | The AI's overall summary of the PR (long text).                  |
| `riskScore`    | Int (nullable)          | A 0–100 score indicating how risky the changes are.              |
| `comments`     | JSON (nullable)         | Structured array of per-file, per-line review comments.          |
| `error`        | String (nullable)       | Error message if the review failed.                              |

**Review lifecycle:**

```
User clicks "Review" → status = PENDING
System picks it up   → status = PROCESSING
AI finishes          → status = COMPLETED (with summary, riskScore, comments)
    or               → status = FAILED (with error message)
```

**Comments JSON structure** (what the AI produces):

```json
[
  {
    "file": "src/utils.ts",
    "line": 42,
    "severity": "warning",
    "category": "security",
    "message": "User input is not sanitized before being used in a query",
    "suggestion": "Use parameterized queries instead of string concatenation"
  }
]
```

### 2.4 Database Indexes

| Table        | Indexed Column(s) | Why                                                     |
| ------------ | ----------------- | ------------------------------------------------------- |
| Session      | `userId`          | Quickly find all sessions for a user (settings page)    |
| Account      | `userId`          | Quickly find all auth methods for a user (profile page) |
| Verification | `identifier`      | Look up verification tokens by email                    |
| Review       | `repositoryId`    | List all reviews for a repository                       |
| Review       | `userId`          | List all reviews by a user                              |
| Review       | `status`          | Filter reviews by processing state                      |

### 2.5 Cascade Deletes

When you delete a **User**, everything they own is automatically deleted:

- All their Sessions
- All their Accounts
- All their Repositories → which cascades to all Reviews under those repos
- All their Reviews (direct link)

This means "Delete Account" is a single database operation.

---

## 3. Pages & Content

### 3.1 Route Map (All Pages)

| URL                        | What It Is                                | Login Required? |
| -------------------------- | ----------------------------------------- | --------------- |
| `/`                        | Marketing landing page                    | No              |
| `/sign-in`                 | Sign in form                              | No              |
| `/sign-up`                 | Registration form                         | No              |
| `/auth-error`              | Auth error display page                   | No              |
| `/not-found`               | Custom 404 page                           | No              |
| `/repo`                    | Repository management dashboard           | **Yes**         |
| `/repo/[id]`               | Single repo — pull request list           | **Yes**         |
| `/repo/[id]/pr/[prNumber]` | PR detail — diff viewer + AI review       | **Yes**         |
| `/profile`                 | User profile with avatar, linked accounts | **Yes**         |
| `/settings`                | Theme, sessions, account deletion         | **Yes**         |
| `/api/auth/[...all]`       | Auth API (handled by Better Auth)         | —               |
| `/api/trpc/[trpc]`         | tRPC API endpoint                         | —               |
| `/api/upload`              | Avatar file upload                        | **Yes**         |

### 3.2 Layout System

The app has **two nested layouts**:

```
Root Layout (all pages)
├── Providers: ThemeProvider, TRPCProvider, PageTransitionProvider
├── Fonts: Geist Sans + Geist Mono
├── Default theme: Dark
│
└── Dashboard Layout (only /repo, /profile, /settings)
    ├── Auth check: if not logged in → redirect to /sign-in
    ├── Header bar: logo, navigation (Repositories, Reviews), UserMenu
    └── Page content
```

### 3.3 Each Page in Detail

---

#### Landing Page (`/`)

**Purpose:** Convince visitors to sign up. This is the first thing non-authenticated users see.

**Content:**

- **Hero section** — big headline ("AI-Powered Code Reviews"), description, and "Get Started" / "Learn More" buttons
- **Features grid** — 6 feature cards: AI Review, PR Analysis, Risk Scoring, Security Checks, Style Guide, Fast Feedback
- **Stats section** — animated counters
- **Code preview** — mock code review example
- **CTA section** — final call-to-action to sign up

**Animations:** Heavily animated with GSAP — elements fade in on scroll, backgrounds subtly animate (aurora/blob/grid effects), counters count up when scrolled into view.

**Technical note:** This is a `"use client"` component because of all the interactive animations and state.

---

#### Sign In (`/sign-in`)

**Purpose:** Let existing users log in.

**Content:**

- Email + password form fields
- "Forgot password?" link (if implemented)
- **GitHub OAuth button** — one-click sign-in via GitHub
- Link to sign-up page
- Animated card with aurora/grid background

**How auth works:**

1. **Email/password:** Calls `signIn.email({ email, password })` from Better Auth client → server validates credentials → creates session → redirects to `/repo`
2. **GitHub OAuth:** Calls `signIn.social({ provider: "github" })` → redirects to GitHub → GitHub redirects back → Better Auth creates/links account → redirects to `/repo`

**Validation:** Client-side validation for email format and required fields. Server returns errors like "Invalid credentials."

---

#### Sign Up (`/sign-up`)

**Purpose:** New user registration.

**Content:**

- Name, email, password, confirm password fields
- **Password strength meter** — visual bar that goes from red (Weak) to green (Very Strong) based on:
  - Length ≥ 8 characters
  - Length ≥ 12 characters
  - Contains uppercase
  - Contains numbers
  - Contains special characters
- GitHub OAuth sign-up button
- Link to sign-in page

---

#### Repository Dashboard (`/repo`)

**Purpose:** The main dashboard — manage which GitHub repos are connected.

**Content (two sections):**

**Section 1 — Connected Repos:**

- Grid of cards, each showing: repo name, public/private badge, "connected X days ago" text, GitHub link
- Delete button with confirmation dialog: "Are you sure you want to disconnect this repository?"

**Section 2 — Connect New Repos:**

- Fetches all the user's GitHub repos (personal, collaborator, and organization repos)
- Searchable list with multi-select checkboxes
- Each item shows: repo name, full name (owner/repo), language badge, star count, last updated
- "Connect Selected" button to batch-add repos

**How it works under the hood:**

1. `trpc.repository.list.useQuery()` — fetches connected repos from the database
2. `trpc.repository.fetchFromGithub.useQuery()` — uses the stored GitHub access token to call GitHub's API and list all available repos
3. `trpc.repository.connect.useMutation()` — takes selected repos and upserts them into the database
4. `trpc.repository.disconnect.useMutation()` — deletes a repo from the database

**Important — "Connect" doesn't clone the repo.** It just saves a reference (GitHub ID, name, URL) so the app knows which repos to fetch PRs from later.

---

#### Repository Detail (`/repo/[id]`)

**Purpose:** View all pull requests for a specific connected repository.

**Content:**

- **Header:** Repository name, public/private badge, link to GitHub
- **Stats bar:** Total additions (green), total deletions (red), total changed files across all PRs
- **Filter tabs:** Open / Closed / All — with counts
- **Search bar:** Filter PRs by title, author, or branch name
- **Pull request cards**, each showing:
  - PR title and number
  - Author avatar and username
  - Branch: `feature-branch` → `main`
  - Additions/deletions count
  - Review status badge: "Reviewed", "Pending", or "Not Reviewed"
  - Time ago: "3 days ago"

**Click a PR → navigates to** `/repo/[id]/pr/[prNumber]`

**How it works:** The PR list comes from the GitHub API (not stored in the database). The app calls `trpc.pullRequest.list` which:

1. Looks up the repository in the DB to get the `fullName` (e.g., `octocat/my-project`)
2. Gets the GitHub access token from the Account table
3. Calls `https://api.github.com/repos/octocat/my-project/pulls`
4. Cross-references with stored Reviews in the DB to show review status

---

#### Pull Request Detail (`/repo/[id]/pr/[prNumber]`)

**Purpose:** The core page — view a PR's code changes and AI review.

**Content:**

- **PR header:** Title, state badge (Open/Closed/Merged/Draft), author info, branch arrow (head → base), timestamps
- **Stats:** X additions, Y deletions, Z changed files
- **Two tabs:**

  **Files Tab (Diff Viewer):**
  - All changed files with their code diffs
  - **Unified view** (default): old and new code interleaved, red for deletions, green for additions
  - **Split view:** old code on the left, new code on the right, side by side
  - **Word-level highlighting:** within a changed line, shows exactly which words changed
  - File tree sidebar: browse by directory structure
  - Filter by file status: added, modified, removed, renamed
  - Search by filename
  - Collapsible file sections
  - Copy patch button per file

  **Reviews Tab:**
  - AI review result (if one exists):
    - **Risk Score gauge:** 0–100, with color (green/yellow/red)
    - **Summary:** paragraph describing the overall quality of the changes
    - **Comments list:** per-file comments with severity badges (bug, security, performance, style), the file path, line number, message, and suggested fix
  - Status indicators: "Queued for review" (pending), "Processing..." (animated), "Review complete", or "Review failed" with error

---

#### Profile (`/profile`)

**Purpose:** View and edit user information, manage linked social accounts.

**Content:**

- **Banner + Avatar:** decorative banner, circular avatar with camera icon overlay
- **User info:** name, email, join date — with inline edit pencils
- **Stats cards:** X connected repositories, Y code reviews
- **Avatar upload:** click to upload file → opens a **crop dialog**:
  - Interactive image cropper with drag-to-pan and zoom
  - Aspect ratio presets (1:1, 4:3, 16:9, 3:4)
  - Zoom slider
  - Saves the cropped image
- **Linked accounts section:**
  - Shows which providers are connected (GitHub, Discord, LinkedIn, Twitch, Apple)
  - "Connect" button for unlinked providers
  - "Disconnect" for linked ones (with safety check — can't disconnect if it's the only auth method)

---

#### Settings (`/settings`)

**Purpose:** App preferences, security settings, and dangerous operations.

**Content:**

- **Appearance section:**
  - Theme picker: Light / Dark / System, with animated View Transition API effect (circle wipe from the click point)

- **Code Review Preferences:**
  - Auto-review toggle (on/off)
  - Default language selector
  - Review depth: Quick / Standard / Thorough
  - Include security checks (toggle)
  - Include performance suggestions (toggle)
  - _Stored in localStorage_ — these are client-side preferences

- **Active Sessions:**
  - Table of all active sessions showing: browser name, OS, IP address, "Current session" badge
  - "Revoke" button per session (cannot revoke current session)
  - "Revoke All Others" button

- **Danger Zone:**
  - "Delete Account" button
  - Opens confirmation dialog: must type `DELETE` to confirm
  - Permanently deletes user and all associated data (cascade)

---

#### Auth Error (`/auth-error`)

**Purpose:** When OAuth goes wrong, show a helpful error instead of a cryptic page.

**Handles these errors:**
| Error Code | Display |
|---|---|
| `account_already_linked_to_different_user` | "This social account is already connected to a different user" |
| `email_doesn't_match` | "The email on your social account doesn't match" |
| `user_already_exists` | "An account with this email already exists" |
| `invalid_token` | "The authentication token is invalid or expired" |
| `oauth_account_already_used` | "This social account is already associated with another user" |

Each error shows an icon, a title, a description, and a suggestion on what to do.

---

#### 404 Not Found

**Purpose:** Custom animated 404 page when users visit a non-existent URL.

**Content:** Large "404" text with GSAP floating/glitch animation, particle background, "Go Back" and "Go Home" buttons.

---

## 4. Project Features

### 4.1 Authentication System

**What it does:** Lets users create accounts and log in.

**Methods supported:**

- **Email + Password** — traditional registration with name, email, password
- **GitHub OAuth** — one-click sign-in/sign-up via GitHub (always available)
- **Discord, LinkedIn, Twitch, Apple** — additional OAuth providers, automatically enabled if their environment variables are set

**Key behaviors:**

- **Account linking:** A user who signed up with email can later link their GitHub account. Multiple providers can be linked to one user account. Different emails are allowed across providers.
- **Sessions last 7 days.** They refresh if the user is active (update age = 1 day). A 5-minute cookie cache avoids excessive session lookups.
- **Protected routes:** The dashboard layout checks the session server-side. The tRPC layer has a `protectedProcedure` middleware that rejects unauthenticated API calls.
- **Error handling:** OAuth errors (account already linked, email mismatch, etc.) are intercepted by proxy middleware and redirected to the `/auth-error` page with human-readable messages.

### 4.2 GitHub Integration

**What it does:** Connects to the GitHub API to fetch repos, pull requests, and code diffs.

**How it connects:**

1. User signs in with GitHub OAuth, granting scopes: `read:user`, `user:email`, `repo`, `read:org`
2. The OAuth access token is stored in the Account table
3. When the user wants to browse repos/PRs, the server retrieves this token and calls the GitHub REST API v3

**Capabilities:**
| Feature | GitHub API Used |
|---|---|
| Fetch user's repos | `GET /user/repos` + `GET /orgs/{org}/repos` for each org |
| Fetch PRs for a repo | `GET /repos/{owner}/{repo}/pulls` |
| Fetch a single PR | `GET /repos/{owner}/{repo}/pulls/{number}` |
| Fetch PR file diffs | `GET /repos/{owner}/{repo}/pulls/{number}/files` |

**Deduplication:** Repos from personal access and org access may overlap, so they're deduplicated by GitHub repo ID.

**Pagination:** All list endpoints use pagination (100 items per page, looping until exhausted) to handle users with many repos.

### 4.3 AI Code Review

**What it does:** Analyzes pull request diffs and produces structured feedback.

**The review lifecycle:**

1. User opens a PR and clicks "Review"
2. A Review row is created with `status: PENDING`
3. The system processes it (moves to `PROCESSING`)
4. The AI analyzes the diff and returns:
   - A **summary** (natural language overview of the changes)
   - A **risk score** (0–100, where higher = more risky)
   - **Comments** (array of per-file, per-line feedback with severity and suggestions)
5. Status becomes `COMPLETED` (or `FAILED` with an error message)

**Review output structure:**

- **Risk Score (0–100):** Displayed as a colored gauge. 0–30 = low risk (green), 30–60 = medium (yellow), 60–100 = high (red)
- **Categories of comments:** bug, security, performance, style
- **Severity levels:** Each comment has a severity (e.g., error, warning, info)

### 4.4 Diff Viewer (Code Changes Display)

**What it does:** Renders the code diff of a pull request, similar to GitHub's diff view but built as a custom React component (~1650 lines).

**Features:**

- **Two view modes:** Unified (interleaved) or Split (side-by-side)
- **Word-level highlighting:** Uses an LCS (Longest Common Subsequence) algorithm to highlight exactly which words within a line changed, not just the whole line
- **File tree:** Sidebar showing all changed files grouped by directory, with status icons
- **Filtering:** By filename search or by status (added/modified/removed/renamed)
- **Collapsible sections:** Each file can be expanded or collapsed
- **Line numbers:** With proper old/new line number tracking
- **Copy patch:** Copy the raw diff patch for any file
- **Line wrapping toggle**

### 4.5 Profile & Avatar Management

**What it does:** Users can view and edit their personal information and upload custom avatars.

**Avatar upload flow:**

1. User clicks the camera icon on their avatar
2. File picker opens — accepts JPEG, PNG, GIF, WebP, SVG (max 5MB)
3. Selected image opens in a **crop dialog**:
   - Canvas-based interactive cropper with drag-to-pan
   - Zoom via slider or mouse wheel
   - Aspect ratio presets (1:1, 4:3, 16:9, 3:4)
   - Grid overlay appears during interaction
4. User confirms → the cropped image is uploaded to:
   - **Vercel Blob Storage** in production (if `BLOB_READ_WRITE_TOKEN` is set)
   - **Local filesystem** (`public/uploads/avatars/`) in development
5. The returned URL is saved to the user's `image` field

**Linked accounts:** The profile page shows which OAuth providers are connected and lets users link/unlink them. Safety check: users cannot disconnect their only authentication method.

### 4.6 Settings

**Theme switching:** Supports Light, Dark, and System (follows OS preference). Theme changes use the **View Transition API** — when you click a theme option, a circle-wipe animation expands from the click point, revealing the new theme.

**Session management:** Lists all active sessions with device info (parsed from the User-Agent string). Users can:

- See which session is their current one
- Revoke individual sessions (sign out a specific device)
- "Revoke All Others" (sign out everywhere except current device)

**Account deletion:** Hard delete with cascading — removes user, all sessions, all accounts, all repositories, all reviews. Requires typing "DELETE" as confirmation.

### 4.7 Animations & UI Polish

The project uses **GSAP (GreenSock)** extensively for smooth, professional animations:

- **Page transitions:** Fade/slide between pages
- **Scroll triggers:** Elements animate in as you scroll (landing page)
- **Entrance animations:** Cards, forms, and dialogs animate in with spring physics
- **Background effects:** Reusable animated background components:
  - `AuroraBackground` — shifting gradient aurora
  - `GridBackground` — subtle animated grid pattern
  - `BlobBackground` — floating blob shapes
  - `ParticleBackground` — floating particles
  - `GradientBackground` — animated gradient

---

## 5. Libraries & Why They Were Chosen

### 5.1 Core Stack

| Library        | Version | Why It Was Chosen                                                                                                                                                                                                         |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**    | 16.1.6  | The full-stack React framework. Handles pages (App Router), server components, API routes, image optimization, and Vercel deployment in one package. Chosen because it eliminates the need for a separate backend server. |
| **React**      | 19.2.3  | The UI library. React 19 adds concurrent features and server components support. Next.js is built on React.                                                                                                               |
| **TypeScript** | ^5      | Adds type safety to the entire codebase. Catches bugs at compile time and enables the "end-to-end type safety" that tRPC provides.                                                                                        |

### 5.2 Backend & API

| Library                                                        | Version | Why It Was Chosen                                                                                                                                                                                                                                         |
| -------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **tRPC** (`@trpc/server`, `@trpc/client`, `@trpc/react-query`) | ^11.10  | Replaces traditional REST APIs. You define a server function, and the client can call it with full autocomplete and type checking — if the server returns `{ name: string }`, the client knows that automatically. No API docs or code generation needed. |
| **Prisma** (`@prisma/client`, `prisma`)                        | 6.19.2  | ORM for PostgreSQL. You define your schema once in `schema.prisma`, and Prisma generates a fully typed client. Instead of writing `SELECT * FROM users WHERE id = ?`, you write `db.user.findUnique({ where: { id } })` with autocomplete.                |
| **Better Auth**                                                | ^1.4.18 | An auth library that handles the hard parts: password hashing, OAuth flows, session tokens, account linking. Chosen over alternatives like NextAuth because it offers more flexibility and built-in account linking support.                              |
| **Zod**                                                        | ^4.3.6  | Runtime input validation. Every tRPC procedure validates its inputs with Zod schemas — this ensures the server never receives invalid data, even if the client has a bug.                                                                                 |
| **SuperJSON**                                                  | ^2.2.6  | JSON can't serialize Dates, Maps, or BigInts. SuperJSON extends JSON for tRPC so `new Date()` comes through properly instead of becoming a string.                                                                                                        |
| **@vercel/blob**                                               | ^2.3.0  | Cloud storage for file uploads in production. Simpler than setting up AWS S3 and integrates natively with Vercel hosting.                                                                                                                                 |

### 5.3 Data Fetching & State

| Library                                            | Version | Why It Was Chosen                                                                                                                                                                    |
| -------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **TanStack React Query** (`@tanstack/react-query`) | ^5.90   | The standard for server state management in React. Handles caching, background refetching, loading/error states, and cache invalidation. tRPC's React adapter is built on top of it. |

### 5.4 UI Components

| Library                                                                       | Version | Why It Was Chosen                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Radix UI** (`radix-ui`, `@radix-ui/react-dialog`, `@radix-ui/react-slider`) | ^1.4.3  | Headless (unstyled) accessible UI primitives. They handle complex interactions (dialogs, dropdowns, sliders) with proper keyboard navigation and ARIA attributes. You style them yourself.                                                                                                                                                                       |
| **shadcn/ui** (`shadcn` dev CLI)                                              | ^3.8.5  | Pre-styled components built on Radix UI + Tailwind. You run `npx shadcn add button` and get a styled, accessible button component added to your codebase (not a package — actual source files you can edit). **Components used:** Alert Dialog, Avatar, Badge, Button, Card, Checkbox, Dialog, Dropdown Menu, Input, Label, Select, Separator, Skeleton, Slider. |
| **Lucide React**                                                              | ^0.575  | Primary icon library. Clean, consistent SVG icons: `<GitPullRequest />`, `<Settings />`, `<Loader2 />`, etc. shadcn/ui uses Lucide by default.                                                                                                                                                                                                                   |
| **React Icons**                                                               | ^5.5.0  | Supplementary icons for brand logos: `<FaGithub />`, `<FaDiscord />`, `<FaLinkedin />`, etc. Lucide doesn't include brand icons.                                                                                                                                                                                                                                 |

### 5.5 Styling

| Library                            | Version | Why It Was Chosen                                                                                                                                                                                                       |
| ---------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tailwind CSS**                   | ^4      | Utility-first CSS framework. Instead of writing CSS files, you add classes directly to elements: `className="flex items-center gap-2 p-4 bg-card rounded-lg"`. Enables rapid UI development without naming CSS classes. |
| **tailwind-merge**                 | ^3.5.0  | Intelligently merges Tailwind classes. If you pass `"p-4 p-2"`, it resolves to `"p-2"` (last wins). Used inside the `cn()` helper function.                                                                             |
| **class-variance-authority (CVA)** | ^0.7.1  | Manages component variants. For example, a Button can have variants like `variant="default"`, `variant="destructive"`, `size="sm"`. CVA maps these to specific Tailwind classes cleanly.                                |
| **clsx**                           | ^2.1.1  | Utility for conditional classes: `clsx("base", isActive && "bg-blue-500")`. Combined with tailwind-merge in the `cn()` helper.                                                                                          |
| **next-themes**                    | ^0.4.6  | Manages theme (dark/light/system) with Next.js. Prevents flash-of-wrong-theme on page load and provides `useTheme()` hook.                                                                                              |

**The `cn()` helper pattern** (used everywhere):

```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Usage:
<div className={cn("p-4 rounded-lg", isActive && "bg-primary", className)} />
```

### 5.6 Animation

| Library         | Version | Why It Was Chosen                                                                                                                                                                                                                                   |
| --------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GSAP**        | ^3.14.2 | Professional-grade animation library. More powerful and performant than CSS animations for complex sequences. Used for: scroll-triggered reveals, timeline animations, entrance effects, floating/glitch text. Includes plugins like ScrollTrigger. |
| **@gsap/react** | ^2.1.2  | Official React integration providing the `useGSAP()` hook — handles cleanup automatically when components unmount, preventing memory leaks.                                                                                                         |

### 5.7 Dev Tooling

| Library                | Version           | Why It Was Chosen                                                                                                                 |
| ---------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **ESLint**             | ^9                | Catches code quality issues and enforces consistent style.                                                                        |
| **eslint-config-next** | 16.1.6            | Next.js-specific ESLint rules (e.g., use `<Image>` instead of `<img>`).                                                           |
| **dotenv**             | ^16.5.0           | Loads `.env` file for Prisma CLI commands.                                                                                        |
| **pnpm**               | (package manager) | Faster and more disk-efficient than npm. Uses a content-addressable store so duplicate packages across projects share disk space. |

---

## Summary — How to Explain This Project

If you need to explain this to someone building a similar project, here's the elevator pitch:

> **"This is a full-stack Next.js app that lets developers sign in (with email or GitHub), connect their GitHub repositories, browse pull requests, view code diffs, and get AI-powered code reviews — all in one platform."**

The five pillars to communicate:

1. **How to Build It:** Next.js App Router + tRPC + Prisma + PostgreSQL. One codebase, full-stack, end-to-end type safety. No separate backend server needed.

2. **Database:** 6 tables — User, Session, Account (auth), Verification (auth), Repository (GitHub repo references), Review (AI review results with risk scores and per-line comments). All cascade-delete from User.

3. **Pages:** Landing page → auth pages (sign-in/sign-up) → protected dashboard → repos list → PR list → PR detail (diff viewer + AI review). Plus profile editing, settings, and error pages.

4. **Features:** Multi-provider auth with account linking, GitHub API integration (repos, PRs, diffs), AI code review with risk scoring, interactive diff viewer with unified/split modes, avatar upload with image cropping, session management, dark/light theme switching.

5. **Libraries:** Next.js + React (framework), tRPC + Prisma + Better Auth (backend), Tailwind + shadcn/ui + Radix (UI), GSAP (animations), Zod (validation), React Query (data fetching).
