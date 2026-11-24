import { auth as triggerAuth } from "@trigger.dev/sdk"

import { accessibleBy, getCurrentIdentity } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { readJsonBody } from "@/lib/request"

const jsonError = (error: string, status: number) => Response.json({ error }, { status })

/**
 * Issues a Trigger.dev public token that can only read one run. Body: `{ runId }`.
 * Only the user who started the run gets one, and only while they can still open its project.
 */
export async function POST(req: Request) {
  const identity = await getCurrentIdentity()
  if (!identity) return jsonError("Unauthorized", 401)

  const body = await readJsonBody(req)
  if (body instanceof Response) return body
  const { runId } = body
  if (typeof runId !== "string" || !runId) return jsonError("Missing runId", 400)

  // 404 for "no such run", "someone else's run" and "lost project access" alike, so run IDs aren't probed.
  const run = await prisma.taskRun.findFirst({
    where: { runId, userId: identity.userId, project: accessibleBy(identity) },
    select: { runId: true },
  })
  if (!run) return jsonError("Not found", 404)

  try {
    const token = await triggerAuth.createPublicToken({
      scopes: { read: { runs: [run.runId] } },
      expirationTime: "1h",
    })
    return Response.json({ token })
  } catch (err) {
    console.error("Trigger.dev public token creation failed:", err)
    return jsonError("Background task service unavailable", 502)
  }
}
