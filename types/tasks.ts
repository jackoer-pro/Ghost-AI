import { z } from "zod"

// Shared contracts between background tasks (trigger/) and the editor UI.

/** Room-scoped Liveblocks feed carrying AI progress, read by everyone in the room (spec 24). */
export const AI_STATUS_FEED_ID = "ai-status-feed"

/**
 * One AI status message. Generic so spec generation can reuse it: `text` is what the UI shows;
 * `stage` lets it tell an active run from a finished or failed one.
 */
export const aiStatusMessageSchema = z.object({
  text: z.string().optional(),
  stage: z.enum(["started", "thinking", "applying", "complete", "error"]).optional(),
})

export type AiStatusMessage = z.infer<typeof aiStatusMessageSchema>

/** Room-scoped Liveblocks feed for the sidebar chat (spec 25). Separate from the status feed. */
export const AI_CHAT_FEED_ID = "ai-chat"

/** Every feed a room uses; the auth route creates them before anyone connects. */
export const ROOM_FEED_IDS = [AI_STATUS_FEED_ID, AI_CHAT_FEED_ID] as const

export const MAX_CHAT_MESSAGE_LENGTH = 4000

/** One chat message. `role: "assistant"` is for Ghost AI's replies (a later spec); people send "user". */
export const aiChatMessageSchema = z.object({
  sender: z.object({ id: z.string().min(1), name: z.string() }),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
  /** Milliseconds since the epoch, set by the sender. */
  timestamp: z.number().int().nonnegative(),
})

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>
