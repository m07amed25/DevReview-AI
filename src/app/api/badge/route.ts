import { NextRequest, NextResponse } from "next/server";
import { makeBadge, type Format } from "badge-maker";
import {
  RateLimiterFactory,
  getClientIP,
  getDefaultConfig,
  buildIdentifier,
  type RateLimitRule,
} from "@/server/api/rate-limiter";

const badgeRateLimiter = RateLimiterFactory.initialize({
  ...getDefaultConfig(),
  redisUrl: process.env.UPSTASH_REDIS_REST_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const badgeRule: RateLimitRule = {
  name: "badge",
  limit: 60,
  window: "minute",
  burst: 10,
  identifier: "ip",
};

const ALLOWED_STYLES = new Set([
  "flat",
  "flat-square",
  "plastic",
  "for-the-badge",
  "social",
]);

const COLOR_ALIASES: Record<string, string> = {
  critical: "#e05d44",
  important: "#fe7d37",
  success: "#4c1",
  informational: "#007ec6",
  inactive: "#9f9f9f",
};

function resolveColor(raw: string): string {
  return COLOR_ALIASES[raw.toLowerCase()] ?? raw;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Apply IP-level rate limiting even for this public endpoint to prevent DoS.
  const clientIP = getClientIP(request.headers) ?? "unknown";
  const identifier = buildIdentifier(clientIP, null, "ip");
  const rlResult = await badgeRateLimiter.check(
    identifier,
    "/api/badge",
    badgeRule,
  );
  if (!rlResult.success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(rlResult.retryAfter ?? 60),
        "X-RateLimit-Limit": String(rlResult.limit),
        "X-RateLimit-Remaining": String(rlResult.remaining),
      },
    });
  }

  const { searchParams } = request.nextUrl;

  const label = searchParams.get("label") ?? "";
  const message =
    searchParams.get("message") ?? searchParams.get("value") ?? "";
  const color = resolveColor(searchParams.get("color") ?? "lightgrey");
  const labelColor = resolveColor(searchParams.get("labelColor") ?? "#555");
  const rawStyle = searchParams.get("style") ?? "flat-square";
  const style = ALLOWED_STYLES.has(rawStyle)
    ? (rawStyle as Format["style"])
    : "flat-square";

  let svg: string;
  try {
    svg = makeBadge({ label, message, color, labelColor, style });
  } catch {
    svg = makeBadge({
      label: "badge",
      message: "error",
      color: "#e05d44",
      style: "flat-square",
    });
  }

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
