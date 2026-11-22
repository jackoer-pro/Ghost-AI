import "server-only"

import { clerkClient } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import type { CollaboratorView, PersonView } from "@/lib/projects"

/** Project collaborators, oldest first, enriched with Clerk name/avatar when a user exists for the email. */
export async function listCollaborators(projectId: string): Promise<CollaboratorView[]> {
  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  })
  if (rows.length === 0) return []

  const profiles = await findClerkProfiles(rows.map((r) => r.email))
  return rows.map((r) => {
    const profile = profiles.get(r.email.toLowerCase())
    return { id: r.id, email: r.email, name: profile?.name ?? null, imageUrl: profile?.imageUrl ?? null }
  })
}

/** The owner as shown in the share dialog; null if the project or Clerk user is gone. */
export async function getOwnerProfile(projectId: string): Promise<PersonView | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } })
  if (!project) return null
  try {
    const user = await (await clerkClient()).users.getUser(project.ownerId)
    return {
      email: user.primaryEmailAddress?.emailAddress ?? null,
      name: user.fullName || user.username || null,
      imageUrl: user.hasImage ? user.imageUrl : null,
    }
  } catch (err) {
    console.error("Clerk owner lookup failed", err)
    return null
  }
}

interface ClerkProfile {
  name: string | null
  imageUrl: string | null
}

// One Clerk Backend API call for all emails. Enrichment is best-effort: if
// Clerk is unreachable the dialog still lists emails.
async function findClerkProfiles(emails: string[]): Promise<Map<string, ClerkProfile>> {
  const profiles = new Map<string, ClerkProfile>()
  try {
    const client = await clerkClient()
    // ponytail: one page of 100; paginate if a project ever has more collaborators.
    const { data: users } = await client.users.getUserList({ emailAddress: emails, limit: 100 })
    for (const user of users) {
      const profile = {
        name: user.fullName || user.username || null,
        imageUrl: user.hasImage ? user.imageUrl : null,
      }
      for (const { emailAddress } of user.emailAddresses) {
        profiles.set(emailAddress.toLowerCase(), profile)
      }
    }
  } catch (err) {
    console.error("Clerk collaborator lookup failed", err)
  }
  return profiles
}
