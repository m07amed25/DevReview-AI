# DevReview-AI — Fix & Enhancement Plan

## 🐛 Bugs / Compile Errors

### 1. Unused Import in `HomeFooter.tsx`
- **File:** [src/features/home/components/HomeFooter.tsx](src/features/home/components/HomeFooter.tsx#L12)
- **Issue:** `ExternalLink` is imported from `lucide-react` but never used, causing a TypeScript compile error.
- **Fix:** Remove `ExternalLink` from the import list.

---

## 🔧 TODOs / Incomplete Features

### 2. Missing Email Notification for Critical Security Issues
- **File:** [src/server/inngest/functions/security-scan.ts](src/server/inngest/functions/security-scan.ts#L205)
- **Issue:** `// TODO: Send email notification about critical security issues` — when a security scan finds critical severity issues, no email is sent to the repository owner.
- **Fix:** Implement email notification using the existing `email` service, similar to how `review-completed` email is sent.

### 3. "Coming Soon" Pages are Placeholder Links
- **File:** [src/features/home/components/HomeFooter.tsx](src/features/home/components/HomeFooter.tsx#L21)
- **Issue:** Ten footer links are flagged `soon: true` (Pricing, Changelog, API Reference, Status, Blog, About, Privacy Policy, Terms of Service, Security, Contact) — clicking them navigates to non-existent routes.
- **Fix:** Either implement placeholder pages with a "coming soon" message, or disable navigation on `soon` links (e.g., render as `<span>` instead of `<Link>`).

---

## ⚠️ Code Quality / Lint Suppressions to Address

### 4. Multiple `@typescript-eslint/no-explicit-any` suppressions
- **Files:**
  - [src/server/api/routers/team.ts](src/server/api/routers/team.ts#L655), [line 826](src/server/api/routers/team.ts#L826)
  - [src/server/api/rate-limiter/middleware.ts](src/server/api/rate-limiter/middleware.ts#L75)
  - [src/components/ui/chart.tsx](src/components/ui/chart.tsx#L122)
  - [src/components/animate-ui/primitives/animate/slot.tsx](src/components/animate-ui/primitives/animate/slot.tsx#L19)
- **Issue:** `any` types bypass TypeScript safety; each suppression is a potential type error at runtime.
- **Fix:** Replace `any` with proper typed interfaces or use `unknown` with type guards.

### 5. Missing React Hook Dependencies (`react-hooks/exhaustive-deps`)
- **Files:**
  - [src/features/diagram/components/diagram-viewer.tsx](src/features/diagram/components/diagram-viewer.tsx#L521), [line 529](src/features/diagram/components/diagram-viewer.tsx#L529)
  - [src/features/review/index.tsx](src/features/review/index.tsx#L70)
  - [src/features/profile/components/image-cropper.tsx](src/features/profile/components/image-cropper.tsx#L148)
  - [src/features/review/components/comment-card.tsx](src/features/review/components/comment-card.tsx#L273)
- **Issue:** `eslint-disable-next-line react-hooks/exhaustive-deps` suppresses stale closure warnings that can cause subtle bugs.
- **Fix:** Audit each `useEffect`/`useCallback` and either add missing deps or restructure with `useRef` to avoid stale values.

### 6. `require()` Instead of ES Import in `audit.ts`
- **File:** [src/server/services/audit.ts](src/server/services/audit.ts#L8)
- **Issue:** `geoip-lite` is loaded via `require()` with an eslint suppression; dynamic optional import would be cleaner and fully typed.
- **Fix:** Use a dynamic `import()` with `catch` or move to a conditional import pattern compatible with ESM.

---

## 🚨 Security & Safety Concerns

### 7. `console.log` Leaking in Production GitHub Service
- **File:** [src/server/services/github.ts](src/server/services/github.ts#L409)
- **Issue:** Three `console.log` calls in the `registerWebhook` flow expose internal webhook IDs and repo details in server logs.
- **Fix:** Remove or replace with a structured logger (e.g. `pino`) gated behind `process.env.NODE_ENV !== "production"`.

### 8. Mermaid `securityLevel: "loose"` in Diagram Viewer
- **File:** [src/features/diagram/components/diagram-viewer.tsx](src/features/diagram/components/diagram-viewer.tsx)
- **Issue:** `securityLevel: "loose"` disables Mermaid's built-in XSS sanitisation. If user-supplied diagram definitions are rendered, this is an XSS vector.
- **Fix:** Sanitize diagram definitions server-side before storing, and switch to `securityLevel: "strict"` or `"antiscript"`.

### 9. Singleton Groq Client Without Request Isolation
- **File:** [src/server/services/ai.ts](src/server/services/ai.ts#L3)
- **Issue:** A module-level `groqClient` singleton is fine for server use, but if the API key is rotated at runtime the singleton will hold the old key.
- **Fix:** Consider re-reading `process.env.GROQ_API_KEY` per request, or expose a `resetClient()` function for key rotation scenarios.

---

## 🚀 Enhancement Opportunities

### 10. No Pagination on `fetchPullRequests`
- **File:** [src/server/services/github.ts](src/server/services/github.ts)
- **Issue:** Pull requests are fetched with `per_page=30` without paginating further, so repositories with more than 30 PRs silently drop the rest.
- **Fix:** Use the existing `fetchAllPages` helper for the pull-requests endpoint.

### 11. AI Provider Lock-in (Groq Only)
- **File:** [src/server/services/ai.ts](src/server/services/ai.ts#L1)
- **Issue:** The review engine is hard-wired to Groq/Llama. There is no fallback or provider abstraction.
- **Enhancement:** Introduce a provider interface so OpenAI, Anthropic, or Azure OpenAI can be swapped in via env config without code changes.

### 12. Missing Loading / Empty States in Analytics Page
- **File:** [src/app/(dashboard)/analytics/page.tsx](src/app/(dashboard)/analytics/page.tsx)
- **Enhancement:** Add skeleton loaders and zero-data empty states so the page doesn't flash blank content before data loads.

### 13. No Rate Limit Feedback in UI
- **File:** [src/server/api/rate-limiter/middleware.ts](src/server/api/rate-limiter/middleware.ts)
- **Enhancement:** When the server returns a `429 Too Many Requests` response, surface a user-friendly toast/banner in the UI showing when the limit resets (`Retry-After` header).

### 14. Scheduled Scan — Sequential Loop Over Configs
- **File:** [src/server/inngest/functions/scheduled-scan.ts](src/server/inngest/functions/scheduled-scan.ts)
- **Issue:** Scan configs are processed one-by-one in a `for` loop inside a single Inngest step, which blocks if one repo is slow.
- **Enhancement:** Fan out each config as an individual Inngest event so they execute in parallel and failures are isolated.

### 15. `inviteMember` Email Validation Duplication
- **File:** [src/server/api/routers/team.ts](src/server/api/routers/team.ts)
- **Issue:** The `inviteMember` input schema calls `.email().max(255).email()` — `.email()` is applied twice unnecessarily.
- **Fix:** Remove the duplicate `.email()` call.

### 16. Missing Pagination for Notifications
- **File:** [src/app/api](src/app/api), [src/hooks/use-realtime-notifications.tsx](src/hooks/use-realtime-notifications.tsx)
- **Enhancement:** The notifications list currently loads all notifications at once. Add cursor-based pagination to avoid large payloads for users with many notifications.

### 17. No Test Coverage
- **Issue:** There are no test files (`*.test.ts`, `*.spec.ts`) anywhere in the workspace.
- **Enhancement:** Add unit tests for critical paths:
  - `src/server/services/ai.ts` — `parseAIResponse`, `sanitizePromptField`
  - `src/server/services/github.ts` — token expiry logic
  - `src/server/api/rate-limiter/` — rate limit enforcement
  - `src/lib/review-diff.ts` — diff parsing utilities

---

## 📋 Missing Pages / Routes

| Route | Status | Action |
|-------|--------|--------|
| `/pricing` | Not created | Create pricing page or redirect |
| `/changelog` | Not created | Create changelog page |
| `/docs/api` | Not created | Create API docs or redirect to external docs |
| `/status` | Not created | Create status page or link to external service |
| `/blog` | Not created | Create blog index or redirect |
| `/about` | Not created | Create about page |
| `/privacy` | Not created | Create privacy policy page |
| `/terms` | Not created | Create terms of service page |
| `/security` | Not created | Create security disclosure page |
| `/contact` | Not created | Create contact page or form |
