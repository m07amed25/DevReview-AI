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

function buildProgressBar(value: number, max = 100, length = 20): string {
  const filled = Math.round((value / max) * length);
  return "█".repeat(filled) + "░".repeat(length - filled);
}

function severityEmoji(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "🔴";
    case "high":
      return "🟠";
    case "medium":
      return "🟡";
    default:
      return "🔵";
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

function qualityLetter(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

// ─── Self-hosted badge-maker helpers ─────────────────────────────────────────
// Badges are rendered server-side via our own /api/badge endpoint (badge-maker
// v5).  GitHub PR comments load Markdown images, so these appear as richly
// coloured inline SVG pills — no external shields.io dependency.

/**
 * Builds a URL to our self-hosted /api/badge endpoint.
 * Falls back to the BETTER_AUTH_URL env var when APP_BASE_URL is not set
 * (mirrors the review-URL logic elsewhere in this file).
 */
function badgeUrl(
  label: string,
  message: string,
  color: string,
  opts: { style?: string; labelColor?: string } = {},
): string {
  const base = process.env.APP_BASE_URL ?? process.env.BETTER_AUTH_URL ?? "";
  const style = opts.style ?? "flat-square";
  const params = new URLSearchParams({
    label,
    message,
    color,
    style,
    ...(opts.labelColor ? { labelColor: opts.labelColor } : {}),
  });
  return `${base}/api/badge?${params.toString()}`;
}

/**
 * Returns a Markdown image tag backed by badge-maker (via /api/badge).
 * Optionally wraps the image in a hyperlink.
 */
function badge(
  label: string,
  message: string,
  color: string,
  opts: { style?: string; labelColor?: string; link?: string } = {},
): string {
  const url = badgeUrl(label, message, color, opts);
  const alt = [label, message].filter(Boolean).join(": ");
  const img = `![${alt}](${url})`;
  return opts.link ? `[${img}](${opts.link})` : img;
}

/** badge-maker color for a 0-100 risk score */
function riskBadgeColor(score: number): string {
  if (score < 25) return "#2ea44f"; // GitHub green
  if (score < 50) return "#dbab09"; // GitHub yellow
  if (score < 75) return "#e36209"; // GitHub orange
  return "#cb2431"; // GitHub red
}

/** badge-maker color for a severity string */
function severityBadgeColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "critical"; // alias → #e05d44
    case "high":
      return "important"; // alias → #fe7d37
    case "medium":
      return "#dbab09";
    default:
      return "informational"; // alias → #007ec6
  }
}

/** badge-maker color for a 0-100 quality score */
function qualityBadgeColor(score: number): string {
  if (score >= 80) return "#2ea44f";
  if (score >= 60) return "#28a745";
  if (score >= 40) return "#dbab09";
  return "#cb2431";
}

/** badge-maker color for pass/fail overall status */
function statusBadgeColor(hasCritical: boolean, hasFailed: boolean): string {
  if (hasFailed) return "critical";
  if (hasCritical) return "important";
  return "#2ea44f";
}

function statusBadgeLabel(hasCritical: boolean, hasFailed: boolean): string {
  if (hasFailed) return "Error";
  if (hasCritical) return "Failed";
  return "Passed";
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
  /** Overall review processing status */
  overallStatus?: "COMPLETED" | "FAILED";
  hasHighSeverity?: boolean;
};

export function mapFindingsToReviewPayload(
  findings: unknown,
  repositoryId: string,
  reviewId: string,
  options?: Omit<ReviewPayloadOptions, "repositoryId" | "reviewId">,
): { body: string; inlineComments: ReviewComment[] } {
  const values = Array.isArray(findings) ? (findings as StoredFinding[]) : [];

  const appBaseUrl =
    process.env.APP_BASE_URL ?? process.env.BETTER_AUTH_URL ?? "";
  const reviewUrl = `${appBaseUrl}/repo/${repositoryId}/reviews/${reviewId}`;

  const prTitle = options?.prTitle ?? null;
  const commitSha = options?.commitSha ?? null;
  const aiSummary = options?.summary ?? null;
  const riskScore = options?.riskScore ?? null;
  const overallStatus = options?.overallStatus ?? "COMPLETED";
  const qmRaw = options?.qualityMetrics;
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
    const path =
      finding.filePath ?? finding.filename ?? finding.file ?? finding.path;
    if (path && typeof finding.line === "number" && finding.line > 0) {
      const severity = (
        finding.severity ??
        finding.severityLevel ??
        "low"
      ).toUpperCase();
      const text = finding.message ?? finding.text ?? "Issue detected";
      const emoji = severityEmoji(severity);
      // Shields.io badges for inline comments
      const sevBadge = badge(
        severity,
        "DevReview AI",
        severityBadgeColor(severity),
        { style: "flat-square" },
      );
      const catBadge = finding.category
        ? ` ${badge("category", finding.category, "blueviolet", { style: "flat-square" })}`
        : "";
      const confBadge =
        typeof finding.confidence === "number"
          ? ` ${badge("confidence", `${finding.confidence}%`, qualityBadgeColor(finding.confidence), { style: "flat-square" })}`
          : "";
      const suggestionLine = finding.suggestion
        ? `\n\n> 💡 **Suggestion**\n> ${finding.suggestion}`
        : "";

      const body = [
        `${emoji} ${sevBadge}${catBadge}${confBadge}`,
        "",
        `**Finding:** ${text}`,
        suggestionLine,
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
  const counts = {
    critical: values.filter(
      (f) => (f.severity ?? f.severityLevel ?? "").toLowerCase() === "critical",
    ).length,
    high: values.filter(
      (f) => (f.severity ?? f.severityLevel ?? "").toLowerCase() === "high",
    ).length,
    medium: values.filter(
      (f) => (f.severity ?? f.severityLevel ?? "").toLowerCase() === "medium",
    ).length,
    low: values.filter((f) => {
      const s = (f.severity ?? f.severityLevel ?? "").toLowerCase();
      return (
        s === "low" || (s !== "critical" && s !== "high" && s !== "medium")
      );
    }).length,
  };
  const totalIssues = values.length;
  const hasCritical = counts.critical > 0;
  const hasFailed = overallStatus === "FAILED";

  // ── Quality overall ──────────────────────────────────────────────────────
  const qualityOverall = qualityMetrics
    ? Math.round(
        (qualityMetrics.complexity +
          qualityMetrics.maintainability +
          qualityMetrics.readability +
          qualityMetrics.testability) /
          4,
      )
    : null;

  // ────────────────────────────────────────────────────────────────────────
  // Build the Markdown body
  // ────────────────────────────────────────────────────────────────────────
  const lines: string[] = [];

  // ── Title ─────────────────────────────────────────────────────────────────
  lines.push(`## 🤖 DevReview AI — Automated Code Review`);
  lines.push("");

  // ── Meta quote (PR title + commit) ───────────────────────────────────────
  const metaParts: string[] = [];
  if (prTitle) metaParts.push(`**PR:** ${prTitle}`);
  if (commitSha) metaParts.push(`**Commit:** \`${shortSha(commitSha)}\``);
  if (metaParts.length > 0) {
    lines.push(`> ${metaParts.join(" &nbsp;·&nbsp; ")}`);
    lines.push("");
  }

  // ── Hero badges (shields.io — for-the-badge style) ───────────────────────
  const heroBadges: string[] = [];

  heroBadges.push(
    badge(
      "Review",
      statusBadgeLabel(hasCritical, hasFailed),
      statusBadgeColor(hasCritical, hasFailed),
      { style: "for-the-badge", labelColor: "#24292e", link: reviewUrl },
    ),
  );
  if (riskScore !== null) {
    heroBadges.push(
      badge("Risk Score", `${riskScore} of 100`, riskBadgeColor(riskScore), {
        style: "for-the-badge",
        link: reviewUrl,
      }),
    );
  }
  heroBadges.push(
    badge(
      "Issues",
      totalIssues === 0 ? "None" : String(totalIssues),
      totalIssues === 0 ? "brightgreen" : hasCritical ? "critical" : "orange",
      { style: "for-the-badge", link: reviewUrl },
    ),
  );
  if (qualityOverall !== null) {
    heroBadges.push(
      badge(
        "Quality",
        `${qualityLetter(qualityOverall)} (${qualityOverall}/100)`,
        qualityBadgeColor(qualityOverall),
        { style: "for-the-badge", link: reviewUrl },
      ),
    );
  }

  lines.push(heroBadges.join(" "));
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Risk Assessment ────────────────────────────────────────────────────────
  if (riskScore !== null) {
    lines.push(`### ${riskEmoji(riskScore)} Risk Assessment`);
    lines.push("");
    lines.push("| | |");
    lines.push("|:---|:---|");
    lines.push(
      `| **Risk Score** | ${badge(riskLabel(riskScore), `${riskScore}/100`, riskBadgeColor(riskScore))} |`,
    );
    lines.push(
      `| **Total Issues** | **${totalIssues}**${inlineComments.length > 0 ? ` _(${inlineComments.length} inline comment${inlineComments.length !== 1 ? "s" : ""})_` : ""} |`,
    );
    lines.push("");
    lines.push(`\`Safe ${buildProgressBar(riskScore, 100, 24)} Critical\``);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── AI Summary ────────────────────────────────────────────────────────────
  if (aiSummary) {
    lines.push(`### 📝 AI Summary`);
    lines.push("");
    lines.push(`> ${aiSummary.replace(/\n/g, "\n> ")}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── Issue Breakdown ────────────────────────────────────────────────────────
  if (totalIssues > 0) {
    lines.push("### 📊 Issue Breakdown");
    lines.push("");

    // Colored severity pill badges
    const sevBadges: string[] = [];
    if (counts.critical > 0)
      sevBadges.push(
        badge("Critical", String(counts.critical), "critical", {
          style: "flat-square",
        }),
      );
    if (counts.high > 0)
      sevBadges.push(
        badge("High", String(counts.high), "important", {
          style: "flat-square",
        }),
      );
    if (counts.medium > 0)
      sevBadges.push(
        badge("Medium", String(counts.medium), "yellow", {
          style: "flat-square",
        }),
      );
    if (counts.low > 0)
      sevBadges.push(
        badge("Low", String(counts.low), "informational", {
          style: "flat-square",
        }),
      );
    lines.push(sevBadges.join(" "));
    lines.push("");

    lines.push("| Severity | Count | Distribution | Share |");
    lines.push("|:---------|------:|:-------------|------:|");
    const row = (emoji: string, lbl: string, count: number) => {
      const pct = Math.round((count / totalIssues) * 100);
      return `| ${emoji} **${lbl}** | ${count} | \`${buildProgressBar(count, totalIssues, 14)}\` | ${pct}% |`;
    };
    if (counts.critical > 0) lines.push(row("🔴", "Critical", counts.critical));
    if (counts.high > 0) lines.push(row("🟠", "High", counts.high));
    if (counts.medium > 0) lines.push(row("🟡", "Medium", counts.medium));
    if (counts.low > 0) lines.push(row("🔵", "Low", counts.low));
    lines.push(`| — | **${totalIssues}** | | 100% |`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── Quality Metrics ────────────────────────────────────────────────────────
  if (qualityMetrics && qualityOverall !== null) {
    lines.push("### 📐 Quality Metrics");
    lines.push("");

    // Grade badges row
    const qBadges = [
      badge(
        "Complexity",
        qualityLetter(qualityMetrics.complexity),
        qualityBadgeColor(qualityMetrics.complexity),
        { style: "flat-square" },
      ),
      badge(
        "Maintainability",
        qualityLetter(qualityMetrics.maintainability),
        qualityBadgeColor(qualityMetrics.maintainability),
        { style: "flat-square" },
      ),
      badge(
        "Readability",
        qualityLetter(qualityMetrics.readability),
        qualityBadgeColor(qualityMetrics.readability),
        { style: "flat-square" },
      ),
      badge(
        "Testability",
        qualityLetter(qualityMetrics.testability),
        qualityBadgeColor(qualityMetrics.testability),
        { style: "flat-square" },
      ),
      badge(
        "Overall",
        qualityLetter(qualityOverall),
        qualityBadgeColor(qualityOverall),
        { style: "flat-square" },
      ),
    ];
    lines.push(qBadges.join(" "));
    lines.push("");

    lines.push("| Metric | Score | Bar | Grade |");
    lines.push("|:-------|------:|:----|:------|");
    const qRow = (label: string, score: number) =>
      `| ${label} | ${score}/100 | \`${buildProgressBar(score, 100, 12)}\` | ${qualityGrade(score)} |`;
    lines.push(qRow("Complexity", qualityMetrics.complexity));
    lines.push(qRow("Maintainability", qualityMetrics.maintainability));
    lines.push(qRow("Readability", qualityMetrics.readability));
    lines.push(qRow("Testability", qualityMetrics.testability));
    lines.push(
      `| **Overall** | **${qualityOverall}/100** | \`${buildProgressBar(qualityOverall, 100, 12)}\` | **${qualityGrade(qualityOverall)}** |`,
    );
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── General Findings ──────────────────────────────────────────────────────
  if (summaryFindings.length > 0) {
    lines.push("### ⚠️ General Findings");
    lines.push("");
    lines.push(`<details>`);
    lines.push(
      `<summary>📋 View ${summaryFindings.length} general finding${summaryFindings.length !== 1 ? "s" : ""}</summary>`,
    );
    lines.push("");
    for (const finding of summaryFindings) {
      const severity = (
        finding.severity ??
        finding.severityLevel ??
        "low"
      ).toUpperCase();
      const text = finding.message ?? finding.text ?? "Issue detected";
      const emoji = severityEmoji(severity);
      const sevBadge = badge(severity, "", severityBadgeColor(severity), {
        style: "flat-square",
      });
      const catBadge = finding.category
        ? ` ${badge("", finding.category, "blueviolet", { style: "flat-square" })}`
        : "";
      lines.push(`- ${emoji} ${sevBadge}${catBadge} ${text}`);
      if (finding.suggestion) {
        lines.push(`  > 💡 **Suggestion:** ${finding.suggestion}`);
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
    lines.push(
      badge("Status", "Clean", "#2ea44f", {
        style: "for-the-badge",
      }),
    );
    lines.push("");
    lines.push(
      "> 🎉 Excellent! No issues were detected. The code appears clean, secure, and well-structured.",
    );
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerBadge = badge("DevReview AI", "Automated Review", "#24292e", {
    style: "flat-square",
    labelColor: "#586069",
    link: reviewUrl,
  });
  const footerParts = [footerBadge, `[📋 View Full Report](${reviewUrl})`];
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

    try {
      await dismissGitHubReviewFn(
        accessToken,
        review.repository.fullName,
        review.prNumber,
        Number(previous.githubReviewId),
        `Superseded by a new DevReview AI review after commit ${completedEvent.data.commitSha}`,
      );
    } catch (err) {
      // GitHub returns 422 for COMMENT-type reviews which cannot be dismissed.
      // This is non-fatal — the new review will still be posted.
      console.warn(
        `[dismiss-previous-review] Could not dismiss review ${previous.githubReviewId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  });

  await step.run("post-pr-review", async () => {
    const payload = mapFindingsToReviewPayload(
      review.comments,
      review.repositoryId,
      review.id,
      {
        prTitle: review.prTitle,
        commitSha: completedEvent.data.commitSha,
        summary: review.summary,
        riskScore: review.riskScore,
        qualityMetrics: review.qualityMetrics,
        overallStatus: completedEvent.data.status,
        hasHighSeverity: completedEvent.data.hasHighSeverity,
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
        githubReviewId: BigInt(githubReviewId),
        prNumber: completedEvent.data.prNumber,
        repositoryId: review.repositoryId,
        commitSha: completedEvent.data.commitSha,
        findingCount: payload.inlineComments.length,
      },
      update: {
        githubReviewId: BigInt(githubReviewId),
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
