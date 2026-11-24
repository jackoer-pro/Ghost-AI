// Pure helpers for presence UI (avatars, cursors). No Liveblocks imports, so they're easy to check.

interface Participant {
  /** Clerk user ID (Liveblocks UserMeta id). */
  id: string
}

/**
 * Room participants minus the current Clerk user, one entry per user.
 * `useOthers()` already drops this connection, but the same user in another tab is an "other",
 * and a collaborator with two tabs open would otherwise get two avatars.
 */
export function collaboratorsOf<T extends Participant>(others: readonly T[], myUserId: string | null | undefined): T[] {
  const seen = new Set<string>()
  if (myUserId) seen.add(myUserId)
  return others.filter((other) => {
    if (seen.has(other.id)) return false
    seen.add(other.id)
    return true
  })
}

/** "Ada Lovelace" → "AL", "ada@example.com" → "A", "" → "?". */
export function initials(name: string): string {
  const words = name.split("@")[0].trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  // Array.from splits by code point, so a name starting with an emoji or astral character stays whole.
  const first = Array.from(words[0])[0]
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : ""
  return (first + last).toUpperCase()
}
