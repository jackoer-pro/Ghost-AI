import { defineConfig } from "@trigger.dev/sdk"

export default defineConfig({
  project: "proj_zkryxaonijupqloyypes", // Trigger.dev project ref; not a secret
  dirs: ["./trigger"],
  maxDuration: 300, // seconds per run; AI generation (feature 23) fits well inside this
  build: {
    // lib/liveblocks.ts imports "server-only", which throws unless resolved with this condition (as
    // Next.js does on the server). Our task code doesn't use React, so nothing else is affected.
    conditions: ["react-server"],
  },
})
