# Architecture Context

## Stack

| Layer            | Technology              | Role                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                              |
| Auth             | Clerk                   | User identity and route protection                             |
| Database         | Prisma + PostgreSQL     | Relational metadata: projects, collaborators, specs, task runs |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Trigger.dev             | Durable AI generation workflows                                |
| Artifact storage | Vercel Blob             | Canvas snapshots and generated Markdown specs                  |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Database schema and generated client output.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.
- The Blob store is private: artifacts are written with `access: "private"` and only read server-side (with the store token) after an access check, never fetched by the browser from the blob URL.
- The Liveblocks room is the live source of truth for the canvas; the Blob snapshot is a backup that is only loaded into a room that is empty on open.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators.
- Only authenticated users can access protected routes. Pages are protected in `proxy.ts`; `/api/*` is excluded there and each handler checks `auth()` itself so it can return JSON `401`/`403`.
- Only the owner or a collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership. `POST /api/liveblocks-auth` uses access tokens (`prepareSession` + `allow(projectId, ["*:write"])`) scoped to that one room; rooms are created private (`defaultAccesses: []`), so this route is the only way in. Membership lives in PostgreSQL only and is never copied into Liveblocks permissions.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas content.
- Templates do not require a separate database record; they are resolved by template ID at import time.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state.
- Execution: durable background task via Trigger.dev.
- Output: structured node and edge updates written into the shared Liveblocks room.
- Flow (`trigger/design-agent.ts`): read the room with `mutateFlow` (`@liveblocks/react-flow/node`, the server side of `useLiveblocksFlow`), ask Gemini (`@ai-sdk/google`, `generateText` + `Output.object`) for a list of actions, then apply them one `mutateFlow` call each, so collaborators watch the diagram build.
- The model only proposes. `lib/design-actions.ts` validates and applies every action: shapes and colors come from `NODE_SHAPES` and the palette names, sizes from `SHAPE_DEFAULT_SIZES` (clamped to the UI's resize limits), and positions from grid cells (260px columns, 160px rows, the starter templates' spacing) with occupied cells skipped. Nodes and edges are built with `lib/canvas-builders.ts`, the same builders the starter templates use. An invalid action is skipped, never thrown.
- Progress goes to the room's `ai-status-feed` Liveblocks feed (`types/tasks.ts` schema: `stage` + `text`). The agent appears as the participant `ghost-ai-agent` ("Ghost AI") via server-set presence (`cursor` follows each change, `thinking: true`), cleared with a 2s TTL when the run ends.
- Room feeds: `ai-status-feed` (AI progress, written by tasks) and `ai-chat` (sidebar chat, written by members; `aiChatMessageSchema`: `sender`, `role`, `content`, `timestamp`). Never mixed. Both are created by `ensureRoomFeeds()` in `/api/liveblocks-auth` before a client connects, because `useFeedMessages` on a missing feed errors once and never retries. Feed data is validated with its Zod schema before rendering.
- One run per project at a time (task queue limit 1, `concurrencyKey` = project ID); no retries, because actions aren't idempotent. A failed run keeps the changes already applied and posts an `error` status.

### Spec Generation

- Input: current canvas graph and project context.
- Execution: durable background task via Trigger.dev.
- Output: Markdown technical spec saved to the filesystem and linked to the project in the database.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.