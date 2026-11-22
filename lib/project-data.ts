import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import type { ProjectSummary } from "@/lib/projects"

export interface EditorProjects {
  owned: ProjectSummary[]
  shared: ProjectSummary[]
}

/** Projects the signed-in user owns, and projects shared with their primary email. */
export async function getEditorProjects(): Promise<EditorProjects> {
  const { userId } = await auth()
  if (!userId) return { owned: [], shared: [] }

  const email = (await currentUser())?.primaryEmailAddress?.emailAddress
  const select = { id: true, name: true } as const
  const orderBy = { createdAt: "desc" } as const

  const [owned, shared] = await Promise.all([
    prisma.project.findMany({ where: { ownerId: userId }, select, orderBy }),
    email
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: { some: { email: { equals: email, mode: "insensitive" } } },
          },
          select,
          orderBy,
        })
      : [],
  ])

  return {
    owned: owned.map((p) => ({ ...p, isOwner: true })),
    shared: shared.map((p) => ({ ...p, isOwner: false })),
  }
}
