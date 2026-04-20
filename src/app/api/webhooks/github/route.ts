import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/server/db";
import { inngest } from "@/server/inngest";
import { getGitHubAccessToken, postCommitStatus } from "@/server/services/github";

const pullRequestPayloadSchema = z.object({
  action: z.string(),
  pull_request: z.object({
    number: z.number().int(),
    title: z.string(),
    html_url: z.string().url(),
    draft: z.boolean().optional().default(false),
    head: z.object({
      sha: z.string().min(1),
    }),
  }),
  repository: z.object({
    id: z.number().int(),
    full_name: z.string().min(1),
  }),
});

function verifySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    // In production, always require webhook secret — fail closed.
    if (process.env.NODE_ENV === "production") {
      console.error("GITHUB_WEBHOOK_SECRET is not set in production!");
      return false;
    }
    console.warn("GITHUB_WEBHOOK_SECRET not set, skipping verification (dev only)");
    return true;
  }

  if (!signature) {
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  // Verify the webhook signature
  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Only handle pull_request events
  if (event !== "pull_request") {
    return NextResponse.json({ message: "Event ignored" }, { status: 200 });
  }

  const parsedPayload = pullRequestPayloadSchema.safeParse(JSON.parse(payload));
  if (!parsedPayload.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 200 });
  }

  const data = parsedPayload.data;

  // Only trigger on open, synchronize (new commits), or reopen
  if (!["opened", "synchronize", "reopened"].includes(data.action)) {
    return NextResponse.json(
      { message: `Action '${data.action}' ignored` },
      { status: 200 },
    );
  }

  // Skip draft PRs
  if (data.pull_request.draft) {
    return NextResponse.json({ message: "Draft PR ignored" }, { status: 200 });
  }

  // Find the repository in our database
  const repository = await db.repository.findFirst({
    where: { githubId: data.repository.id },
    include: { user: true },
  });

  if (!repository) {
    return NextResponse.json(
      { message: "Repository not connected" },
      { status: 200 },
    );
  }

  const webhookConfig = await db.webhookConfig.findUnique({
    where: { repositoryId: repository.id },
    select: { enabled: true },
  });

  if (!webhookConfig?.enabled) {
    return NextResponse.json({ message: "Auto-review disabled" }, { status: 200 });
  }

  // Check if there's already a review in progress
  const existingReview = await db.review.findFirst({
    where: {
      repositoryId: repository.id,
      prNumber: data.pull_request.number,
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });

  if (existingReview) {
    return NextResponse.json(
      { message: "Review already in progress" },
      { status: 200 },
    );
  }

  // Create a new review record
  const review = await db.review.create({
    data: {
      repositoryId: repository.id,
      userId: repository.userId,
      prNumber: data.pull_request.number,
      prTitle: data.pull_request.title,
      prUrl: data.pull_request.html_url,
      status: "PENDING",
    },
  });

  // Trigger the Inngest job
  await inngest.send({
    name: "review/pr.requested",
    data: {
      reviewId: review.id,
      repositoryId: repository.id,
      prNumber: data.pull_request.number,
      userId: repository.userId,
    },
  });

  // Post pending status check in background (do not block webhook response).
  void (async () => {
    try {
      const accessToken = await getGitHubAccessToken(repository.userId);
      if (!accessToken) return;

      await postCommitStatus(
        accessToken,
        data.repository.full_name,
        data.pull_request.head.sha,
        "pending",
        review.id,
        "DevReview AI — review in progress",
      );

      await db.gitHubStatusCheck.upsert({
        where: { reviewId: review.id },
        create: {
          reviewId: review.id,
          commitSha: data.pull_request.head.sha,
          state: "PENDING",
        },
        update: {
          commitSha: data.pull_request.head.sha,
          state: "PENDING",
        },
      });
    } catch (error) {
      console.error("Failed to post pending status check", error);
    }
  })();

  return NextResponse.json(
    { message: "Review triggered", reviewId: review.id },
    { status: 200 },
  );
}
