# DevReview AI — Feature Plan

## 1. AI Review Improvements

### 1.1 Multi-Model Comparison

Allow users to run a review with multiple AI providers simultaneously and display results side by side, so developers can compare responses from OpenAI, Gemini, and Groq for the same diff.

### 1.2 Inline AI Chat on Diff

Add a comment thread on any diff line where users can ask follow-up questions to the AI ("why is this a security issue?", "show me a fix") without leaving the review page.

### 1.3 Review Severity Scoring

Attach a severity score (Critical / High / Medium / Low / Info) to each AI finding and surface a summary badge on the PR card so teams can triage at a glance.

### 1.4 Custom Review Rules

Let users define project-specific rules (e.g., "flag any use of `console.log`", "enforce naming conventions") that are injected into the AI prompt before each review.

---

## 2. GitHub Integration Enhancements

### 2.1 Auto-Review on PR Open

Add a GitHub App webhook flow that automatically triggers a DevReview AI review whenever a pull request is opened or updated, posting results back as PR comments.

### 2.2 Review Status Badge

Provide a dynamic SVG badge (`/api/badge/:repo`) that repo owners can embed in their README showing the latest review score.

### 2.3 Branch Protection Integration

Surface a pass/fail status check on GitHub pull requests based on the AI review score, enabling branch protection rules to block merges below a threshold.

---

## 3. Collaborative Review

### 3.1 Review Assignment

Allow team leads to assign a review to one or more team members, with due dates and priority labels.

### 3.2 Threaded Comments with Reactions

Support emoji reactions on comments and nested reply threads, keeping discussions organised within a review.

### 3.3 Review Request Approval Flow

Add a formal approval workflow: reviewers can Approve, Request Changes, or Comment, mirroring the GitHub review model inside DevReview AI.

---

## 4. Analytics & Reporting

### 4.1 Per-Developer Insights

Show each developer their personal metrics: average review turnaround time, most common issue categories, improvement trend over time.

### 4.2 Repository Health Score

Aggregate review data into a single health score per repository, displayed on the repo card and tracked over time on the analytics dashboard.

### 4.3 Exportable Reports

Let users export review summaries and analytics as PDF or CSV for inclusion in sprint retrospectives or compliance audits.

### 4.4 Team Leaderboard

Gamify reviews with an opt-in leaderboard showing reviews completed, bugs caught, and participation rate across the team.

---

## 5. Code Intelligence

### 5.1 Code Timeline Enrichment

Enrich the existing code-timeline view with AI-generated summaries of what changed in each commit and why it matters.

### 5.2 Dependency Vulnerability Scan

Integrate with OSV / Snyk API to flag known CVEs in `package.json` / `requirements.txt` during review.

### 5.3 Dead Code Detection

Highlight unused exports, unreachable branches, and unused variables as a dedicated AI review category.

---

## 6. Developer Experience

### 6.1 VS Code Extension

Build a lightweight VS Code extension that shows DevReview AI comments inline in the editor, synced with the web app in real time.

### 6.2 CLI Tool (`devreview`)

Provide a CLI that developers can run locally (`devreview review --diff HEAD~1`) to get AI feedback before pushing.

### 6.3 Keyboard Shortcuts

Add a global keyboard shortcut palette (⌘K / Ctrl+K) across the dashboard for quick navigation, triggering reviews, and searching repositories.

### 6.4 Dark / Light / System Theme Toggle

Expose a three-way theme toggle (dark, light, system) in the user settings panel.

---

## 7. Administration & Security

### 7.1 Audit Log Improvements

Extend the existing audit log with IP address, user agent, and geolocation data, and add CSV export.

### 7.2 SSO / SAML Support

Add enterprise SSO support via SAML 2.0 / OIDC for organisations that require centralised identity management.

### 7.3 Fine-grained RBAC

Introduce custom roles (e.g., Viewer, Reviewer, Manager, Admin) with per-feature permission flags configurable in the admin panel.

### 7.4 Data Retention Policies

Allow admins to configure automatic deletion of review data older than N days to comply with data residency requirements.

---

## 8. Notifications & Communication

### 8.1 Slack / Discord Integration

Send review-complete and mention notifications to Slack or Discord channels via webhook, configurable per team.

### 8.2 Digest Emails

Send a weekly digest email to each developer summarising open reviews, unresolved comments, and team activity.

### 8.3 In-App Notification Centre

Expand the current notifications component into a full notification centre with read/unread state, filtering, and a notification preference page.

---

## Priority Order (suggested)

| Priority | Feature                           |
| -------- | --------------------------------- |
| P0       | 2.1 Auto-Review on PR Open        |
| P0       | 1.3 Review Severity Scoring       |
| P1       | 3.3 Review Request Approval Flow  |
| P1       | 4.1 Per-Developer Insights        |
| P1       | 1.2 Inline AI Chat on Diff        |
| P2       | 6.3 Keyboard Shortcut Palette     |
| P2       | 8.1 Slack / Discord Integration   |
| P2       | 5.2 Dependency Vulnerability Scan |
| P3       | 6.1 VS Code Extension             |
| P3       | 6.2 CLI Tool                      |
