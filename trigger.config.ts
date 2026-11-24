import { defineConfig } from "@trigger.dev/sdk"
import { config } from "dotenv"

// The CLI reads this file before (and separately from) its own .env loading, so load it here,
// the same way prisma.config.ts does. Shell/CI env vars still win over the file.
config({ path: ".env.local", quiet: true })

// The project ref (proj_…) comes from the Trigger.dev dashboard; it isn't secret, but keeping it
// in env lets each developer point `npx trigger.dev dev` at their own project.
const project = process.env.TRIGGER_PROJECT_REF
if (!project) throw new Error("TRIGGER_PROJECT_REF is not set")

export default defineConfig({
  project,
  dirs: ["./trigger"],
  maxDuration: 300, // seconds per run; AI generation (feature 23) fits well inside this
})
