import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { mutateFlow } from "@liveblocks/react-flow/node"
import { LiveblocksError } from "@liveblocks/node"
import { logger, task } from "@trigger.dev/sdk"
import { generateText, Output } from "ai"

import {
  applyDesignAction,
  describeCanvas,
  DESIGN_SYSTEM_PROMPT,
  designPlanSchema,
  MAX_ACTIONS,
  orderActions,
  type ApplyContext,
  type ApplyResult,
} from "@/lib/design-actions"
import { getLiveblocks } from "@/lib/liveblocks"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import { AI_STATUS_FEED_ID, type AiStatusMessage } from "@/types/tasks"

export interface DesignAgentPayload {
  prompt: string
  /** Liveblocks room ID (= project ID) whose canvas the agent edits. */
  roomId: string
}

const MODEL_ID = "gemini-3.5-flash"
/** The agent's identity in the room: shows up in live cursors and the avatar stack like any participant. */
const AGENT = { userId: "ghost-ai-agent", userInfo: { name: "Ghost AI", color: "#8B82FF" } } // --accent-ai-text
/** Presence outlives a crashed run by at most this long (seconds); refreshed on every update while working. */
const PRESENCE_TTL = 120
/** Pause between applied actions, so collaborators watch the diagram build instead of it popping in. */
const STEP_DELAY_MS = 250

/**
 * Turns a prompt into canvas edits in the project's Liveblocks room. Everyone in the room sees nodes
 * appear live (mutateFlow writes the same storage useLiveblocksFlow reads), the agent's cursor and
 * `thinking` presence, and progress in the `ai-status-feed`.
 */
export const designAgent = task({
  id: "design-agent",
  // Actions aren't idempotent: a retry after a partial run would add every node twice.
  retry: { maxAttempts: 1 },
  // One run per room at a time (the API passes the project ID as concurrencyKey); others queue.
  queue: { concurrencyLimit: 1 },
  run: async ({ prompt, roomId }: DesignAgentPayload) => {
    const liveblocks = getLiveblocks()
    const flowOptions = { client: liveblocks, roomId }

    // Status and presence are best effort: a feed hiccup must never fail the design itself.
    const status = (message: AiStatusMessage) =>
      liveblocks
        .createFeedMessage({ roomId, feedId: AI_STATUS_FEED_ID, data: message })
        .catch((err) => logger.warn("Status message failed", { error: String(err) }))
    const presence = (data: { cursor: { x: number; y: number } | null; thinking: boolean }, ttl = PRESENCE_TTL) =>
      liveblocks
        .setPresence(roomId, { ...AGENT, data, ttl })
        .catch((err) => logger.warn("Presence update failed", { error: String(err) }))

    await ensureStatusFeed(roomId)
    let cursor: { x: number; y: number } | null = null

    try {
      await Promise.all([presence({ cursor, thinking: true }), status({ stage: "started", text: "Ghost AI is reading the canvas…" })])

      let canvas = { nodes: [] as readonly CanvasNode[], edges: [] as readonly CanvasEdge[] }
      await mutateFlow<CanvasNode, CanvasEdge>(flowOptions, (flow) => {
        canvas = flow.toJSON() // read only: nothing changed, so nothing is written back
      })

      await status({ stage: "thinking", text: "Ghost AI is designing…" })
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set")
      const modelStart = Date.now()
      const { output: plan } = await generateText({
        model: createGoogleGenerativeAI({ apiKey })(MODEL_ID),
        system: DESIGN_SYSTEM_PROMPT,
        prompt: `Current canvas (JSON):\n${describeCanvas(canvas.nodes, canvas.edges)}\n\nRequest:\n${prompt}`,
        output: Output.object({ schema: designPlanSchema }),
      })

      const modelMs = Date.now() - modelStart
      const applyStart = Date.now()
      const actions = orderActions(plan.actions.slice(0, MAX_ACTIONS))
      logger.info("Design plan", { summary: plan.summary, actions: actions.length, proposed: plan.actions.length })
      await status({ stage: "applying", text: `Ghost AI is applying ${actions.length} change${actions.length === 1 ? "" : "s"}…` })

      const ctx: ApplyContext = { ids: new Map() }
      let applied = 0
      const skipped: string[] = []
      for (const action of actions) {
        let result = { applied: false, reason: "not run" } as ApplyResult // "as": set inside the callback
        // One mutateFlow per action: each change reaches the room on its own, so the diagram builds live.
        await mutateFlow<CanvasNode, CanvasEdge>(flowOptions, (flow) => {
          result = applyDesignAction(flow, action, ctx)
        })
        if (result.applied) {
          applied++
          if (result.focus) {
            cursor = result.focus
            await presence({ cursor, thinking: true })
          }
          // A plain timer, not wait.for: a quarter second needs no durable checkpoint.
          await new Promise((resolve) => setTimeout(resolve, STEP_DELAY_MS))
        } else {
          skipped.push(result.reason)
        }
      }
      if (skipped.length) logger.warn("Skipped actions", { skipped })

      const text =
        applied === 0
          ? "Ghost AI didn't find anything to change. Try describing the system in more detail."
          : `${plan.summary.trim() || "Design updated."} (${applied} change${applied === 1 ? "" : "s"})`
      await status({ stage: "complete", text })
      const timings = { modelMs, applyMs: Date.now() - applyStart }
      logger.info("Design applied", { applied, skipped: skipped.length, ...timings })
      // Skip reasons go in the output too: they're the first thing to look at when a design comes out wrong.
      return { summary: plan.summary, applied, skipped, ...timings }
    } catch (err) {
      logger.error("Design agent failed", { error: err instanceof Error ? err.message : String(err) })
      // Changes already applied stay: each was validated, so the canvas is never left broken. They are
      // not in anyone's undo stack (Liveblocks history is per client; server writes aren't part of it).
      await status({ stage: "error", text: "Ghost AI couldn't finish this design. Please try again." })
      throw err // marks the run as failed, so the client's run status shows it too
    } finally {
      // Shortest TTL Liveblocks allows: the cursor leaves almost immediately instead of lingering.
      await presence({ cursor: null, thinking: false }, 2)
    }
  },
})

/** Creates the room's status feed on first use; an existing feed (409) is fine. */
async function ensureStatusFeed(roomId: string) {
  try {
    await getLiveblocks().createFeed({ roomId, feedId: AI_STATUS_FEED_ID })
  } catch (err) {
    if (err instanceof LiveblocksError && err.status === 409) return
    logger.warn("Status feed setup failed", { error: String(err) })
  }
}
