# Ghost AI — UI Context

## 1. Design Direction

Ghost AI uses a dark-only interface designed for a technical engineering workspace.

The design should feel:
- Dark.
- Technical.
- Precise.
- Modern.
- Functional.
- Minimal and structured.

The application should resemble a professional system-design tool rather than a conventional marketing website.

## 2. Theme

- Dark only. No light mode. The visual language is a dark technical workspace: near-black backgrounds, layered surfaces, and vivid accent colours for interactive elements.
- No light theme.
- All colours must be defined through centralised design tokens.
- Avoid hardcoded colour values throughout components.
- Maintain consistent contrast and readability.

## 3. Design Tokens

Define the design system using CSS custom properties in `app/globals.css`.

The token system should cover:

### Background
- Main application background.
- Secondary background.
- Elevated surface.
- Canvas background.

### Text
- Primary text.
- Secondary text.
- Muted text.
- Disabled text.

### Borders
- Default border.
- Subtle border.
- Focus border.

### Interactive Elements
- Primary action.
- Secondary action.
- Hover state.
- Active state.
- Destructive state.
- Focus ring.

All colours are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens: no hardcoded hex values or raw Tailwind colour classes like `zinc-*`.

| Role | CSS Variable | Hex / Value |
|---|---|---|
| Page background | `--bg-base` | `#080809` |
| Surface | `--bg-surface` | `#111114` |
| Elevated surface | `--bg-elevated` | `#18181c` |
| Subtle surface | `--bg-subtle` | `#1e1e23` |
| Faint text | `--text-faint` | `#505060` |
| Brand accent | `--accent-primary` | `#00c8d4` (cyan) |
| Brand dim | `--accent-primary-dim` | `rgba(0, 200, 212, 0.12)` |
| AI accent | `--accent-ai` | `#6457f9` (indigo-purple) |
| AI text | `--accent-ai-text` | `#8b82ff` |
| Error | `--state-error` | `#ff4d4f` |
| Success | `--state-success` | `#34d399` |
| Warning | `--state-warning` | `#fbbf24` |

Rows not yet captured from the reference (e.g. borders, primary/secondary/muted text) must also come from the original design reference. Do not invent replacement hex values.

## 4. Typography

Establish consistent typography tokens.

Define:
- Primary font family.
- Font weights.
- Heading sizes.
- Body text sizes.
- Small text and metadata sizes.
- Line heights.

Use a consistent typographic hierarchy throughout the application.

| Role | Font | CSS Variable |
|---|---|---|
| UI text | Geist Sans | `--font-geist-sans` |
| Code/mono | Geist Mono | `--font-geist-mono` |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Geist Sans with `antialiased`.

## 5. Border Radius

Define a reusable border-radius scale for:
- Buttons.
- Input fields.
- Cards.
- Dialogs.
- Panels.
- Popovers.

Avoid arbitrary radius values in individual components.

## 6. Component Library

Use shadcn/ui for reusable UI components.

The initial design-system setup should include the components required throughout the application.

Examples of reusable primitives:
- Buttons.
- Dialogs.
- Dropdown menus.
- Inputs.
- Selects.
- Tabs.
- Tooltips.
- Cards.
- Avatars.
- Scroll areas.
- Separators.

Use the existing installed shadcn/ui components rather than creating unnecessary replacements.

Installed shadcn/ui component files should be treated as protected library outputs. Do not modify them without explicit instruction.

## 7. Layout Patterns

### Application Shell
Provides the main application structure and navigation.

### Project Interface
Displays project information and project-related actions.

### Architecture Workspace
Provides the main canvas area and associated editing tools.

### Sidebar
Provides contextual navigation and workspace-related functionality.

### Dialogues
Used for project creation and management interactions.

### Chat Sidebar
Provides the AI interaction interface.

### Collaboration Indicators
Displays avatars and collaborator presence.

## 8. Canvas Design

The architecture canvas is the primary workspace.

The interface must support:
- Node visibility.
- Edge visibility.
- Node selection.
- Node editing.
- Canvas navigation.
- Collaborative activity.
- AI-generated architecture updates.

Maintain a consistent visual distinction between the canvas and surrounding application interface.

## 9. Icons

Use Lucide React as the icon library.

Maintain consistent:
- Icon sizing.
- Stroke style.
- Alignment.
- Spacing.

Avoid introducing multiple unrelated icon libraries.

## 10. Styling Rules

- Use Tailwind CSS v4.
- Use centralised theme tokens.
- Avoid hardcoded hexadecimal colours.
- Avoid raw Tailwind colour classes when the design system provides a semantic token.
- Reuse shared component styles.
- Keep dark theme styling consistent.
- Avoid introducing a light theme.

## 11. UI Consistency

Every new feature must follow the established design system.

Before creating new UI components:
1. Check whether a reusable component already exists.
2. Check existing styling conventions.
3. Reuse established tokens.
4. Maintain the existing layout hierarchy.

Do not independently redesign existing application sections when implementing a new feature.