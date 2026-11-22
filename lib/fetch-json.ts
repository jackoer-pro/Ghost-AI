/**
 * fetch() for our JSON API: sends `body` as JSON, throws an Error carrying the
 * API's `{ error }` message on non-2xx, and returns the parsed body (or null for 204).
 */
export async function fetchJson<T = unknown>(
  url: string,
  init: { method?: string; body?: object } = {}
): Promise<T | null> {
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: init.body ? { "content-type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((data as { error?: string } | null)?.error ?? `Request failed (${res.status})`)
  }
  return data as T | null
}
