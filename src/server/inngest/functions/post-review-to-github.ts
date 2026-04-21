import { db } from "@/server/db";
import { inngest } from "../client";
import {
  dismissGitHubReview,
  getGitHubAccessToken,
  postCommitStatus,
  submitPullRequestReview,
  type ReviewComment,
} from "@/server/services/github";
import { generateRepositoryRecommendations } from "@/server/api/routers/automation";

type ReviewCompletedEvent = {
  name: "review/pr.completed";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
    commitSha: string;
    status: "COMPLETED" | "FAILED";
    hasHighSeverity: boolean;
  };
};

type StoredFinding = {
  // location variants
  filePath?: string;
  filename?: string;
  file?: string;
  path?: string;
  line?: number;
  // message variants
  message?: string;
  text?: string;
  // severity variants
  severity?: string;
  severityLevel?: string;
  // enrichment
  category?: string;
  suggestion?: string;
  confidence?: number;
};

interface QualityMetricsData {
  complexity: number;
  maintainability: number;
  readability: number;
  testability: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProgressBar(value: number, max = 100, length = 20): string {
  const filled = Math.round((value / max) * length);
  return "█".repeat(filled) + "░".repeat(length - filled);
}

function severityEmoji(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical": return "🔴";
    case "high":     return "🟠";
    case "medium":   return "🟡";
    default:         return "🔵";
  }
}

function riskEmoji(score: number): string {
  if (score < 25) return "🟢";
  if (score < 50) return "🟡";
  if (score < 75) return "🟠";
  return "🔴";
}

function riskLabel(score: number): string {
  if (score < 25) return "Low Risk";
  if (score < 50) return "Medium Risk";
  if (score < 75) return "High Risk";
  return "Critical Risk";
}

function qualityGrade(score: number): string {
  if (score >= 80) return "✅ Excellent";
  if (score >= 60) return "🟢 Good";
  if (score >= 40) return "⚠️ Fair";
  return "❌ Needs Work";
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 90) return "Very High";
  if (confidence >= 70) return "High";
  if (confidence >= 50) return "Medium";
  return "Low";
}

function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

// ─── Main Payload Builder ─────────────────────────────────────────────────────

export type ReviewPayloadOptions = {
  repositoryId: string;
  reviewId: string;
  prTitle?: string;
  commitSha?: string;
  summary?: string | null;
  riskScore?: number | null;
  qualityMetrics?: unknown;
};

export function mapFindingsToReviewPayload(
  findings: unknown,
  repositoryId: string,
  reviewId: string,
  options?: Omit<ReviewPayloadOptions, "repositoryId" | "reviewId">,
): { body: string; inlineComments: ReviewComment[] } {
  const values = Array.isArray(findings) ? (findings as StoredFinding[]) : [];

  const appBaseUrl = process.env.APP_BASE_URL ?? process.env.BETTER_AUTH_URL ?? "";
  const reviewUrl = `${appBaseUrl}/repo/${repositoryId}/reviews/${reviewId}`;

  const prTitle    = options?.prTitle ?? null;
  const commitSha  = options?.commitSha ?? null;
  const aiSummary  = options?.summary ?? null;
  const riskScore  = options?.riskScore ?? null;
  const qmRaw      = options?.qualityMetrics;
  const qualityMetrics: QualityMetricsData | null =
    qmRaw &&
    typeof qmRaw === "object" &&
    !Array.isArray(qmRaw) &&
    "complexity" in (qmRaw as Record<string, unknown>)
      ? (qmRaw as QualityMetricsData)
      : null;

  // ── Categorise findings ──────────────────────────────────────────────────
  const inlineComments: ReviewComment[] = [];
  const summaryFindings: StoredFinding[] = [];

  for (const finding of values) {
    const path = finding.filePath ?? finding.filename ?? finding.file ?? finding.path;
    if (path && typeof finding.line === "number" && finding.line > 0) {
      const severity    = (finding.severity ?? finding.severityLevel ?? "low").toUpperCase();
      const text        = finding.message ?? finding.text ?? "Issue detected";
      const emoji       = severityEmoji(severity);
      const categoryLine = finding.category
        ? `\n**Category:** \`${finding.category}\``
        : "";
      const suggestionLine = finding.suggestion
        ? `\n\n> 💡 **Suggestion:** ${finding.suggestion}`
        : "";
      const confidenceLine = typeof finding.confidence === "number"
        ? `\n\n_AI Confidence: **${finding.confidence}%** (${confidenceLabel(finding.confidence)})_`
        : "";

      const body = [
        `### ${emoji} ${severity} — DevReview AI`,
        "",
        `**Finding:**`,
        text,
        categoryLine,
        suggestionLine,
        confidenceLine,
        "",
        "---",
        `🤖 [View full review ↗](${reviewUrl})`,
      ].join("\n");

      inlineComments.push({ path, line: finding.line, body });
    } else {
      summaryFindings.push(finding);
    }
  }

  // ── Severity counts ──────────────────────────────────────────────────────
  const allFindings = values;
  const counts = {
    critical: allFindings.filter(f => (f.severity ?? f.severityLevel ?? "").toLowerCase() === "critical").length,
    high:     allFindings.filter(f => (f.severity ?? f.severityLevel ?? "").toLowerCase() === "high").length,
    medium:   allFindings.filter(f => (f.severity ?? f.severityLevel ?? "").toLowerCase() === "medium").length,
    low:      allFindings.filter(f => {
      const s = (f.severity ?? f.severityLevel ?? "").toLowerCase();
      return s === "low" || (s !== "critical" && s !== "high" && s !== "medium");
    }).length,
  };
  const totalIssues = allFindings.length;

  // ── Build summary comment body ───────────────────────────────────────────
  const lines: string[] = [];

  // Header
  lines.push(`## 🤖 DevReview AI — Automated Code Review`);
  lines.push("");

  // Meta line
  const metaParts: string[] = [];
  if (prTitle)   metaParts.push(`**PR:** ${prTitle}`);
  if (commitSha) metaParts.push(`**Commit:** \`${shortSha(commitSha)}\``);
  if (riskScore !== null) {
    metaParts.push(`**Risk Score:** ${riskEmoji(riskScore)} ${riskScore}/100 — ${riskLabel(riskScore)}`);
  }
  if (metaParts.length > 0) {
    lines.push(`> ${metaParts.join(" &nbsp;·&nbsp; ")}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // Risk Score Section
  if (riskScore !== null) {
    lines.push(`### ${riskEmoji(riskScore)} Risk Score: ${riskScore}/100 — ${riskLabel(riskScore)}`);
    lines.push("");
    lines.push(`\`Safe ${buildProgressBar(riskScore)} Critical\``);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // AI Summary
  if (aiSummary) {
    lines.push("### 📝 AI Summary");
    lines.push("");
    lines.push(`> ${aiSummary.replace(/\n/g, "\n> ")}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Issue Breakdown
  if (totalIssues > 0) {
    lines.push("### 🔢 Issue Breakdown");
    lines.push("");
    lines.push("| Severity | Count | Distribution |");
    lines.push("|----------|------:|--------------|");
    if (counts.critical > 0)
      lines.push(`| 🔴 Critical | ${counts.critical} | \`${buildProgressBar(counts.critical, totalIssues, 12)}\` |`);
    if (counts.high > 0)
      lines.push(`| 🟠 High | ${counts.high} | \`${buildProgressBar(counts.high, totalIssues, 12)}\` |`);
    if (counts.medium > 0)
      lines.push(`| 🟡 Medium | ${counts.medium} | \`${buildProgressBar(counts.medium, totalIssues, 12)}\` |`);
    if (counts.low > 0)
      lines.push(`| 🔵 Low | ${counts.low} | \`${buildProgressBar(counts.low, totalIssues, 12)}\` |`);
    lines.push(`| **Total** | **${totalIssues}** | ${inlineComments.length > 0 ? `_${inlineComments.length} inline comment${inlineComments.length !== 1 ? "s" : ""}_ ` : ""} |`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Quality Metrics
  if (qualityMetrics) {
    const overall = Math.round(
      (qualityMetrics.complexity + qualityMetrics.maintainability +
       qualityMetrics.readability + qualityMetrics.testability) / 4,
    );
    lines.push("### 📐 Quality Metrics");
    lines.push("");
    lines.push("| Metric | Score | Bar | Grade |");
    lines.push("|--------|------:|-----|-------|");
    lines.push(`| Complexity | ${qualityMetrics.complexity}/100 | \`${buildProgressBar(qualityMetrics.complexity, 100, 10)}\` | ${qualityGrade(qualityMetrics.complexity)} |`);
    lines.push(`| Maintainability | ${qualityMetrics.maintainability}/100 | \`${buildProgressBar(qualityMetrics.maintainability, 100, 10)}\` | ${qualityGrade(qualityMetrics.maintainability)} |`);
    lines.push(`| Readability | ${qualityMetrics.readability}/100 | \`${buildProgressBar(qualityMetrics.readability, 100, 10)}\` | ${qualityGrade(qualityMetrics.readability)} |`);
    lines.push(`| Testability | ${qualityMetrics.testability}/100 | \`${buildProgressBar(qualityMetrics.testability, 100, 10)}\` | ${qualityGrade(qualityMetrics.testability)} |`);
    lines.push(`| **Overall** | **${overall}/100** | \`${buildProgressBar(overall, 100, 10)}\` | **${qualityGrade(overall)}** |`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // General Findings (not tied to a specific file/line)
  if (summaryFindings.length > 0) {
    lines.push("### ⚠️ General Findings");
    lines.push("");
    lines.push(`<details>`);
    lines.push(`<summary>View ${summaryFindings.length} general finding${summaryFindings.length !== 1 ? "s" : ""}</summary>`);
    lines.push("");
    for (const finding of summaryFindings) {
      const severity = (finding.severity ?? finding.severityLevel ?? "low").toUpperCase();
      const text = finding.message ?? finding.text ?? "Issue detected";
      const emoji = severityEmoji(severity);
      const categoryTag = finding.category ? ` \`${finding.category}\`` : "";
      lines.push(`- ${emoji} **[${severity}]**${categoryTag} ${text}`);
      if (finding.suggestion) {
        lines.push(`  > 💡 ${finding.suggestion}`);
      }
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
    lines.push("---");
    lines.push("");
  } else if (totalIssues === 0) {
    lines.push("### ✅ No Issues Found");
    lines.push("");
    lines.push("> 🎉 Excellent! No issues were detected. The code appears clean, secure, and well-structured.");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Footer
  const footerParts: string[] = [
    `🤖 Powered by **DevReview AI**`,
    `[📋 View Full Report](${reviewUrl})`,
  ];
  if (commitSha) footerParts.push(`Commit: \`${shortSha(commitSha)}\``);
  lines.push(`<sub>${footerParts.join(" · ")}</sub>`);

  return { body: lines.join("\n"), inlineComments };
}

type PostReviewStep = {
  run: <T>(id: string, fn: () => Promise<T>) => Promise<unknown>;
};

type PostReviewDeps = {
  dbClient: typeof db;
  getGitHubAccessTokenFn: typeof getGitHubAccessToken;
  dismissGitHubReviewFn: typeof dismissGitHubReview;
  submitPullRequestReviewFn: typeof submitPullRequestReview;
  postCommitStatusFn: typeof postCommitStatus;
  generateRepositoryRecommendationsFn: typeof generateRepositoryRecommendations;
};

const defaultDeps: PostReviewDeps = {
  dbClient: db,
  getGitHubAccessTokenFn: getGitHubAccessToken,
  dismissGitHubReviewFn: dismissGitHubReview,
  submitPullRequestReviewFn: submitPullRequestReview,
  postCommitStatusFn: postCommitStatus,
  generateRepositoryRecommendationsFn: generateRepositoryRecommendations,
};

export async function runPostReviewToGitHub(
  completedEvent: ReviewCompletedEvent,
  step: PostReviewStep,
  deps: PostReviewDeps = defaultDeps,
) {
  const {
    dbClient,
    getGitHubAccessTokenFn,
    dismissGitHubReviewFn,
    submitPullRequestReviewFn,
    postCommitStatusFn,
    generateRepositoryRecommendationsFn,
  } = deps;

  const reviewData = (await step.run("get-review", async () => {
    const review = await dbClient.review.findUnique({
      where: { id: completedEvent.data.reviewId },
      include: {
        repository: true,
        user: true,
      },
    });

    if (!review) return null;

    const accessToken = await getGitHubAccessTokenFn(review.repository.userId);
    return { review, accessToken };
  })) as {
    review: {
      id: string;
      repositoryId: string;
      prNumber: number;
      prTitle: string;
      summary: string | null;
      riskScore: number | null;
      comments: unknown;
      qualityMetrics: unknown;
      repository: { fullName: string; userId: string };
      user: { id: string };
    };
    accessToken: string | null;
  } | null;

  if (!reviewData || !reviewData.accessToken) {
    return { success: false, reason: "Missing review or token" };
  }

  const { review, accessToken } = reviewData;

  await step.run("dismiss-previous-review", async () => {
    const previous = await dbClient.gitHubComment.findFirst({
      where: {
        repositoryId: review.repositoryId,
        prNumber: review.prNumber,
        reviewId: { not: review.id },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!previous) return;

    await dismissGitHubReviewFn(
      accessToken,
      review.repository.fullName,
      review.prNumber,
      previous.githubReviewId,
      `Superseded by a new DevReview AI review after commit ${completedEvent.data.commitSha}`,
    );
  });

  await step.run("post-pr-review", async () => {
    const payload = mapFindingsToReviewPayload(
      review.comments,
      review.repositoryId,
      review.id,
      {
        prTitle:        review.prTitle,
        commitSha:      completedEvent.data.commitSha,
        summary:        review.summary,
        riskScore:      review.riskScore,
        qualityMetrics: review.qualityMetrics,
      },
    );

    const githubReviewId = await submitPullRequestReviewFn(
      accessToken,
      review.repository.fullName,
      completedEvent.data.prNumber,
      completedEvent.data.commitSha,
      payload.body,
      payload.inlineComments,
    );

    await dbClient.gitHubComment.upsert({
      where: { reviewId: review.id },
      create: {
        reviewId: review.id,
        githubReviewId,
        prNumber: completedEvent.data.prNumber,
        repositoryId: review.repositoryId,
        commitSha: completedEvent.data.commitSha,
        findingCount: payload.inlineComments.length,
      },
      update: {
        githubReviewId,
        commitSha: completedEvent.data.commitSha,
        findingCount: payload.inlineComments.length,
      },
    });
  });

  await step.run("update-status-check", async () => {
    const state: "success" | "failure" | "error" =
      completedEvent.data.status === "FAILED"
        ? "error"
        : completedEvent.data.hasHighSeverity
          ? "failure"
          : "success";

    const description =
      state === "success"
        ? "DevReview AI — no critical issues"
        : state === "failure"
          ? "DevReview AI — critical issues found"
          : "DevReview AI — review processing failed";

    await postCommitStatusFn(
      accessToken,
      review.repository.fullName,
      completedEvent.data.commitSha,
      state,
      review.id,
      description,
    );

    await dbClient.gitHubStatusCheck.upsert({
      where: { reviewId: review.id },
      create: {
        reviewId: review.id,
        commitSha: completedEvent.data.commitSha,
        state:
          state === "success"
            ? "SUCCESS"
            : state === "failure"
              ? "FAILURE"
              : "ERROR",
      },
      update: {
        commitSha: completedEvent.data.commitSha,
        state:
          state === "success"
            ? "SUCCESS"
            : state === "failure"
              ? "FAILURE"
              : "ERROR",
      },
    });
  });

  await step.run("generate-recommendations", async () => {
    const completedCount = await dbClient.review.count({
      where: { repositoryId: review.repositoryId, status: "COMPLETED" },
    });

    if (completedCount < 3) return;

    await generateRepositoryRecommendationsFn(dbClient, review.repositoryId);
  });

  return { success: true };
}

export const postReviewToGitHub = inngest.createFunction(
  { id: "post-review-to-github", retries: 3 },
  { event: "review/pr.completed" },
  async ({ event, step }) =>
    runPostReviewToGitHub(event as ReviewCompletedEvent, step, defaultDeps),
);









