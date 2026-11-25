import "server-only"

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { mutateFlow } from "@liveblocks/react-flow/node"
import { generateText, NoObjectGeneratedError, Output } from "ai"

import { AI_AGENT, postAssistantMessage } from "@/lib/ai/room"
import {
  applyDesignAction,
  describeCanvas,
  DESIGN_SYSTEM_PROMPT,
  designPlanSchema,
  MAX_ACTIONS,
  type DesignPlan,
  planToActions,
  type ApplyContext,
  type ApplyResult,
} from "@/lib/design-actions"
import { getLiveblocks } from "@/lib/liveblocks"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import { AI_STATUS_FEED_ID, type AiStatusMessage } from "@/types/tasks"

export interface DesignAgentInput {
  prompt: string
  /** Liveblocks room ID (= project ID) whose canvas the agent edits. */
  roomId: string
}

export interface DesignAgentResult {
  summary: string
  applied: number
  skipped: string[]
  modelMs: number
  applyMs: number
}

export const GEMINI_MODEL_ID = "gemini-3.5-flash"
/** Presence outlives a crashed run by at most this long (seconds); refreshed on every update while working. */
const PRESENCE_TTL = 120
/**
 * Pauses between applied actions, so collaborators watch the diagram build instead of it popping in.
 * Edges are quicker: they're many and only connect what's already visible.
 */
const NODE_STEP_MS = 180
const EDGE_STEP_MS = 60

/**
 * A full design is a few thousand tokens. Gemini sometimes falls into a repetition loop in structured
 * output (seen live: one edge repeated 2,958 times until the 65k-token limit, ~217 KB of JSON), so cap
 * the reply to fail fast, and try once more: loops are random, so a second attempt usually comes back clean.
 */
const MAX_OUTPUT_TOKENS = 12_000
const MODEL_ATTEMPTS = 2

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Turns a prompt into canvas edits in the project's Liveblocks room. Everyone in the room sees nodes
 * appear live (mutateFlow writes the same storage useLiveblocksFlow reads), the agent's cursor and
 * `thinking` presence, progress in `ai-status-feed`, and the outcome as a Ghost AI message in `ai-chat`.
 * Runs inside the API route's after(); throws on failure (after posting the error to the room).
 */
export async function runDesignAgent({ prompt, roomId }: DesignAgentInput): Promise<DesignAgentResult> {
  const liveblocks = getLiveblocks()
  const flowOptions = { client: liveblocks, roomId }

  // Status and presence are best effort: a feed hiccup must never fail the design itself.
  const status = (message: AiStatusMessage) =>
    liveblocks
      .createFeedMessage({ roomId, feedId: AI_STATUS_FEED_ID, data: message })
      .catch((err) => console.warn("Status message failed:", String(err)))
  // Presence calls are chained (so they land in order) but not awaited by the apply loop: a REST
  // round trip per cursor move would otherwise double the time it takes to draw the diagram.
  let presenceChain: Promise<unknown> = Promise.resolve()
  const presence = (data: { cursor: { x: number; y: number } | null; thinking: boolean }, ttl = PRESENCE_TTL) =>
    (presenceChain = presenceChain.then(() =>
      liveblocks
        .setPresence(roomId, { ...AI_AGENT, data, ttl })
        .catch((err) => console.warn("Presence update failed:", String(err)))
    ))

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
    const model = createGoogleGenerativeAI({ apiKey })(GEMINI_MODEL_ID)
    const request = `Current canvas (JSON):\n${describeCanvas(canvas.nodes, canvas.edges)}\n\nRequest:\n${prompt}`
    let plan: DesignPlan | undefined
    for (let attempt = 1; !plan; attempt++) {
      try {
        const { output, usage } = await generateText({
          model,
          system: DESIGN_SYSTEM_PROMPT,
          prompt: request,
          output: Output.object({ schema: designPlanSchema }),
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        })
        console.info("Design model usage", { attempt, outputTokens: usage.outputTokens })
        plan = output
      } catch (err) {
        // Only an unusable reply is retried; a missing key or an API outage fails straight away.
        if (attempt >= MODEL_ATTEMPTS || !NoObjectGeneratedError.isInstance(err)) throw err
        console.warn("Design plan unusable, retrying", { attempt, finishReason: err.finishReason })
        await status({ stage: "thinking", text: "Ghost AI is taking another pass…" })
      }
    }

    const modelMs = Date.now() - modelStart
    const applyStart = Date.now()
    const proposed = planToActions(plan)
    const actions = proposed.slice(0, MAX_ACTIONS)
    console.info("Design plan", { summary: plan.summary, actions: actions.length, proposed: proposed.length })
    await status({ stage: "applying", text: `Ghost AI is applying ${actions.length} change${actions.length === 1 ? "" : "s"}…` })

    const ctx: ApplyContext = { ids: new Map() }
    let applied = 0
    const skipped: string[] = []
    // One storage session for all actions: mutateFlow downloads the room's whole storage per call, but
    // inside an async callback Liveblocks streams the ops as they happen (flushed every 200 ms), so the
    // diagram still builds live for everyone. (Concurrent user edits during these seconds aren't seen
    // by the free-cell check; they still merge, last writer wins per field.)
    await mutateFlow<CanvasNode, CanvasEdge>(flowOptions, async (flow) => {
      for (const action of actions) {
        const result: ApplyResult = applyDesignAction(flow, action, ctx)
        if (!result.applied) {
          skipped.push(result.reason)
          continue
        }
        applied++
        if (result.focus) {
          cursor = result.focus
          void presence({ cursor, thinking: true })
        }
        await sleep(action.type === "add_edge" || action.type === "delete_edge" ? EDGE_STEP_MS : NODE_STEP_MS)
      }
    })
    // Reasons quote the model's references, which can be long when it misbehaves.
    if (skipped.length) console.warn("Skipped actions", { skipped: skipped.map((r) => r.slice(0, 160)) })

    const text =
      applied === 0
        ? "Ghost AI didn't find anything to change. Try describing the system in more detail."
        : `${plan.summary.trim() || "Design updated."} (${applied} change${applied === 1 ? "" : "s"})`
    await Promise.all([status({ stage: "complete", text }), postAssistantMessage(roomId, text)])
    const timings = { modelMs, applyMs: Date.now() - applyStart }
    console.info("Design applied", { applied, skipped: skipped.length, ...timings })
    return { summary: plan.summary, applied, skipped, ...timings }
  } catch (err) {
    console.error("Design agent failed:", err instanceof Error ? err.message : String(err))
    // Changes already applied stay: each was validated, so the canvas is never left broken. They are
    // not in anyone's undo stack (Liveblocks history is per client; server writes aren't part of it).
    const text = "Ghost AI couldn't finish this design. Please try again."
    await Promise.all([status({ stage: "error", text }), postAssistantMessage(roomId, text)])
    throw err
  } finally {
    // Shortest TTL Liveblocks allows: the cursor leaves almost immediately instead of lingering.
    await presence({ cursor: null, thinking: false }, 2)
  }
}
