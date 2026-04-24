import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "../db";
import { auth } from "../auth";
import {
  getClientIP,
  getAPIKey,
  buildIdentifier,
  getDefaultConfig,
  RateLimiterFactory,
  type RateLimitRule,
} from "./rate-limiter/index";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });
  return {
    db,
    session,
    headers: opts.headers,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        ZodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

// Initialize rate limiter with default config
const rateLimiter = RateLimiterFactory.initialize({
  ...getDefaultConfig(),
  onViolation: (data) => {
    console.warn("[RateLimit] Violation:", {
      identifier: data.identifier,
      endpoint: data.endpoint,
      limit: data.limit,
      resetTime: data.resetTime,
    });
  },
  onThreshold: (data) => {
    console.info("[RateLimit] Approaching limit:", {
      identifier: data.identifier,
      endpoint: data.endpoint,
      percentage: data.percentage,
      remaining: data.limit - data.currentCount,
    });
  },
});

// Default rate limit rule
const defaultRule: RateLimitRule = {
  name: "default",
  limit: 100,
  window: "minute",
  burst: 10,
  identifier: "ip",
};

// Whitelisted IPs that bypass rate limiting
const whitelistIPs = new Set(["127.0.0.1", "::1", "localhost"]);

export const publicProcedure = t.procedure.use(async ({ ctx, next, path }) => {
  // Get client IP from headers
  const clientIP = getClientIP(ctx.headers) || "unknown";

  // Skip rate limiting for whitelisted IPs
  if (whitelistIPs.has(clientIP)) {
    return next();
  }

  // Get API key if available
  const apiKey = getAPIKey(ctx.headers);

  // Build identifier
  const identifier = buildIdentifier(clientIP, apiKey, defaultRule.identifier);

  // Check rate limit
  const result = await rateLimiter.check(identifier, path, defaultRule);

  // If rate limit exceeded
  if (!result.success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: result.error || "Too many requests",
      cause: {
        retryAfter: result.retryAfter,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
    });
  }

  return next();
});

export const protectedProcedure = t.procedure.use(
  async ({ ctx, next, path }) => {
    // Get client IP from headers
    const clientIP = getClientIP(ctx.headers) || "unknown";

    // Skip rate limiting for whitelisted IPs
    if (!whitelistIPs.has(clientIP)) {
      // Get API key if available
      const apiKey = getAPIKey(ctx.headers);

      // Build identifier with both IP and API key for authenticated users
      const identifier = buildIdentifier(clientIP, apiKey, "ip+apiKey");

      // Check rate limit with higher limit for authenticated users
      const userRule: RateLimitRule = {
        ...defaultRule,
        name: "authenticated",
        limit: 500,
        burst: 50,
      };

      const result = await rateLimiter.check(identifier, path, userRule);

      if (!result.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: result.error || "Too many requests",
          cause: {
            retryAfter: result.retryAfter,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
          },
        });
      }
    }

    // Continue with auth check
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user: ctx.session.user,
      },
    });
  },
);

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const dbUser = await ctx.db.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { id: true, role: true },
  });

  if (dbUser?.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});
