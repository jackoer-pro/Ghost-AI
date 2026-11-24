import { del, get, put } from "@vercel/blob"

import { Prisma } from "@/lib/generated/prisma/client"
import { MAX_SNAPSHOT_BYTES, parseCanvasSnapshot } from "@/lib/canvas-snapshot"
import { authorizeProject } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { readJsonBody } from "@/lib/request"

// Prisma keeps the blob URL (`canvasJsonPath`); the canvas JSON itself lives in Vercel Blob at
// `canvas/{projectId}.json` (architecture "Storage Model"). The store is private: blobs are only
// readable with our server token, never by URL alone.

type Ctx = RouteContext<"/api/projects/[projectId]/canvas">

/** The saved canvas, or `{ canvas: null }` when nothing was saved yet. Any project member. */
export async function GET(_req: Request, ctx: Ctx) {
  const { projectId } = await ctx.params
  const auth = await authorizeProject(projectId, "member")
  if (auth instanceof Response) return auth

  const record = await prisma.project.findUnique({ where: { id: projectId }, select: { canvasJsonPath: true } })
  if (!record?.canvasJsonPath) return Response.json({ canvas: null })

  // useCache: false — the blob is overwritten in place, and the CDN copy can be up to a minute stale.
  const blob = await get(record.canvasJsonPath, { access: "private", useCache: false })
  if (!blob) return Response.json({ canvas: null })
  const stored: unknown = await new Response(blob.stream).json().catch(() => null)
  const canvas = parseCanvasSnapshot(stored)
  if (!canvas) return Response.json({ error: "Saved canvas is unreadable" }, { status: 500 })
  return Response.json({ canvas })
}

/** Saves `{ nodes, edges }` as the project's canvas snapshot. Any project member (collaborators edit too). */
export async function PUT(req: Request, ctx: Ctx) {
  const { projectId } = await ctx.params
  const auth = await authorizeProject(projectId, "member")
  if (auth instanceof Response) return auth

  // Reject oversized bodies before parsing them; the serialized check below covers chunked uploads.
  if (Number(req.headers.get("content-length")) > MAX_SNAPSHOT_BYTES) return tooLarge()
  const body = await readJsonBody(req)
  if (body instanceof Response) return body
  const canvas = parseCanvasSnapshot(body)
  if (!canvas) return Response.json({ error: "Invalid canvas" }, { status: 400 })
  const json = JSON.stringify(canvas)
  if (Buffer.byteLength(json) > MAX_SNAPSHOT_BYTES) return tooLarge()

  const blob = await put(`canvas/${projectId}.json`, json, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  })
  try {
    await prisma.project.update({ where: { id: projectId }, data: { canvasJsonPath: blob.url } })
  } catch (err) {
    // Project deleted mid-request: drop the blob we just wrote so it isn't orphaned.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      await del(blob.url).catch(() => {})
      return Response.json({ error: "Not found" }, { status: 404 })
    }
    throw err
  }
  return new Response(null, { status: 204 })
}

const tooLarge = () => Response.json({ error: "Canvas is too large to save" }, { status: 413 })
