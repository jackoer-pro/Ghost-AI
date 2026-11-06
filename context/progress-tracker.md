# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Feature 01 (design system) is done; waiting for the next feature spec.

## Completed

- Project overview written (`context/project-overview.md`).
- Feature spec 01 written (`context/feature-specs/01_design_system.md`).
- Feature 01 design system: shadcn/ui configured; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added in `components/ui/`; `lucide-react` installed; `lib/utils.ts` exports `cn()` (clsx + tailwind-merge); `dark` class set on `<html>`. `tsc`, `eslint` and `next build` pass.

- Design tokens from `context/ui-context.md` wired into `app/globals.css` (`:root`, mapped to shadcn semantic vars and `@theme inline`); light theme and `.dark` block removed; `--font-sans`/`--font-mono` point at Geist.

## In Progress

- None yet.

## Next Up

- Next feature spec (02) — not written yet.

## Open Questions

- Hex values for border and primary/secondary/muted text tokens are still missing from the design reference; `--foreground`, `--muted-foreground`, `--border`, `--input` temporarily keep shadcn's dark oklch values.

## Architecture Decisions

- Generated `components/ui/*` files are never edited after shadcn installation, so they can be regenerated or upgraded safely. One-time exception: the CLI emitted `import { cn } from "cn"` (a third-party npm package), so imports were switched to `@/lib/utils` and the `cn` package removed.
- Dark theme is always on (`dark` class on `<html>`); `globals.css` came with shadcn's light and dark tokens since no dark theme existed beforehand.
- shadcn here uses `@base-ui/react` primitives, not Radix.

## Session Notes

- Read `AGENTS.md` first: this Next.js version has breaking changes, check `node_modules/next/dist/docs/` before writing code.
