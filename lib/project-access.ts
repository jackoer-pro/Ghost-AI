import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import type { ProjectSummary } from "@/lib/projects"

export interface Identity {
  userId: string
  /** Primary email; null if the Clerk user has none. */
  email: string | null
}

/** The signed-in Clerk user, or null when signed out. */
export async function getCurrentIdentity(): Promise<Identity | null> {
  const { userId } = await auth()
  if (!userId) return null
  const email = (await currentUser())?.primaryEmailAddress?.emailAddress ?? null
  return { userId, email }
}

/** Prisma filter: projects the identity owns or collaborates on (email match is case-insensitive). */
export function accessibleBy({ userId, email }: Identity) {
  return {
    OR: [
      { ownerId: userId },
      ...(email ? [{ collaborators: { some: { email: { equals: email, mode: "insensitive" as const } } } }] : []),
    ],
  }
}

/** The project if the identity is its owner or a collaborator; null if missing or no access. */
export async function getProjectForUser(
  projectId: string,
  identity: Identity
): Promise<ProjectSummary | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...accessibleBy(identity) },
    select: { id: true, name: true, ownerId: true },
  })
  if (!project) return null
  return { id: project.id, name: project.name, isOwner: project.ownerId === identity.userId }
}
