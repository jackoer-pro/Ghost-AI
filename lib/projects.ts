export interface Project {
  id: string
  name: string
  slug: string
  isOwner: boolean
}

// ponytail: mock data until the projects API exists (feature 05+).
export const MOCK_PROJECTS: Project[] = [
  { id: "p1", name: "Payments Platform", slug: "payments-platform", isOwner: true },
  { id: "p2", name: "Chat Service", slug: "chat-service", isOwner: true },
  { id: "p3", name: "Analytics Pipeline", slug: "analytics-pipeline", isOwner: false },
]

export const PROJECT_NAME_MAX = 100

/** Validates an untrusted project name: trimmed string, 1–100 chars, or null if invalid. */
export function parseProjectName(value: unknown): string | null {
  if (typeof value !== "string") return null
  const name = value.trim()
  return name.length > 0 && name.length <= PROJECT_NAME_MAX ? name : null
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
