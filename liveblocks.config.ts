// Liveblocks types for the whole app (hooks, others, the auth route).
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each participant's live state, for useMyPresence, useOthers, etc.
    Presence: {
      /** Pointer position on the canvas; null when the pointer is off it. */
      cursor: { x: number; y: number } | null
      /** True while this participant (human or AI agent) is generating. */
      thinking: boolean
    }

    // Set by POST /api/liveblocks-auth when the session token is issued.
    UserMeta: {
      /** Clerk user ID. */
      id: string
      info: {
        name: string
        /** Profile photo URL; absent when the user has none (UI falls back to initials). */
        avatar?: string
        /** Cursor/presence color, derived from the user ID (`cursorColor()`). */
        color: string
      }
    }
  }
}

export {}
