# Ghost AI — Architecture

## 1. Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Framework | Next.js 16 | Full-stack application |
| UI | React 19 | Component-based interface |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS v4 | Styling system |
| UI components | shadcn/ui | Reusable UI primitives |
| Icons | Lucide React | Icon system |
| Authentication | Clerk | Identity and access management |
| Canvas | React Flow | Visual node-based editor |
| Real-time collaboration | Liveblocks | Presence and shared editing |
| Database | PostgreSQL | Persistent metadata |
| ORM | Prisma | Database access and modelling |
| Background processing | Trigger.dev | Long-running AI tasks |
| File storage | Vercel Blob | Canvas snapshots and Markdown specifications |
| AI model | Gemini 2.5 Flash | AI architecture generation |
| AI integration | Vercel AI SDK | Model integration |
| Code review | CodeRabbit | Automated code review |
| Deployment | Vercel | Application hosting |

## 2. System Architecture

### Application Layer

Next.js handles:
- Application routing.
- Page rendering.
- Server-side logic.
- API request handling.
- Integration with external services.

React handles interactive application components.

### Authentication Layer

Clerk handles:
- User authentication.
- Sign-in and sign-up.
- User identity.
- Route protection.
- Project ownership and collaborator access.

Clerk identity must be verified before protected operations.

### Database Layer

Prisma provides the application interface to PostgreSQL.

PostgreSQL stores metadata rather than large application artifacts.

### Collaboration Layer

React Flow:
- Architecture nodes.
- Connections and edges.
- Canvas interactions.
- Diagram structure.

Liveblocks:
- Real-time collaboration.
- User presence.
- Live cursors.
- Collaborative editing.
- Shared canvas state.

### AI Layer

Vercel AI SDK integrates Gemini 2.5 Flash.

Responsibilities:
- Process natural-language system descriptions.
- Generate structured architecture data.
- Support technical specification generation.

### Background Processing Layer

Trigger.dev handles long-running AI operations.

Responsibilities:
- Execute background generation tasks.
- Handle retries.
- Track task status.
- Report task progress to the frontend.

Long-running AI generation must not execute inside ordinary Next.js request handlers.

### Storage Layer

Vercel Blob stores large application artifacts, including:
- Canvas snapshots.
- Generated Markdown specifications.

PostgreSQL stores associated metadata.

## 3. Hybrid Storage Model

Ghost AI uses a hybrid storage approach.

### PostgreSQL
Stores metadata and structured application records.

### Vercel Blob
Stores larger artifacts such as:
- Canvas snapshot files.
- Generated technical specification documents.

Do not store large JSON snapshots or lengthy Markdown documents directly in PostgreSQL when the established architecture assigns them to Blob storage.

## 4. Security and Access Control

- Clerk manages user identity.
- Verify project membership before issuing Liveblocks tokens.
- Enforce authentication and ownership at every mutation boundary.
- Protect project operations from unauthorised users.
- Never trust client-side permission checks alone.
- Keep API credentials on the server.

A Liveblocks token must never be issued before verifying the requesting user's membership in the relevant project.

## 5. System Invariants

The following rules must not be violated:

1. Long-running AI generation belongs in Trigger.dev background tasks, not ordinary request handlers.
2. PostgreSQL stores metadata; large artifacts belong in Vercel Blob.
3. Authentication and ownership must be enforced at every mutation boundary.
4. Project membership must be verified before issuing Liveblocks tokens.
5. Server Components are the default.
6. Client Components should only be introduced when browser interactivity requires them.
7. The architecture canvas schema must remain consistent between generation, editing, persistence, and specification generation.
8. Existing service responsibilities must not be duplicated.

## 6. External Service Integration

### Clerk + Liveblocks
Clerk identifies the user. The application verifies project membership before issuing a Liveblocks collaboration token.

### React Flow + Liveblocks
React Flow manages the diagram interface. Liveblocks provides the collaborative synchronisation layer.

### Trigger.dev + Vercel AI SDK
Trigger.dev executes long-running AI generation tasks. The AI SDK communicates with the model.

### Prisma + PostgreSQL + Vercel Blob
Prisma manages database access. PostgreSQL stores metadata. Vercel Blob stores large artifacts.

## 7. Architecture Boundaries

- Application routing and request handlers: Next.js.
- UI and interactive components: React.
- Identity: Clerk.
- Diagram editing: React Flow.
- Collaboration: Liveblocks.
- Data modelling: Prisma.
- Persistent metadata: PostgreSQL.
- Large artifacts: Vercel Blob.
- Long-running tasks: Trigger.dev.
- AI model integration: Vercel AI SDK.

Exact directory ownership and route paths should follow the repository's implemented structure.
