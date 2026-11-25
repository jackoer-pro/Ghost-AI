import { authorizeProject } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { specFilename, type SpecSummary } from "@/lib/specs"

type Ctx = RouteContext<"/api/projects/[projectId]/specs">

/** The project's generated specs, newest first: `{ specs: SpecSummary[] }`. Any project member. */
export async function GET(_req: Request, ctx: Ctx) {
  const { projectId } = await ctx.params
  const auth = await authorizeProject(projectId, "member")
  if (auth instanceof Response) return auth

  const rows = await prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  })
  const specs: SpecSummary[] = rows.map((row) => ({
    id: row.id,
    filename: specFilename(row.createdAt),
    createdAt: row.createdAt.toISOString(),
  }))
  return Response.json({ specs })
}
