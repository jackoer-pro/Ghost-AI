import { logger, task } from "@trigger.dev/sdk"

export interface DesignAgentPayload {
  prompt: string
  /** Liveblocks room ID (= project ID) whose canvas the agent will edit. */
  roomId: string
}

/** Design generation job. Feature 22: wiring only, it echoes the input. AI logic lands in feature 23. */
export const designAgent = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload) => {
    logger.info("Design agent received prompt", { roomId: payload.roomId, prompt: payload.prompt })
    return { roomId: payload.roomId, prompt: payload.prompt }
  },
})
