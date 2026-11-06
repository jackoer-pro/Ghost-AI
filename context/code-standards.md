# Ghost AI — Code Standards

## 1. General Principles

- Write maintainable and readable code.
- Follow the established architecture.
- Keep implementations focused.
- Avoid unnecessary abstractions.
- Reuse existing components and utilities.
- Avoid duplicated business logic.
- Maintain consistency across feature implementations.

## 2. TypeScript

- Enable strict TypeScript mode.
- Avoid using `any`.
- Define explicit types for important application data.
- Reuse shared types where appropriate.
- Handle nullable and optional values explicitly.
- Validate external data at system boundaries.

## 3. Next.js Conventions

- Use the App Router.
- Prefer Server Components by default.
- Use Client Components only when browser interactivity is required.
- Avoid unnecessary `use client` declarations.
- Keep server-side logic separate from client-side components.
- Follow the existing route and request-handler conventions.
- Use the installed Next.js version's official documentation.

## 4. React Conventions

- Use functional components.
- Keep components focused on their responsibilities.
- Reuse shared UI components.
- Avoid unnecessary state.
- Separate complex application logic from presentation.
- Maintain predictable component boundaries.

## 5. Styling Conventions

- Use Tailwind CSS v4.
- Use centralised design tokens.
- Avoid hardcoded hexadecimal colour values.
- Avoid raw Tailwind colour classes when semantic design tokens are available.
- Follow the dark-only theme.
- Reuse existing styling patterns.

## 6. UI Components

- Use shadcn/ui for standard UI primitives.
- Use Lucide React for icons.
- Create reusable application-level components where appropriate.
- Do not modify protected shadcn/ui component files without explicit instruction.
- Keep component responsibilities clear.

## 7. API and Request Handler Conventions

- Validate incoming data.
- Authenticate protected operations.
- Verify project ownership and membership.
- Enforce authorisation before mutations.
- Return appropriate error responses.
- Keep request handlers focused.
- Do not execute long-running AI generation inside ordinary request handlers.

## 8. Database Conventions

- Use Prisma for database operations.
- Use PostgreSQL for persistent metadata.
- Follow established Prisma models and relationships.
- Use migrations for schema changes.
- Avoid unnecessary database duplication.
- Keep large artifacts in Vercel Blob according to the architecture.

## 9. Real-Time Collaboration

- Use React Flow for canvas and diagram interactions.
- Use Liveblocks for collaborative functionality.
- Reuse the established collaboration architecture.
- Verify project membership before issuing collaboration tokens.
- Avoid implementing a separate custom WebSocket system when Liveblocks already provides the required functionality.

## 10. AI Integration

- Use the Vercel AI SDK for model integration.
- Follow the configured Gemini model.
- Keep AI generation separate from presentation components.
- Validate structured AI outputs.
- Handle model failures and asynchronous task states.
- Use Trigger.dev for long-running AI operations.

## 11. Background Processing

- Use Trigger.dev for long-running operations.
- Implement appropriate task status tracking.
- Use retry handling where appropriate.
- Report task progress to the frontend.
- Avoid blocking ordinary user interactions during background execution.

## 12. Storage

- PostgreSQL stores application metadata.
- Vercel Blob stores large artifacts.
- Avoid storing large JSON snapshots or lengthy Markdown documents directly in the database.
- Maintain references between database records and stored artifacts.

## 13. Code Verification

After implementing a feature:
- Check TypeScript errors.
- Run linting.
- Verify relevant functionality.
- Check affected application flows.
- Run the production build.
- Review security and authorisation boundaries.

Use the actual scripts configured in `package.json`.

## 14. Dependency Management

- Reuse existing dependencies.
- Avoid installing packages unnecessarily.
- Follow official integration documentation.
- Use the official agent skills for external services where available.
- Verify API compatibility with the installed framework version.