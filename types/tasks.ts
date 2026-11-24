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
