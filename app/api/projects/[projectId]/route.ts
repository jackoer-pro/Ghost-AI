import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { parseProjectName } from "@/lib/projects"

type Ctx = RouteContext<"/api/projects/[projectId]">

// Returns an error Response, or null when the signed-in user owns the project.
async function checkOwner(projectId: string): Promise<Response | null> {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })
  if (!project) return Response.json({ error: "Not found" }, { status: 404 })
  if (project.ownerId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 })
  return null
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { projectId } = await ctx.params
  const denied = await checkOwner(projectId)
  if (denied) return denied

  const body: unknown = await req.json().catch(() => null)
  const name = parseProjectName((body as { name?: unknown } | null)?.name)
  if (!name) return Response.json({ error: "Invalid project name" }, { status: 400 })

  const project = await prisma.project.update({ where: { id: projectId }, data: { name } })
  return Response.json({ project })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { projectId } = await ctx.params
  const denied = await checkOwner(projectId)
  if (denied) return denied

  await prisma.project.delete({ where: { id: projectId } })
  return new Response(null, { status: 204 })
}
