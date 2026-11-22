import { authorizeProject } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"

type Ctx = RouteContext<"/api/projects/[projectId]/collaborators/[collaboratorId]">

// Owner only: remove a collaborator.
export async function DELETE(_req: Request, ctx: Ctx) {
  const { projectId, collaboratorId } = await ctx.params
  const auth = await authorizeProject(projectId, "owner")
  if (auth instanceof Response) return auth

  // Scoped by projectId so an owner can't delete another project's collaborator by ID.
  const { count } = await prisma.projectCollaborator.deleteMany({
    where: { id: collaboratorId, projectId },
  })
  if (count === 0) return Response.json({ error: "Not found" }, { status: 404 })
  return new Response(null, { status: 204 })
}
