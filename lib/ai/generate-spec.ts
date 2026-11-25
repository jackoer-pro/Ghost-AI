import "server-only"

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { mutateFlow } from "@liveblocks/react-flow/node"
import { del, put } from "@vercel/blob"
import { generateText } from "ai"

import { GEMINI_MODEL_ID } from "@/lib/ai/design-agent"
import { describeCanvas } from "@/lib/design-actions"
import { getLiveblocks } from "@/lib/liveblocks"
import { prisma } from "@/lib/prisma"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import { AI_CHAT_FEED_ID, aiChatMessageSchema } from "@/types/tasks"

/** Only the most recent chat goes in the prompt: the canvas is the source of truth, chat is context. */
const MAX_CHAT_MESSAGES = 60

const SPEC_SYSTEM_PROMPT = `You are a senior software architect. Write a technical specification in Markdown for the system shown on the canvas.

The canvas is a list of nodes (components: services, databases, queues, clients…) and edges (connections, optionally labeled).
The chat is what the team discussed while designing it; use it for intent and requirements, but the canvas wins where they disagree.

Write it for the engineers who will build the system: concrete, production-minded, no filler. Keep it to about 2,000 words: prefer tables and bullets over paragraphs.

Structure:
# <System name>
## Overview — what the system does and for whom, in one short paragraph, then the key architectural decisions as bullets.
## Components — a table (Component | Responsibility | Technology | Owns data), then one ### per component with its responsibilities, main operations and dependencies.
## Request and data flows — the 2–4 most important flows (e.g. sign-up, the core user action, a background job) as numbered steps naming each component and protocol.
## APIs and interfaces — the main endpoints or messages between components (method + path or event name, purpose).
## Data model — the main entities with their key fields, and which store owns each.
## Security — authentication, authorization, secrets, data protection.
## Scalability and reliability — scaling strategy per tier, caching, retries and idempotency, failure handling.
## Observability and operations — logs, metrics, traces, alerts, deployment.
## Open questions and risks — gaps the canvas leaves unresolved, and components worth adding.

Rules: plain GitHub-flavored Markdown only (headings, lists, tables, code blocks); no HTML. Refer to components by their labels; never mention node ids or grid positions (they are internal). Don't invent components that aren't on the canvas: suggest them under Open questions and risks instead.`

/**
 * Generates a Markdown spec from the room's current canvas and chat, stores it in Vercel Blob at
 * `specs/{projectId}/{specId}.md` and records a ProjectSpec row. Returns the new spec's ID.
 * Reads the canvas and chat server-side rather than trusting a client copy.
 */
export async function generateSpec(projectId: string): Promise<string> {
  const liveblocks = getLiveblocks()
  const roomId = projectId // room ID = project ID (architecture)

  let canvas = { nodes: [] as readonly CanvasNode[], edges: [] as readonly CanvasEdge[] }
  await mutateFlow<CanvasNode, CanvasEdge>({ client: liveblocks, roomId }, (flow) => {
    canvas = flow.toJSON() // read only
  })
  if (canvas.nodes.length === 0) throw new Error("Canvas is empty")

  const { data: feed } = await liveblocks.getFeedMessages({ roomId, feedId: AI_CHAT_FEED_ID }).catch(() => ({ data: [] }))
  const chat = feed
    .toSorted((a, b) => a.createdAt - b.createdAt)
    .flatMap((message) => {
      const parsed = aiChatMessageSchema.safeParse(message.data)
      return parsed.success ? [`${parsed.data.sender.name} (${parsed.data.role}): ${parsed.data.content}`] : []
    })
    .slice(-MAX_CHAT_MESSAGES)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set")
  const { text, finishReason } = await generateText({
    model: createGoogleGenerativeAI({ apiKey })(GEMINI_MODEL_ID),
    system: SPEC_SYSTEM_PROMPT,
    // ~2,000 words is ~3–4k tokens; the cap stops a repetition loop early (see design-agent.ts).
    maxOutputTokens: 12_000,
    prompt: `Canvas (JSON):\n${describeCanvas(canvas.nodes, canvas.edges)}\n\nChat:\n${chat.join("\n") || "(none)"}`,
  })
  // Hitting the cap means a runaway reply: a cut-off spec is worse than a failed run the user can retry.
  if (finishReason === "length") throw new Error("Spec reply hit the token cap")
  const markdown = text.trim()
  if (!markdown) throw new Error("Model returned an empty spec")

  const specId = crypto.randomUUID()
  const blob = await put(`specs/${projectId}/${specId}.md`, markdown, {
    access: "private",
    addRandomSuffix: false,
    contentType: "text/markdown; charset=utf-8",
  })
  try {
    await prisma.projectSpec.create({ data: { id: specId, projectId, filePath: blob.url } })
  } catch (err) {
    await del(blob.url).catch(() => {}) // project deleted meanwhile: don't orphan the blob
    throw err
  }
  return specId
}
