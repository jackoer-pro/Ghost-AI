/**
 * Reads a JSON object body from a mutating API request.
 *
 * Requires `Content-Type: application/json`: browsers can't send that
 * cross-site without a CORS preflight (which we never approve), so a forged
 * form post from another site is rejected before it touches data (CSRF).
 * Returns the body object, or an error Response to send back.
 */
export async function readJsonBody(req: Request): Promise<Record<string, unknown> | Response> {
  const type = req.headers.get("content-type") ?? ""
  if (!type.toLowerCase().startsWith("application/json")) {
    return Response.json({ error: "Expected application/json" }, { status: 415 })
  }
  const body: unknown = await req.json().catch(() => undefined)
  if (body === undefined) return Response.json({ error: "Invalid JSON" }, { status: 400 })
  return body !== null && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {}
}
