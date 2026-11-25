import "server-only"

import { Liveblocks, LiveblocksError } from "@liveblocks/node"

import { ROOM_FEED_IDS } from "@/types/tasks"

// Created on first use, not at import: `next build` loads route modules
// without secrets, and the constructor rejects a missing key.
const globalForLiveblocks = globalThis as unknown as { liveblocks?: Liveblocks; roomsWithFeeds?: Set<string> }

/** Shared Liveblocks Node client (reused across requests and dev hot reloads). */
export function getLiveblocks(): Liveblocks {
  if (!globalForLiveblocks.liveblocks) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not set")
    globalForLiveblocks.liveblocks = new Liveblocks({ secret })
  }
  return globalForLiveblocks.liveblocks
}

/**
 * Creates the room's feeds if they don't exist yet (409 = already there). Must run before a client
 * connects: `useFeedMessages` on a missing feed fails once and never retries, so later messages
 * wouldn't show until a reload. Best effort: a failure is logged, not thrown.
 *
 * Remembered per server instance, so only the first token for a room pays the two REST calls; a failed
 * setup isn't remembered and is retried on the next token.
 */
// ponytail: in-memory per instance, one entry per room opened; a shared store if instances multiply a lot.
export async function ensureRoomFeeds(roomId: string): Promise<void> {
  const done = (globalForLiveblocks.roomsWithFeeds ??= new Set())
  if (done.has(roomId)) return
  const liveblocks = getLiveblocks()
  const results = await Promise.all(
    ROOM_FEED_IDS.map((feedId) =>
      liveblocks.createFeed({ roomId, feedId }).then(
        () => true,
        (err) => {
          if (err instanceof LiveblocksError && err.status === 409) return true
          console.warn(`Liveblocks feed "${feedId}" setup failed:`, String(err))
          return false
        }
      )
    )
  )
  if (results.every(Boolean)) done.add(roomId)
}

// Bright hues that read on the dark canvas behind dark cursor-label text. Fixed list (it used to be the
// node palette's text colors): reordering or changing it changes every user's cursor color.
export const CURSOR_COLORS = ["#52A8FF", "#BF7AF0", "#FF990A", "#FF6166", "#F75F8F", "#62C073", "#0AC7B4"]

/** Same user ID → same color, on every device and session. */
export function cursorColor(userId: string): string {
  let hash = 0
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}
