import { auth } from "@clerk/nextjs/server"

import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { parseProjectId, parseProjectName } from "@/lib/projects"

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

  const body = ((await req.json().catch(() => null)) ?? {}) as { name?: unknown; id?: unknown }

  // Missing or blank name → default; anything else must be a valid name.
  const raw = body.name
  const isBlank = raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")
  const name = isBlank ? "Untitled Project" : parseProjectName(raw)
  if (!name) return Response.json({ error: "Invalid project name" }, { status: 400 })

  // Optional client-built ID so the project ID and Liveblocks room ID match.
  // Without one, the schema's cuid default is used.
  const id = body.id === undefined ? undefined : parseProjectId(body.id)
  if (id === null) return Response.json({ error: "Invalid project ID" }, { status: 400 })

  try {
    const project = await prisma.project.create({ data: { id, ownerId: userId, name } })
    return Response.json({ project }, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return Response.json({ error: "Project ID already taken" }, { status: 409 })
    }
    throw err
  }
}
