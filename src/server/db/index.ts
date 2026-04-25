import { PrismaClient } from "./client";

const createPrismaClient = () => {
  let url = process.env.DATABASE_URL;

  if (url) {
    try {
      const parsedUrl = new URL(url);

      if (!parsedUrl.searchParams.has("connect_timeout")) {
        parsedUrl.searchParams.set("connect_timeout", "30");
      }
      if (!parsedUrl.searchParams.has("pool_timeout")) {
        parsedUrl.searchParams.set("pool_timeout", "30");
      }

      if (
        process.env.NODE_ENV !== "production" &&
        !parsedUrl.searchParams.has("connection_limit")
      ) {
        parsedUrl.searchParams.set("connection_limit", "5");
      }

      url = parsedUrl.toString();
    } catch {
      console.warn("Could not parse DATABASE_URL to inject connection limits.");
    }
  }

  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
  });
};

const globalPrismaClient = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalPrismaClient.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalPrismaClient.prisma = db;
}

/**
 * Wraps a Prisma operation with a single retry on P1001 (Can't reach database).
 * This handles Neon's auto-pause cold-start: the first request wakes the compute,
 * and the retry succeeds once the server is ready.
 */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const isConnectionError =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P1001";

    if (isConnectionError) {
      // Wait briefly for Neon compute to finish waking up, then retry once
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return await fn();
    }

    throw err;
  }
}
