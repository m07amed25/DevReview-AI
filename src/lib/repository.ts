import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@/server/db/client";

/**
 * Repository type returned by getAccessibleRepository
 */
export type AccessibleRepository = NonNullable<
  Awaited<ReturnType<PrismaClient["repository"]["findUnique"]>>
>;

/**
 * Get a repository the user can access — either as owner or team member.
 * Throws NOT_FOUND error if repository doesn't exist or user lacks access.
 *
 * @param db - The Prisma client instance
 * @param userId - The ID of the user requesting access
 * @param repositoryId - The ID of the repository to access
 * @returns The repository if accessible
 * @throws TRPCError with NOT_FOUND code if repository doesn't exist or access denied
 */
export async function getAccessibleRepository(
  db: PrismaClient,
  userId: string,
  repositoryId: string,
): Promise<AccessibleRepository> {
  if (!db || typeof db.repository === "undefined") {
    throw new Error("Invalid database client instance");
  }

  // Single query to find repository accessible by owner OR team membership
  const repository = await db.repository.findFirst({
    where: {
      id: repositoryId,
      OR: [{ userId }, { team: { members: { some: { userId } } } }],
    },
  });

  if (!repository) {
    // Check if repository exists at all to provide specific error message
    const exists = await db.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!exists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Repository not found",
      });
    }

    // Repository exists but user doesn't have access
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this repository",
    });
  }

  return repository;
}
