/** Download name for a spec, from when it was made: `spec-2026-11-25-1430.md` (UTC). */
export function specFilename(createdAt: Date): string {
  const iso = createdAt.toISOString() // 2026-11-25T14:30:00.000Z
  return `spec-${iso.slice(0, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}.md`
}

/** One row of the project's spec list (`GET /api/projects/{projectId}/specs`). */
export interface SpecSummary {
  id: string
  filename: string
  /** ISO date string. */
  createdAt: string
}
