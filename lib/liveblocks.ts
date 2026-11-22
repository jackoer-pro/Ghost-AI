import "server-only"

import { Liveblocks } from "@liveblocks/node"

// Created on first use, not at import: `next build` loads route modules
// without secrets, and the constructor rejects a missing key.
const globalForLiveblocks = globalThis as unknown as { liveblocks?: Liveblocks }

/** Shared Liveblocks Node client (reused across requests and dev hot reloads). */
export function getLiveblocks(): Liveblocks {
  if (!globalForLiveblocks.liveblocks) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not set")
    globalForLiveblocks.liveblocks = new Liveblocks({ secret })
  }
  return globalForLiveblocks.liveblocks
}

// The vivid text colors of the node palette (ui-context.md), so cursors match the canvas.
export const CURSOR_COLORS = ["#52A8FF", "#BF7AF0", "#FF990A", "#FF6166", "#F75F8F", "#62C073", "#0AC7B4"] as const

/** Same user ID → same color, on every device and session. */
export function cursorColor(userId: string): string {
  let hash = 0
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}
