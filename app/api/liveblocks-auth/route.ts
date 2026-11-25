import { currentUser } from "@clerk/nextjs/server"
import { LiveblocksError } from "@liveblocks/node"

import { cursorColor, ensureRoomFeeds, getLiveblocks } from "@/lib/liveblocks"
import { getProjectForUser, identityOf } from "@/lib/project-access"
import { readJsonBody } from "@/lib/request"

const jsonError = (error: string, status: number) => Response.json({ error }, { status })

/**
 * Issues a Liveblocks access token for one room. Room ID = project ID.
 * The client's `authEndpoint` POSTs `{ room }` as JSON.
 */
export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return jsonError("Unauthorized", 401)

  const body = await readJsonBody(req)
  if (body instanceof Response) return body
  const roomId = body.room
  if (typeof roomId !== "string" || !roomId) return jsonError("Missing room", 400)

  // 403 for both "no such project" and "not a member", so IDs aren't revealed.
  // Liveblocks stops reconnecting on 403, unlike 404.
  const project = await getProjectForUser(roomId, identityOf(user))
  if (!project) return jsonError("Forbidden", 403)

  const liveblocks = getLiveblocks()
  try {
    // Private room: only tokens from this route can open it.
    await liveblocks.getOrCreateRoom(project.id, { defaultAccesses: [] })
  } catch (err) {
    if (!(err instanceof LiveblocksError)) throw err
    console.error(`Liveblocks room setup failed: ${err.status} ${err.message}`)
    return jsonError("Realtime service unavailable", 502)
  }

  const email = user.primaryEmailAddress?.emailAddress
  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.fullName || user.username || email || "Anonymous",
      ...(user.hasImage ? { avatar: user.imageUrl } : {}),
      color: cursorColor(user.id),
    },
  })
  session.allow(project.id, ["*:write"])
  // In parallel: the feeds only need to exist before the client connects with this token.
  const [{ status, body: token }] = await Promise.all([session.authorize(), ensureRoomFeeds(project.id)])
  return new Response(token, { status, headers: { "Content-Type": "application/json" } })
}
