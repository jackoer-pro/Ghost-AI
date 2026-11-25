import { get } from "@vercel/blob"

import { authorizeProject } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { specFilename } from "@/lib/specs"

type Ctx = RouteContext<"/api/projects/[projectId]/specs/[specId]/download">

/**
 * One spec as a Markdown attachment. Any project member; the spec must belong to that project.
 * The Blob store is private, so the file is only reachable through this access check. The sidebar
 * preview fetches this same route and reads the body.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { projectId, specId } = await ctx.params
  const auth = await authorizeProject(projectId, "member")
  if (auth instanceof Response) return auth

  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { filePath: true, createdAt: true },
  })
  if (!spec) return Response.json({ error: "Not found" }, { status: 404 })

  const blob = await get(spec.filePath, { access: "private" })
  if (!blob) return Response.json({ error: "Not found" }, { status: 404 })
  return new Response(blob.stream, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${specFilename(spec.createdAt)}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
