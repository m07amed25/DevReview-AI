import type { PrismaClient } from "@/server/db/client";

/**
 * Repository type returned by getAccessibleRepository
 */
export type AccessibleRepository = Awaited<
  ReturnType<PrismaClient["repository"]["findUnique"]>
>;

/**
 * Get a repository the user can access — either as owner or team member.
 * Returns the repository if the user has access, or null if not found/unauthorized.
 *
 * @param db - The Prisma client instance
 * @param userId - The ID of the user requesting access
 * @param repositoryId - The ID of the repository to access
 * @returns The repository if accessible, or null if not found/unauthorized
 */
export async function getAccessibleRepository(
  db: PrismaClient,
  userId: string,
  repositoryId: string,
): Promise<AccessibleRepository> {
  if (!db || typeof db.repository === "undefined") {
    throw new Error("Invalid database client instance");
  }

  // Check if user owns the repository directly
  const ownedRepo = await db.repository.findUnique({
    where: { id: repositoryId, userId },
  });
  if (ownedRepo) return ownedRepo;

  // Check if user is a member of a team that has access to this repository
  return db.repository.findFirst({
    where: {
      id: repositoryId,
      team: { members: { some: { userId } } },
    },
  });
}
