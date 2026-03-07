# DevReview AI - Code Review Action Items

> Generated: 2026-03-07

---

## Priority 1: Critical Improvements

### 1.1 Extract Shared Utility Function

- **Issue**: Duplicate `getAccessibleRepository` function in `pull-request.ts` and `review.ts`
- **Action**: Create `src/lib/repository.ts` with shared `getAccessibleRepository` function
- **Files to modify**:
  - `src/server/api/routers/pull-request.ts` (remove duplicate, import from lib)
  - `src/server/api/routers/review.ts` (remove duplicate, import from lib)
- **Status**: `[done]`

---

### 1.2 Fix Type Safety in review.ts

- **Issue**: Using `any` type for database parameter in `getAccessibleRepository`
- **Action**: Replace `any` with proper `PrismaClient` type
- **File**: `src/server/api/routers/review.ts:15`
- **Status**: `[done]`

---

### 1.3 Add React Error Boundaries

- **Issue**: No error boundaries - full app crashes on component errors
- **Action**: Create ErrorBoundary component and wrap major sections
- **Files to create**:
  - `src/components/error-boundary.tsx`
- **Files to modify**:
  - `src/app/(dashboard)/layout.tsx`
  - `src/app/layout.tsx`
- **Status**: `[done]`

---

### 1.4 Implement Rate Limiting

- **Issue**: No rate limiting on API endpoints - vulnerable to abuse
- **Action**: Add rate limiting middleware using Upstash Redis or simple in-memory solution
- **Files to create**:
  - `src/lib/rate-limit.ts`
- **Files to modify**:
  - `src/server/api/trpc.ts`
- **Status**: `[done]`

---

### 1.5 Remove Empty/Unused File

- **Issue**: Empty `swagger.ts` file
- **Action**: Delete the empty file
- **File**: `src/lib/swagger.ts`
- **Status**: `[done]`

---

## Priority 2: High Value Features

### 2.1 Review History & Analytics Dashboard

- **Issue**: Users need visibility into review trends and team performance
- **Action**: Create analytics page with review metrics, trends, common issues
- **Files to create**:
  - `src/app/(dashboard)/analytics/page.tsx`
  - `src/server/api/routers/analytics.ts`
- **Status**: `[done]`

---

### 2.2 Add Email Notifications

- **Issue**: Notifications stored but not delivered via email
- **Action**: Implement email delivery using Resend (already in dependencies)
- **Files to modify**:
  - `src/server/api/routers/notification.ts`
  - `src/server/email/index.ts`
- **Status**: `[ ]`

---

### 2.3 Scheduled/Recurring Reviews

- **Issue**: No support for automated periodic reviews
- **Action**: Add ability to schedule recurring reviews for branches
- **Files to modify**:
  - `src/server/inngest/functions/`
  - `prisma/schema.prisma` (add ScheduledReview model)
- **Status**: `[ ]`

---

### 2.4 Review Templates

- **Issue**: No way to define custom review rules
- **Action**: Add review templates with custom rules and checklists
- **Files to modify**:
  - `prisma/schema.prisma` (add ReviewTemplate model)
  - `src/server/api/routers/settings.ts`
- **Status**: `[ ]`

---

## Priority 3: Enhanced Features

### 3.1 Slack/Discord Integration

- **Issue**: No external notifications beyond in-app
- **Action**: Add Slack/Discord webhook integration for review notifications
- **Files to create**:
  - `src/server/services/slack.ts`
  - `src/server/api/routers/integrations.ts`
- **Status**: `[ ]`

---

### 3.2 Code Change Visualization

- **Issue**: No commit history or branch visualization
- **Action**: Add commit timeline and branch visualization
- **Files to create**:
  - `src/components/code-timeline.tsx`
- **Files to modify**:
  - `src/app/(dashboard)/repo/[id]/page.tsx`
- **Status**: `[ ]`

---

### 3.3 AI Model Comparison

- **Issue**: Users cannot compare different AI models
- **Action**: Allow running reviews with multiple AI providers and compare results
- **Files to modify**:
  - `src/server/services/ai.ts` (add model selection)
  - `src/app/(dashboard)/repo/[id]/pr/[prNumber]/page.tsx`
- **Status**: `[ ]`

---

## Priority 4: Technical Improvements

### 4.1 Add Response Caching

- **Issue**: No caching - repeated API calls for same data
- **Action**: Add Redis cache for frequently accessed data
- **Files to create**:
  - `src/lib/cache.ts`
- **Status**: `[ ]`

---

### 4.2 Implement Virtualized Lists

- **Issue**: Large diff/file lists impact performance
- **Action**: Use react-window for virtualized rendering
- **Files to modify**:
  - `src/components/diff-viewer.tsx`
- **Status**: `[ ]`

---

### 4.3 Add Bundle Analysis

- **Issue**: No bundle size monitoring
- **Action**: Add @next/bundle-analyzer and analyze results
- **Files to modify**:
  - `next.config.ts`
  - `package.json` (add script)
- **Status**: `[ ]`

---

### 4.4 Add E2E Tests

- **Issue**: No end-to-end tests
- **Action**: Add Playwright tests for critical flows
- **Files to create**:
  - `tests/e2e/`
- **Status**: `[ ]`

---

### 4.5 Add Environment Validation

- **Issue**: No runtime validation for required env vars
- **Action**: Add startup validation script
- **Files to create**:
  - `src/lib/env-validator.ts`
- **Status**: `[ ]`

---

### 4.6 Add CSRF Protection

- **Issue**: No CSRF token verification
- **Action**: Implement CSRF protection for state-changing operations
- **Files to modify**:
  - `src/middleware.ts`
- **Status**: `[ ]`

---

## Code Quality Fixes (Quick Wins)

### Remove console.log statements

- **Files**: `src/server/api/routers/team.ts:669, 677`
- **Status**: `[ ]`

---

### Use Enum for Action Types

- **Issue**: Magic strings for action types in `team.ts`
- **Action**: Create proper TypeScript enum
- **File**: `src/server/api/routers/team.ts:11`
- **Status**: `[ ]`

---

## Summary

| Priority                | Items  |
| ----------------------- | ------ |
| Priority 1 (Critical)   | 5      |
| Priority 2 (High Value) | 4      |
| Priority 3 (Enhanced)   | 3      |
| Priority 4 (Technical)  | 6      |
| Quick Wins              | 2      |
| **Total**               | **20** |
