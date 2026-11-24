# UI Context

## Theme

Dark only. No light mode. The visual language is a dark technical workspace — near-black backgrounds, layered surfaces, and vivid accent colors for interactive elements.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes like `zinc-*`.

| Role             | CSS Variable           | Hex / Value               |
| ---------------- | ---------------------- | ------------------------- |
| Page background  | `--bg-base`            | `#080809`                 |
| Surface          | `--bg-surface`         | `#111114`                 |
| Elevated surface | `--bg-elevated`        | `#18181c`                 |
| Subtle surface   | `--bg-subtle`          | `#1e1e23`                 |
| Default border   | `--border-default`     | `#2a2a30`                 |
| Subtle border    | `--border-subtle`      | `#3a3a42`                 |
| Primary text     | `--text-primary`       | `#f0f0f4`                 |
| Secondary text   | `--text-secondary`     | `#c0c0cc`                 |
| Muted text       | `--text-muted`         | `#808090`                 |
| Faint text       | `--text-faint`         | `#505060`                 |
| Brand accent     | `--accent-primary`     | `#00c8d4` (cyan)          |
| Brand dim        | `--accent-primary-dim` | `rgba(0, 200, 212, 0.12)` |
| AI accent        | `--accent-ai`          | `#6457f9` (indigo-purple) |
| AI text          | `--accent-ai-text`     | `#8b82ff`                 |
| Error            | `--state-error`        | `#ff4d4f`                 |
| Success          | `--state-success`      | `#34d399`                 |
| Warning          | `--state-warning`      | `#fbbf24`                 |

Tailwind utility names map to these variables. Use `bg-base`, `bg-surface`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.

Full utility list (defined in `app/globals.css` `@theme inline`):

| Utility suffix          | Variable                |
| ----------------------- | ----------------------- |
| `base`, `surface`, `elevated`, `subtle` | `--bg-*`    |
| `surface-border`        | `--border-default`      |
| `surface-border-subtle` | `--border-subtle`       |
| `copy-primary` / `copy-secondary` / `copy-muted` / `copy-faint` | `--text-*` |
| `brand`                 | `--accent-primary`      |
| `accent-dim`            | `--accent-primary-dim`  |
| `ai`, `ai-text`         | `--accent-ai`, `--accent-ai-text` |
| `ai-dim`                | `--accent-ai-dim` (`rgba(100, 87, 249, 0.14)`, derived from the AI accent for toggled AI controls) |

shadcn's semantic tokens (`--foreground`, `--muted-foreground`, `--border`, `--input`, …) point at these variables, so `components/ui/*` follows the same palette.

Role badges: owner = `bg-accent-dim text-brand`, collaborator = `bg-subtle text-copy-secondary` (`components/editor/role-badge.tsx`).

## Typography

| Role      | Font       | CSS Variable        |
| --------- | ---------- | ------------------- |
| UI text   | Geist Sans | `--font-geist-sans` |
| Code/mono | Geist Mono | `--font-geist-mono` |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Geist Sans with `antialiased`.

## Border Radius

Radius increases with surface depth — smaller for inner elements, larger for outer containers.

| Context           | Class         |
| ----------------- | ------------- |
| Inline / small UI | `rounded-xl`  |
| Cards / panels    | `rounded-2xl` |
| Modal / overlay   | `rounded-3xl` |

## Canvas

### Node Color Palette

8 defined color pairs. Each pair specifies a dark node fill and a vivid contrasting text color tuned for readability on the dark canvas. Defined in `types/canvas.ts` as `NODE_COLORS`.

| Node fill | Text color | Character              |
| --------- | ---------- | ---------------------- |
| `#1F1F1F` | `#EDEDED`  | Neutral dark (default) |
| `#10233D` | `#52A8FF`  | Blue                   |
| `#2E1938` | `#BF7AF0`  | Purple                 |
| `#331B00` | `#FF990A`  | Orange                 |
| `#3C1618` | `#FF6166`  | Red                    |
| `#3A1726` | `#F75F8F`  | Pink                   |
| `#0F2E18` | `#62C073`  | Green                  |
| `#062822` | `#0AC7B4`  | Teal                   |

Default node color: `#1F1F1F` with `#EDEDED` text.

Nodes store both colors (`data.color`, `data.textColor`). A selected node (only when it's the only one selected) shows a floating swatch toolbar 12px above it (`components/canvas/node-color-toolbar.tsx`, React Flow `NodeToolbar`): round swatches on a `bg-elevated` `rounded-xl` bar, active = `copy-primary` ring, hover = tight glow in the pair's text color.

### Edge Style

Smooth-step path with an arrow marker. Default edge color: `#f8fafc` (`--edge-color` in `globals.css`). Stroke width is thin (1.5px, round caps) — edges are visually secondary to nodes. Edges sit at 55% opacity at rest and go to full opacity on hover or selection. Labels are small `rounded-full` pill badges on `bg-elevated`.

### Node Shapes

6 supported shapes, defined in `types/canvas.ts` as `NODE_SHAPES`. Complex shapes (diamond, hexagon, cylinder) are rendered as inline SVGs rather than CSS borders.

- `rectangle` — default general-purpose node
- `diamond` — decision / gateway
- `circle` — event / endpoint
- `pill` — service / process
- `cylinder` — database / storage
- `hexagon` — external system / boundary

### Connection Handles

Small white circular handles (8px, `--text-primary` with a `--bg-base` border), hidden by default, revealed on node hover. Appear at all four sides of a node. Styled in `globals.css` (`.canvas-handle`).

### Canvas Background

React Flow `<Background>` component with the dot pattern (`--border-subtle` dots on `--bg-base`). React Flow runs with `colorMode="dark"`. The MiniMap sits on `--bg-surface` with a `rounded-xl` subtle border, and draws each node as its real shape with one hue per shape, taken from the bright column of the node palette: rectangle `#52A8FF`, diamond `#FF990A`, circle `#62C073`, pill `#BF7AF0`, cylinder `#0AC7B4`, hexagon `#F75F8F`. Fill is 35% opacity with a solid 1.5px outline; selected nodes go to 65% fill with a 2.5px outline. Minimap colors follow the shape, not the node's `data.color`, so the dark node fills don't disappear at minimap scale.

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch.

## Layout Patterns

- Editor workspace: full-viewport layout — floating sidebar overlay on the left, center canvas, slide-over AI sidebar on the right.
- Sidebars: floating overlay with dark semi-transparent background and subtle border.
- Modals and dialogs: centered overlay, `rounded-3xl`, dark background with backdrop blur.
- Navbar: top bar with dark background and bottom border.

## Control Labels

Every icon-only control is wrapped in `<Hint label="…">` (`components/hint.tsx`, shadcn Tooltip): a short label saying what it does, shown on hover and keyboard focus after 300ms (`TooltipProvider` in `app/layout.tsx`). Keep the `aria-label` on the control too. New icon buttons get a `Hint`.

## Icons

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for feature icons in empty states.

## Presence

Top-right canvas pill (`bg-surface/85`, `rounded-full`, blur): collaborator avatars `size-7` with `ring-2 ring-surface`, overlapping `-space-x-2`, max 5 then a `+N` chip (`bg-subtle`); initials sit on the person's cursor color with `text-bg-base`; a `h-5 w-px` divider only when collaborators exist; then the Clerk `UserButton` at `size-7`. Live cursors: 18px SVG pointer + name pill in the participant's `info.color` (from `cursorColor()`), dark `text-bg-base` text, constant on-screen size at any zoom.

## AI Sidebar

`components/editor/ai-sidebar.tsx`: floating slide-over on the right (`w-96`, same surface as the project sidebar). AI controls use the AI accent: primary buttons `bg-ai text-white`, active tab and icon tiles `bg-ai-dim text-ai-text`, starter chips `bg-subtle text-ai-text` pills. Chat bubbles: user = right, `border-2 border-brand/50 bg-accent-dim text-copy-primary`; assistant = left, `border border-surface-border bg-elevated text-ai-text`. Specs written for the upstream repo say `bg-accent` / `text-accent-text` / `text-primary-text` / `bg-brand-dim`; here those are `bg-ai` / `text-ai-text` / `text-copy-primary` / `bg-accent-dim` (`bg-accent` in this project is shadcn's grey `--accent`).
