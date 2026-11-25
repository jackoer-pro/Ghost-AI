import "server-only"

import { getLiveblocks } from "@/lib/liveblocks"
import { AI_CHAT_FEED_ID, type AiChatMessage } from "@/types/tasks"

/** The agent's identity in the room: shows up in live cursors, the avatar stack and the chat. */
export const AI_AGENT = { userId: "ghost-ai-agent", userInfo: { name: "Ghost AI", color: "#8B82FF" } } // --accent-ai-text

/** Posts a Ghost AI message to the room chat. Best effort: logged, never thrown. */
export async function postAssistantMessage(roomId: string, content: string): Promise<void> {
  const data: AiChatMessage = {
    sender: { id: AI_AGENT.userId, name: AI_AGENT.userInfo.name },
    role: "assistant",
    content,
    timestamp: Date.now(),
  }
  await getLiveblocks()
    .createFeedMessage({ roomId, feedId: AI_CHAT_FEED_ID, data })
    .catch((err) => console.warn("Chat message failed:", String(err)))
}
