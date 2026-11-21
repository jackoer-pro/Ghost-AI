import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { parseProjectName } from "@/lib/projects"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  })
  return Response.json({ projects })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await req.json().catch(() => ({}))
  const raw = (body as { name?: unknown } | null)?.name

  // Missing or blank name → default; anything else must be a valid name.
  const isBlank = raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")
  const name = isBlank ? "Untitled Project" : parseProjectName(raw)
  if (!name) return Response.json({ error: "Invalid project name" }, { status: 400 })

  const project = await prisma.project.create({ data: { ownerId: userId, name } })
  return Response.json({ project }, { status: 201 })
}
