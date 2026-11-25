import { auth } from "@clerk/nextjs/server"

import { isStale } from "@/lib/ai/runs"
import { prisma } from "@/lib/prisma"

type Ctx = RouteContext<"/api/ai/runs/[runId]">

/**
 * Status of one AI run: `{ status, kind, specId }`. Only the user who started it; 404 otherwise, so
 * run IDs can't be probed. Polled every 2 s, so it uses `auth()` (reads the session token locally)
 * instead of `currentUser()` (a Clerk API call per poll). Project access was checked when the run
 * started, and the row is deleted with its project.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const { runId } = await ctx.params

  const run = await prisma.taskRun.findFirst({
    where: { id: runId, userId },
    select: { status: true, kind: true, specId: true, createdAt: true },
  })
  if (!run) return Response.json({ error: "Not found" }, { status: 404 })
  const status = isStale(run) ? "FAILED" : run.status
  return Response.json({ status, kind: run.kind, specId: run.specId }, { headers: { "Cache-Control": "no-store" } })
}
