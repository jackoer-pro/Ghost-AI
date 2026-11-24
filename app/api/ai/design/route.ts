import { runs, tasks } from "@trigger.dev/sdk"

import { Prisma } from "@/lib/generated/prisma/client"
import { authorizeProject } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { readJsonBody } from "@/lib/request"
import type { designAgent } from "@/trigger/design-agent"

const MAX_PROMPT_LENGTH = 4000

const jsonError = (error: string, status: number) => Response.json({ error }, { status })

/**
 * Starts the design agent for one project. Body: `{ prompt, roomId, projectId }`.
 * Any project member can run it (collaborators edit the canvas too). Returns `{ runId }`;
 * the client then asks `/api/ai/design/token` for a token to follow the run.
 */
export async function POST(req: Request) {
  const body = await readJsonBody(req)
  if (body instanceof Response) return body
  const { prompt, roomId, projectId } = body

  if (typeof projectId !== "string" || !projectId) return jsonError("Missing projectId", 400)
  // Room ID = project ID (architecture); a mismatch would let the agent edit a room we never authorized.
  if (roomId !== projectId) return jsonError("roomId must match projectId", 400)
  if (typeof prompt !== "string" || !prompt.trim()) return jsonError("Missing prompt", 400)
  if (prompt.length > MAX_PROMPT_LENGTH) return jsonError("Prompt is too long", 400)

  const auth = await authorizeProject(projectId, "member")
  if (auth instanceof Response) return auth

  let runId: string
  try {
    const handle = await tasks.trigger<typeof designAgent>(
      "design-agent",
      { prompt: prompt.trim(), roomId: projectId },
      { tags: [`project:${projectId}`] }
    )
    runId = handle.id
  } catch (err) {
    console.error("Trigger.dev design-agent trigger failed:", err)
    return jsonError("Background task service unavailable", 502)
  }

  try {
    await prisma.taskRun.create({ data: { runId, projectId, userId: auth.identity.userId } })
  } catch (err) {
    // Without a record nobody can get a token for the run, so stop it rather than leave it orphaned.
    await runs.cancel(runId).catch(() => {})
    // P2003 = foreign key failed: the project was deleted mid-request.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return jsonError("Not found", 404)
    }
    throw err
  }

  return Response.json({ runId }, { status: 201 })
}
