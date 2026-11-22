import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import type { ProjectSummary } from "@/lib/projects"

export interface Identity {
  userId: string
  /** Verified primary email; null if the user has none or it isn't verified. */
  email: string | null
}

/** The signed-in Clerk user, or null when signed out. */
export async function getCurrentIdentity(): Promise<Identity | null> {
  const { userId } = await auth()
  if (!userId) return null
  const primary = (await currentUser())?.primaryEmailAddress
  // Collaborator access is granted by email, so an unverified address must
  // never count: otherwise anyone could sign up with an invited address.
  const email = primary?.verification?.status === "verified" ? primary.emailAddress : null
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

export interface AuthorizedProject {
  identity: Identity
  project: ProjectSummary
}

const jsonError = (error: string, status: number) => Response.json({ error }, { status })

/**
 * API guard. Returns the identity + project, or an error Response to send back:
 * 401 signed out; 404 missing (or, for member access, not a member, so IDs
 * aren't revealed); 403 when `ownerOnly` and the user is only a collaborator
 * or a stranger.
 */
export async function authorizeProject(
  projectId: string,
  access: "member" | "owner"
): Promise<AuthorizedProject | Response> {
  const identity = await getCurrentIdentity()
  if (!identity) return jsonError("Unauthorized", 401)

  if (access === "member") {
    const project = await getProjectForUser(projectId, identity)
    return project ? { identity, project } : jsonError("Not found", 404)
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  })
  if (!project) return jsonError("Not found", 404)
  if (project.ownerId !== identity.userId) return jsonError("Forbidden", 403)
  return { identity, project: { id: project.id, name: project.name, isOwner: true } }
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
