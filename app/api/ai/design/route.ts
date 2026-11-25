import { z } from "zod"

import { runDesignAgent } from "@/lib/ai/design-agent"
import { runInBackground, startRun } from "@/lib/ai/runs"
import { authorizeProject } from "@/lib/project-access"
import { readJsonBody } from "@/lib/request"
import { MAX_CHAT_MESSAGE_LENGTH } from "@/types/tasks"

// The agent runs in after() within this function's lifetime: ~20–50 s per run, well under the cap.
export const maxDuration = 300

const bodySchema = z.object({
  prompt: z.string().trim().min(1, "Missing prompt").max(MAX_CHAT_MESSAGE_LENGTH, "Prompt is too long"),
  /** Liveblocks room ID, which is the project ID; access is checked from it, never from a client projectId. */
  roomId: z.string().min(1, "Missing roomId"),
})

/**
 * Starts the design agent for one project. Body: `{ prompt, roomId }`. Any project member can run it
 * (collaborators edit the canvas too). Returns `{ runId }` right away; poll `GET /api/ai/runs/{runId}`.
 */
export async function POST(req: Request) {
  const body = await readJsonBody(req)
  if (body instanceof Response) return body
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const { prompt, roomId } = parsed.data

  const auth = await authorizeProject(roomId, "member")
  if (auth instanceof Response) return auth

  const run = await startRun("DESIGN", auth.project.id, auth.identity.userId)
  if (run instanceof Response) return run
  runInBackground(run.id, async () => {
    await runDesignAgent({ prompt, roomId: auth.project.id })
  })
  return Response.json({ runId: run.id }, { status: 202 })
}
