import { FileText, Ghost, MessageSquareText, Sparkles, Users, type LucideIcon } from "lucide-react"
import type { CSSProperties } from "react"

import { CURSOR_COLORS } from "@/lib/liveblocks"
import { NODE_COLORS } from "@/types/canvas"

const palette = (name: (typeof NODE_COLORS)[number]["name"]) => NODE_COLORS.find((c) => c.name === name)!

interface Step {
  icon: LucideIcon
  title: string
  description: string
  hue: ReturnType<typeof palette>
}

// The product flow, in order: one hue per step so the four read apart at a glance.
const steps: Step[] = [
  {
    icon: MessageSquareText,
    title: "Describe it",
    description: "Type the system you have in mind, in plain English.",
    hue: palette("Blue"),
  },
  {
    icon: Sparkles,
    title: "AI drafts the diagram",
    description: "Services, databases and queues appear as a connected graph.",
    hue: palette("Purple"),
  },
  {
    icon: Users,
    title: "Refine together",
    description: "Edit the same canvas with your team, with live cursors.",
    hue: palette("Green"),
  },
  {
    icon: FileText,
    title: "Ship the spec",
    description: "Turn the finished graph into a Markdown technical spec.",
    hue: palette("Orange"),
  },
]

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    // minmax(0,1fr): grid columns default to min-width:auto, which let Clerk's
    // card push the page wider than a phone screen. lg:h-dvh: on desktop both halves are exactly one
    // screen tall, and the intro scales with the height (dvh-based sizes below) instead of scrolling.
    // lg:flex-none: the body is a flex column, and flex-1 would override the height and grow with content.
    <div className="grid min-h-dvh flex-1 grid-cols-[minmax(0,1fr)] bg-base lg:h-dvh lg:flex-none lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)]">
      <section className="hidden min-h-0 flex-col overflow-y-auto border-r border-surface-border bg-surface px-10 py-[clamp(1.25rem,4dvh,2.5rem)] lg:flex xl:px-16">
        {/* Brand and story share one centered column, so the two halves mirror each other (the sign-in
            card is centered in its half too). */}
        <div className="mx-auto flex w-full max-w-lg items-center gap-2.5 text-copy-primary xl:max-w-xl">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent-dim">
            <Ghost className="size-5 text-brand" aria-hidden />
          </span>
          <span className="font-semibold tracking-tight">Ghost AI</span>
        </div>

        {/* my-auto: the brand stays pinned to the top while the story centers in the remaining height. */}
        <div className="mx-auto my-auto flex w-full max-w-lg flex-col gap-[clamp(1.25rem,3.6dvh,2.5rem)] py-[clamp(0.75rem,2.5dvh,2rem)] xl:max-w-xl">
          <div className="flex flex-col gap-[clamp(0.5rem,1.6dvh,1rem)]">
            <h1 className="text-[clamp(1.75rem,4.4dvh,2.25rem)] leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-copy-primary">
              System design, drafted by AI and refined together.
            </h1>
            <p className="max-w-[46ch] text-base leading-relaxed text-pretty text-copy-secondary">
              From a sentence to a shared architecture diagram and a technical spec, in one workspace.
            </p>
          </div>

          <DiagramIllustration />

          {/* 2 × 2: half the height of a list, and balanced under the diagram. Reading order (left to
              right, then down) follows the product flow. */}
          <ol className="grid grid-cols-2 gap-x-6 gap-y-[clamp(1rem,2.8dvh,1.75rem)]" aria-label="How it works">
            {steps.map(({ icon: Icon, title, description, hue }) => (
              <li key={title} className="flex items-start gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border-[1.5px]"
                  style={{ backgroundColor: hue.color, borderColor: hue.border, color: hue.textColor } as CSSProperties}
                >
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col gap-1 pt-0.5">
                  <span className="text-sm font-medium text-copy-primary">{title}</span>
                  <span className="text-sm leading-snug text-copy-muted">{description}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="flex min-w-0 items-center justify-center overflow-y-auto p-4 sm:p-6">{children}</section>
    </div>
  )
}

/**
 * A slice of the real product: the prompt someone typed, the diagram Ghost AI is drafting from it (the
 * editor's shapes, palette, labeled smooth-step edges), the AI's cursor on the node it's adding, and a
 * teammate's cursor. Static SVG, so it costs nothing on the sign-in page.
 */
function DiagramIllustration() {
  const neutral = palette("Neutral")
  const blue = palette("Blue")
  const purple = palette("Purple")
  const teal = palette("Teal")
  const orange = palette("Orange")
  const teammate = CURSOR_COLORS[4] // pink, a real cursor color
  const ai = "var(--accent-ai-text)" // Ghost AI's presence color
  const label = { fontSize: 10.5, fontWeight: 500, textAnchor: "middle", dominantBaseline: "central" } as const
  const edgeLabel = { fontSize: 9, fill: "var(--text-secondary)", textAnchor: "middle", dominantBaseline: "central" } as const

  return (
    // w-fit + a height cap: on short screens the diagram shrinks (keeping its ratio) instead of
    // pushing the steps below the fold.
    <figure className="w-fit max-w-full overflow-hidden rounded-2xl border border-surface-border bg-base shadow-[0_24px_48px_-24px_rgb(0_0_0/0.7)]">
      <svg
        viewBox="0 0 440 214"
        className="block h-[min(27dvh,264px)] w-auto max-w-full"
        role="img"
        aria-label="Example: the prompt “Design a food delivery backend” becomes a diagram where clients call an API gateway over HTTPS, the gateway calls an orders service over gRPC, and the service writes to an orders database while Ghost AI adds an event queue"
      >
        <defs>
          <pattern id="intro-dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" fill="var(--border-subtle)" />
          </pattern>
          <marker id="intro-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--edge-color)" />
          </marker>
        </defs>
        <rect width="440" height="214" fill="url(#intro-dots)" />

        {/* The prompt the diagram came from. */}
        <g transform="translate(14 14)">
          <rect width="206" height="24" rx="12" fill="var(--accent-ai-dim)" stroke="var(--accent-ai)" strokeOpacity="0.45" />
          <path
            d="M14 6.5 L15.4 10.6 L19.5 12 L15.4 13.4 L14 17.5 L12.6 13.4 L8.5 12 L12.6 10.6 Z"
            fill="var(--accent-ai-text)"
          />
          <text x="26" y="12" fill="var(--accent-ai-text)" fontSize="10.5" fontWeight="500" dominantBaseline="central">
            Design a food delivery backend
          </text>
        </g>

        {/* Edges: right angles like the editor's smooth-step edges, at its resting opacity. */}
        <g fill="none" stroke="var(--edge-color)" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round">
          <path d="M66 112 H98" markerEnd="url(#intro-arrow)" />
          <path d="M182 112 H220" markerEnd="url(#intro-arrow)" />
          <path d="M318 112 H339 V72 H357" markerEnd="url(#intro-arrow)" />
          <path d="M318 112 H339 V156 H357" strokeDasharray="4 3" markerEnd="url(#intro-arrow)" />
        </g>

        {/* Edge labels: the editor's small pills. The two short horizontal edges carry theirs just above
            the line, or the pill would hide the arrow. */}
        <g>
          <rect x="65" y="91" width="34" height="14" rx="7" fill="var(--bg-elevated)" />
          <text x="82" y="98" {...edgeLabel}>HTTPS</text>
          <rect x="185" y="91" width="32" height="14" rx="7" fill="var(--bg-elevated)" />
          <text x="201" y="98" {...edgeLabel}>gRPC</text>
          <rect x="325" y="83" width="28" height="14" rx="7" fill="var(--bg-elevated)" />
          <text x="339" y="90" {...edgeLabel}>SQL</text>
        </g>

        {/* Clients (circle) */}
        <circle cx="40" cy="112" r="25" fill={neutral.color} stroke={neutral.border} strokeWidth="1.5" />
        <text x="40" y="112" fill={neutral.textColor} {...label}>Clients</text>

        {/* API gateway (hexagon) */}
        <polygon
          points="100,112 113,91 169,91 182,112 169,133 113,133"
          fill={blue.color}
          stroke={blue.border}
          strokeWidth="1.5"
        />
        <text x="141" y="112" fill={blue.textColor} {...label}>API gateway</text>

        {/* Orders service (pill) */}
        <rect x="222" y="94" width="96" height="36" rx="18" fill={purple.color} stroke={purple.border} strokeWidth="1.5" />
        <text x="270" y="112" fill={purple.textColor} {...label}>Orders service</text>

        {/* Orders DB (cylinder) */}
        <path d="M359 58 v28 a36 6 0 0 0 72 0 v-28" fill={teal.color} stroke={teal.border} strokeWidth="1.5" />
        <ellipse cx="395" cy="58" rx="36" ry="6" fill={teal.color} stroke={teal.border} strokeWidth="1.5" />
        <text x="395" y="75" fill={teal.textColor} {...label}>Orders DB</text>

        {/* Event queue (cylinder), still being drafted by Ghost AI: dashed and not yet solid. */}
        <g opacity="0.8">
          <path
            d="M359 142 v28 a36 6 0 0 0 72 0 v-28"
            fill={orange.color}
            stroke={orange.border}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <ellipse cx="395" cy="142" rx="36" ry="6" fill={orange.color} stroke={orange.border} strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="395" y="159" fill={orange.textColor} {...label}>Event queue</text>
        </g>

        {/* Ghost AI's cursor, on the node it is adding. */}
        <Cursor x={346} y={176} color={ai} name="Ghost AI" width={48} />
        {/* A teammate's live cursor. */}
        <Cursor x={252} y={136} color={teammate} name="Mai" width={30} />
      </svg>
    </figure>
  )
}

/** A live cursor: the editor's pointer plus a name pill in the participant's color. */
function Cursor({ x, y, color, name, width }: { x: number; y: number; color: string; name: string; width: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 L0 14 L4 10.5 L7 17 L9.5 16 L6.5 9.5 L11.5 9.5 Z" fill={color} stroke="var(--bg-base)" strokeWidth="1" />
      <rect x="10" y="15" width={width} height="16" rx="8" fill={color} />
      <text
        x={10 + width / 2}
        y="23"
        fill="var(--bg-base)"
        fontSize="9"
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {name}
      </text>
    </g>
  )
}
