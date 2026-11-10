# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Features 01 (design system) and 02 (editor chrome) are done; waiting for the next feature spec.

## Completed

- Project overview written (`context/project-overview.md`).
- Feature spec 01 written (`context/feature-specs/01_design_system.md`).
- Feature 01 design system: shadcn/ui configured; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added in `components/ui/`; `lucide-react` installed; `lib/utils.ts` exports `cn()` (clsx + tailwind-merge); `dark` class set on `<html>`. `tsc`, `eslint` and `next build` pass.

- Design tokens from `context/ui-context.md` wired into `app/globals.css` (`:root`, mapped to shadcn semantic vars and `@theme inline`); light theme and `.dark` block removed; `--font-sans`/`--font-mono` point at Geist.

- Feature spec 02 written (`context/feature-specs/02_editors.md`).
- Feature 02 editor chrome: `components/editor/editor-navbar.tsx` (fixed-height navbar, left/center/right sections, sidebar toggle with `PanelLeftOpen`/`PanelLeftClose`; props `isSidebarOpen`, `onToggleSidebar`) and `components/editor/project-sidebar.tsx` (overlay sidebar sliding in from the left; props `isOpen`, `onClose`; `Projects` header + close button, My Projects / Shared tabs with empty placeholders, full-width `New Project` button). Dialog pattern: the existing `components/ui/dialog.tsx` already provides title, description and footer actions on `globals.css` tokens, so no new file was added. `tsc` and `eslint` pass (one pre-existing warning: unused `cn` import in `app/page.tsx`).

## In Progress

- None yet.

## Next Up

- Next feature spec (03) — not written yet.
- Mount the editor chrome on a route: a client parent owns the sidebar open state and wraps the canvas area in a `relative` container (the sidebar is `absolute` inside it).

## Open Questions

- Hex values for border and primary/secondary/muted text tokens are still missing from the design reference; `--foreground`, `--muted-foreground`, `--border`, `--input` temporarily keep shadcn's dark oklch values.

## Architecture Decisions

- Generated `components/ui/*` files are never edited after shadcn installation, so they can be regenerated or upgraded safely. One-time exception: the CLI emitted `import { cn } from "cn"` (a third-party npm package), so imports were switched to `@/lib/utils` and the `cn` package removed.
- Dark theme is always on (`dark` class on `<html>`); `globals.css` came with shadcn's light and dark tokens since no dark theme existed beforehand.
- shadcn here uses `@base-ui/react` primitives, not Radix.
- Editor chrome components carry no `"use client"` and hold no state; they take state and handlers as props, so the client boundary sits in whichever parent owns the sidebar state.
- The `New Project` button has no handler yet; it gets wired when the create-project dialog is built.

## Session Notes

- Read `AGENTS.md` first: this Next.js version has breaking changes, check `node_modules/next/dist/docs/` before writing code.
