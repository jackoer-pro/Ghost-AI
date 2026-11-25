import { z } from "zod"

import { generateSpec } from "@/lib/ai/generate-spec"
import { runInBackground, startRun } from "@/lib/ai/runs"
import { authorizeProject } from "@/lib/project-access"
import { readJsonBody } from "@/lib/request"

export const maxDuration = 300

/** Only the room: the canvas and chat are read server-side from Liveblocks, not trusted from the client. */
const bodySchema = z.object({ roomId: z.string().min(1, "Missing roomId") })

/**
 * Starts spec generation for one project. Body: `{ roomId }`. Any project member. Returns `{ runId }`;
 * when the run is COMPLETED, its `specId` names the new spec.
 */
export async function POST(req: Request) {
  const body = await readJsonBody(req)
  if (body instanceof Response) return body
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const auth = await authorizeProject(parsed.data.roomId, "member")
  if (auth instanceof Response) return auth

  const run = await startRun("SPEC", auth.project.id, auth.identity.userId)
  if (run instanceof Response) return run
  runInBackground(run.id, async () => ({ specId: await generateSpec(auth.project.id) }))
  return Response.json({ runId: run.id }, { status: 202 })
}
