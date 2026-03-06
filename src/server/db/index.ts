import { PrismaClient } from "./client";

const createPrismaClient = () => {
  let url = process.env.DATABASE_URL;
  
  if (url && process.env.NODE_ENV !== "production") {
    try {
      // Create a URL object to safely parse and append query parameters
      const parsedUrl = new URL(url);
      
      // Prevent connection timeouts during frequent HMR and parallel requests
      if (!parsedUrl.searchParams.has("connection_limit")) {
        parsedUrl.searchParams.set("connection_limit", "50");
      }
      if (!parsedUrl.searchParams.has("pool_timeout")) {
        parsedUrl.searchParams.set("pool_timeout", "20");
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
