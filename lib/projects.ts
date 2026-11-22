// Shared, framework-free project helpers (safe to import from client and server).

/** What the sidebar and dialogs need to know about a project. */
export interface ProjectSummary {
  id: string
  name: string
  isOwner: boolean
}

export const PROJECT_NAME_MAX = 100
const PROJECT_ID_MAX = 80
const PROJECT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Validates an untrusted project name: trimmed string, 1–100 chars, or null if invalid. */
export function parseProjectName(value: unknown): string | null {
  if (typeof value !== "string") return null
  const name = value.trim()
  return name.length > 0 && name.length <= PROJECT_NAME_MAX ? name : null
}

/** Validates an untrusted project/room ID: lowercase slug, ≤ 80 chars, or null if invalid. */
export function parseProjectId(value: unknown): string | null {
  return typeof value === "string" && value.length <= PROJECT_ID_MAX && PROJECT_ID_PATTERN.test(value)
    ? value
    : null
}

/** "My Cool App!" → "my-cool-app". Strips accents, collapses non-alphanumerics to single dashes. */
export function toSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d") // đ has no NFKD decomposition
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** 6 random base-36 chars, e.g. "k3x9q2". ~2 billion combinations per slug. */
export function randomSuffix(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("")
}

/** Room ID = project ID: slugified name (capped so the ID stays ≤ 80) + "-" + suffix. */
export function makeRoomId(name: string, suffix: string): string {
  const slug = toSlug(name).slice(0, PROJECT_ID_MAX - suffix.length - 1).replace(/-+$/, "")
  return `${slug || "untitled-project"}-${suffix}`
}
