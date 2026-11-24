import { del } from "@vercel/blob"

import { Prisma } from "@/lib/generated/prisma/client"
import { authorizeProject } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { parseProjectName } from "@/lib/projects"
import { readJsonBody } from "@/lib/request"

// The project can be deleted between the owner check and the write (P2025).
const isGone = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"

type Ctx = RouteContext<"/api/projects/[projectId]">

export async function PATCH(req: Request, ctx: Ctx) {
  const { projectId } = await ctx.params
  const auth = await authorizeProject(projectId, "owner")
  if (auth instanceof Response) return auth

  const body = await readJsonBody(req)
  if (body instanceof Response) return body
  const name = parseProjectName(body.name)
  if (!name) return Response.json({ error: "Invalid project name" }, { status: 400 })

  try {
    const project = await prisma.project.update({ where: { id: projectId }, data: { name } })
    return Response.json({ project })
  } catch (err) {
    if (isGone(err)) return Response.json({ error: "Not found" }, { status: 404 })
    throw err
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { projectId } = await ctx.params
  const auth = await authorizeProject(projectId, "owner")
  if (auth instanceof Response) return auth

  let canvasJsonPath: string | null
  try {
    ;({ canvasJsonPath } = await prisma.project.delete({ where: { id: projectId } }))
  } catch (err) {
    if (isGone(err)) return Response.json({ error: "Not found" }, { status: 404 })
    throw err
  }
  // Best effort: the project is already gone, so a Blob failure only leaves an unreachable file.
  if (canvasJsonPath) await del(canvasJsonPath).catch(() => {})
  return new Response(null, { status: 204 })
}
