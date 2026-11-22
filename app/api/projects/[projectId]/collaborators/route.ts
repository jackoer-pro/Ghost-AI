import { Prisma } from "@/lib/generated/prisma/client"
import { getOwnerProfile, listCollaborators } from "@/lib/collaborators"
import { authorizeProject } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { parseEmail } from "@/lib/projects"
import { readJsonBody } from "@/lib/request"

// Keeps the Clerk lookup within one page and bounds what one owner can add.
const MAX_COLLABORATORS = 50

type Ctx = RouteContext<"/api/projects/[projectId]/collaborators">

// Owner or collaborator: read the list.
export async function GET(_req: Request, ctx: Ctx) {
  const { projectId } = await ctx.params
  const auth = await authorizeProject(projectId, "member")
  if (auth instanceof Response) return auth

  const [owner, collaborators] = await Promise.all([
    getOwnerProfile(projectId),
    listCollaborators(projectId),
  ])
  return Response.json({ owner, collaborators, isOwner: auth.project.isOwner })
}

// Owner only: invite by email.
export async function POST(req: Request, ctx: Ctx) {
  const { projectId } = await ctx.params
  const auth = await authorizeProject(projectId, "owner")
  if (auth instanceof Response) return auth

  const body = await readJsonBody(req)
  if (body instanceof Response) return body
  const email = parseEmail(body.email)
  if (!email) return Response.json({ error: "Enter a valid email address" }, { status: 400 })
  if (email === auth.identity.email?.toLowerCase()) {
    return Response.json({ error: "You already own this project" }, { status: 400 })
  }

  if ((await prisma.projectCollaborator.count({ where: { projectId } })) >= MAX_COLLABORATORS) {
    return Response.json({ error: `A project can have at most ${MAX_COLLABORATORS} collaborators` }, { status: 400 })
  }

  try {
    await prisma.projectCollaborator.create({ data: { projectId, email } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return Response.json({ error: "Already a collaborator" }, { status: 409 })
      // Project deleted between the owner check and the insert.
      if (err.code === "P2003") return Response.json({ error: "Not found" }, { status: 404 })
    }
    throw err
  }
  return Response.json({ collaborators: await listCollaborators(projectId) }, { status: 201 })
}
