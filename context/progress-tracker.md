# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Features 01 (design system), 02 (editor chrome) and 03 (auth) are done; waiting for the next feature spec.

## Completed

- Project overview written (`context/project-overview.md`).
- Feature spec 01 written (`context/feature-specs/01_design_system.md`).
- Feature 01 design system: shadcn/ui configured; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added in `components/ui/`; `lucide-react` installed; `lib/utils.ts` exports `cn()` (clsx + tailwind-merge); `dark` class set on `<html>`. `tsc`, `eslint` and `next build` pass.

- Design tokens from `context/ui-context.md` wired into `app/globals.css` (`:root`, mapped to shadcn semantic vars and `@theme inline`); light theme and `.dark` block removed; `--font-sans`/`--font-mono` point at Geist.

- Feature spec 02 written (`context/feature-specs/02_editors.md`).
- Feature 02 editor chrome: `components/editor/editor-navbar.tsx` (fixed-height navbar, left/center/right sections, sidebar toggle with `PanelLeftOpen`/`PanelLeftClose`; props `isSidebarOpen`, `onToggleSidebar`) and `components/editor/project-sidebar.tsx` (overlay sidebar sliding in from the left; props `isOpen`, `onClose`; `Projects` header + close button, My Projects / Shared tabs with empty placeholders, full-width `New Project` button). Dialog pattern: the existing `components/ui/dialog.tsx` already provides title, description and footer actions on `globals.css` tokens, so no new file was added. `tsc` and `eslint` pass (one pre-existing warning: unused `cn` import in `app/page.tsx`).

- Feature spec 03 written (`context/feature-specs/03_auth.md`).
- Feature 03 auth (Clerk, `@clerk/nextjs` 7.9.25 + `@clerk/ui` 1.42.4): `ClerkProvider` inside `<body>` in `app/layout.tsx` with the `dark` theme and appearance variables mapped to `globals.css` tokens; `proxy.ts` at the root protects every route except the sign-in/sign-up paths taken from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL`; `app/sign-in/[[...sign-in]]` and `app/sign-up/[[...sign-up]]` use `components/auth/auth-shell.tsx` (two panels on large screens, form only on small); `/` redirects to `/editor` when signed in and to `/sign-in` when signed out; `UserButton` sits in the editor navbar's right section; `app/editor/page.tsx` mounts the navbar and sidebar. `tsc`, `eslint` and `next build` pass; checked on `next start` while signed out: `/` and `/editor` return 307 to `/sign-in`, and `/sign-in` and `/sign-up` return 200.

- Prisma set up (Prisma 7.10.1, Prisma Postgres at `db.prisma.io`): `prisma.config.ts` reads `DATABASE_URL` from `.env.local`; `prisma/schema.prisma` has the datasource and a `prisma-client` generator writing to `lib/generated/prisma` (gitignored); `lib/prisma.ts` exports a single shared `prisma` client using `@prisma/adapter-pg`. No models yet, they get added with the first feature spec that needs them. Connection tested (`select version()` → PostgreSQL 17.2), and `tsc` passes.

## In Progress

- None yet.

## Next Up

- Next feature spec (04) — not written yet.
- Sign-in flow not yet tested in a browser (sign up, land on `/editor`, sign out via `UserButton`).

## Open Questions

- Hex values for border and primary/secondary/muted text tokens are still missing from the design reference; `--foreground`, `--muted-foreground`, `--border`, `--input` temporarily keep shadcn's dark oklch values.

## Architecture Decisions

- Generated `components/ui/*` files are never edited after shadcn installation, so they can be regenerated or upgraded safely. One-time exception: the CLI emitted `import { cn } from "cn"` (a third-party npm package), so imports were switched to `@/lib/utils` and the `cn` package removed.
- Dark theme is always on (`dark` class on `<html>`); `globals.css` came with shadcn's light and dark tokens since no dark theme existed beforehand.
- shadcn here uses `@base-ui/react` primitives, not Radix.
- Editor chrome components carry no `"use client"` and hold no state; they take state and handlers as props, so the client boundary sits in whichever parent owns the sidebar state.
- The `New Project` button has no handler yet; it gets wired when the create-project dialog is built.
- `.env.local` only had the Clerk keys, so the standard Clerk vars `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` were added; `proxy.ts` falls back to those paths if the vars are missing, so the auth pages can never get locked behind auth.
- `/` does its redirect inside `<Suspense>` because `cacheComponents: true` fails the build on `auth()` read outside Suspense; the Clerk `<SignIn />` / `<SignUp />` components are wrapped the same way.

## Session Notes

- This Next.js version (16.4) has breaking changes; check `node_modules/next/dist/docs/` before writing code. Route middleware lives in `proxy.ts`, not `middleware.ts`.
