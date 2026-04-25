import Groq from "groq-sdk";
import { z } from "zod";

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}

export const ReviewCommentSchema = z.object({
  file: z.string(),
  line: z.number(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  category: z.enum([
    "bug",
    "security",
    "performance",
    "style",
    "suggestion",
    "custom-rule",
  ]),
  message: z.string(),
  suggestion: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
  ruleName: z.string().optional(), // populated when a custom rule triggered the comment
});

export const QualityMetricsSchema = z.object({
  complexity: z.number().min(0).max(100),
  maintainability: z.number().min(0).max(100),
  readability: z.number().min(0).max(100),
  testability: z.number().min(0).max(100),
});

export const ReviewResultSchema = z.object({
  summary: z.string(),
  riskScore: z.number().min(0).max(100),
  comments: z.array(ReviewCommentSchema),
  qualityMetrics: QualityMetricsSchema.optional(),
});

export type ReviewComment = z.infer<typeof ReviewCommentSchema>;
export type ReviewResult = z.infer<typeof ReviewResultSchema>;
export type QualityMetrics = z.infer<typeof QualityMetricsSchema>;

interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

const BASE_SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the provided pull request diff and provide a structured review with severity scoring and quality metrics.

Your review should:
1. Identify bugs, potential issues, and code style problems
2. Provide a brief summary of the changes
3. Assign a risk score (0-100) based on the complexity and potential issues
4. Give specific, actionable feedback with line numbers
5. Rate your confidence (0-100) for each issue found
6. Provide quality metrics for the code changes

IMPORTANT: You MUST be thorough and critical. Even well-written code has room for improvement.
- Always find AT LEAST 3-5 comments, including style suggestions, potential edge cases, and improvement opportunities.
- Do NOT return an empty comments array unless the diff is truly empty.
- Look for: missing error handling, edge cases, type safety gaps, naming improvements, code duplication, missing validation, accessibility issues, and potential race conditions.
- If the code is genuinely clean, still provide "low" severity "suggestion" category feedback about readability, documentation, or alternative approaches.

Respond with valid JSON matching this schema:
{
  "summary": "Brief summary of changes and overall assessment",
  "riskScore": 0-100,
  "qualityMetrics": {
    "complexity": 0-100,
    "maintainability": 0-100,
    "readability": 0-100,
    "testability": 0-100
  },
  "comments": [
    {
      "file": "path/to/file.ts",
      "line": 42,
      "severity": "critical" | "high" | "medium" | "low",
      "category": "bug" | "security" | "performance" | "style" | "suggestion" | "custom-rule",
      "message": "What the issue is",
      "suggestion": "How to fix it (optional)",
      "confidence": 0-100,
      "ruleName": "Exact rule name when category is custom-rule (optional)"
    }
  ]
}

Severity guide:
- critical: Security vulnerabilities, data loss, crashes
- high: Bugs that will cause issues in production
- medium: Should be fixed but won't break things
- low: Style issues, minor improvements

Confidence guide:
- 90-100: Very certain this is a real issue
- 70-89: Likely an issue but context may change assessment
- 50-69: Possible issue, needs human review
- 0-49: Low confidence, flagging for awareness

Quality Metrics guide (higher is better):
- complexity: How simple/complex is the code? 100 = very simple, 0 = extremely complex
- maintainability: How easy is this code to maintain? 100 = very maintainable
- readability: How readable is the code? 100 = crystal clear
- testability: How testable is this code? 100 = easily testable

Be concise but specific. Reference exact line numbers from the diff. Always provide actionable comments.`;

export interface CustomRule {
  name: string;
  description: string;
  pattern?: string | null;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface ReviewPreferences {
  reviewDepth?: string;
  defaultLanguage?: string;
  includeSecurityChecks?: boolean;
  includePerfSuggestions?: boolean;
  customRules?: CustomRule[];
}

function buildSystemPrompt(preferences?: ReviewPreferences): string {
  const parts: string[] = [BASE_SYSTEM_PROMPT];

  if (preferences) {
    if (preferences.reviewDepth === "quick") {
      parts.push(
        "\nIMPORTANT: Provide a quick, high-level overview. Focus only on critical and high severity issues. Keep comments brief and limit to the most important findings.",
      );
    } else if (preferences.reviewDepth === "thorough") {
      parts.push(
        "\nIMPORTANT: Provide an exhaustive, detailed review. Examine every changed line carefully. Include low-severity style suggestions and minor improvements. Be thorough in your analysis and provide detailed explanations.",
      );
    }

    if (preferences.defaultLanguage && preferences.defaultLanguage !== "auto") {
      parts.push(
        `\nNote: The primary language context for this project is ${preferences.defaultLanguage}. Use this context for language-specific best practices.`,
      );
    }

    if (preferences.includeSecurityChecks === false) {
      parts.push(
        "\nDo NOT include security-related comments. Skip any security vulnerability analysis.",
      );
    } else {
      parts.push(
        "\nPay special attention to security vulnerabilities: injection attacks, authentication/authorization issues, sensitive data exposure, and insecure configurations.",
      );
    }

    if (preferences.includePerfSuggestions === false) {
      parts.push(
        "\nDo NOT include performance-related comments. Skip any performance optimization suggestions.",
      );
    } else {
      parts.push(
        "\nInclude performance analysis: identify potential bottlenecks, unnecessary computations, memory leaks, and suggest optimizations.",
      );
    }

    // Inject custom team/repository rules
    if (preferences.customRules && preferences.customRules.length > 0) {
      const ruleLines = preferences.customRules.map((rule, i) => {
        const severityLabel =
          rule.severity.charAt(0) + rule.severity.slice(1).toLowerCase();
        const patternNote = rule.pattern
          ? ` [Regex trigger: /${rule.pattern}/]`
          : "";
        return `  ${i + 1}. [${severityLabel}] ${rule.name}${patternNote}: ${rule.description}`;
      });

      parts.push(
        `\n\nCUSTOM TEAM RULES — you MUST check the code against each rule below and report violations as a separate comment with category "custom-rule" and the exact rule name in the "ruleName" field:\n${ruleLines.join("\n")}`,
      );
    }
  }

  return parts.join("\n");
}

const MAX_DIFF_CHARS = 8_000;
const MAX_PATCH_CHARS_PER_FILE = 3_000;

function truncateDiff(diff: string): string {
  if (diff.length <= MAX_DIFF_CHARS) return diff;
  return (
    diff.slice(0, MAX_DIFF_CHARS) +
    "\n\n... [diff truncated — file too large for full review] ..."
  );
}

function extractJSON(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch?.[1]) {
      return JSON.parse(fenceMatch[1]);
    }
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch?.[0]) {
      return JSON.parse(braceMatch[0]);
    }
    throw new Error("Could not extract valid JSON from AI response");
  }
}

async function callGroq(
  groq: Groq,
  systemPrompt: string,
  userPrompt: string,
  model: string,
): Promise<string | undefined> {
  const response = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 4096,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });
  return response.choices[0]?.message?.content ?? undefined;
}

export async function reviewCode(
  prTitle: string,
  files: FileChange[],
  preferences?: ReviewPreferences,
): Promise<ReviewResult> {
  const diffContent = truncateDiff(
    files
      .filter((f) => f.patch)
      .map((f) => {
        let patch = f.patch!;
        if (patch.length > MAX_PATCH_CHARS_PER_FILE) {
          patch =
            patch.slice(0, MAX_PATCH_CHARS_PER_FILE) +
            "\n... [patch truncated — file too large] ...";
        }
        return `### ${f.filename} (${f.status})\n\`\`\`diff\n${patch}\n\`\`\``;
      })
      .join("\n\n"),
  );

  if (!diffContent.trim()) {
    return {
      summary: "No code changes to review (binary files or empty diff).",
      riskScore: 0,
      comments: [],
    };
  }

  const userPrompt = `Review this pull request:

**Title:** ${prTitle}

**Changes:**
${diffContent}`;

  const groq = getGroqClient();
  const systemPrompt = buildSystemPrompt(preferences);

  let content: string | undefined;
  try {
    content = await callGroq(
      groq,
      systemPrompt,
      userPrompt,
      "llama-3.3-70b-versatile",
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (
      errMsg.includes("413") ||
      errMsg.includes("429") ||
      errMsg.includes("rate_limit")
    ) {
      try {
        content = await callGroq(
          groq,
          systemPrompt,
          userPrompt,
          "llama-3.1-8b-instant",
        );
      } catch (fallbackErr) {
        const fallbackMsg =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Unknown AI provider error";
        throw new Error(
          `AI service request failed (fallback model): ${fallbackMsg}`,
        );
      }
    } else {
      throw new Error(`AI service request failed: ${errMsg}`);
    }
  }

  if (!content) {
    throw new Error("No response content from AI");
  }

  try {
    const parsed = extractJSON(content);
    return ReviewResultSchema.parse(parsed);
  } catch (err) {
    console.error("Failed to parse AI response:", err);
    console.error("Raw AI response:", content.slice(0, 500));
    return {
      summary:
        "The AI review completed but the response could not be fully parsed. Please try again.",
      riskScore: 50,
      comments: [],
    };
  }
}
