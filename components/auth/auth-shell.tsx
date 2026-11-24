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
    // card push the page wider than a phone screen.
    <div className="grid min-h-dvh flex-1 grid-cols-[minmax(0,1fr)] bg-base lg:grid-cols-2">
      <section className="hidden flex-col justify-center gap-8 border-r border-surface-border bg-surface px-12 py-10 lg:flex xl:px-16">
        <div className="flex items-center gap-2 text-copy-primary">
          <span className="flex size-8 items-center justify-center rounded-xl bg-accent-dim">
            <Ghost className="size-5 text-brand" aria-hidden />
          </span>
          <span className="font-semibold">Ghost AI</span>
        </div>

        <div className="flex max-w-md flex-col gap-3">
          <h1 className="text-3xl font-semibold text-balance text-copy-primary">
            System design, drafted by AI and refined together.
          </h1>
          <p className="text-copy-secondary">
            From a sentence to a shared architecture diagram and a technical spec, in one workspace.
          </p>
        </div>

        <DiagramIllustration />

        <ol className="grid max-w-md gap-4">
          {steps.map(({ icon: Icon, title, description, hue }, index) => (
            <li key={title} className="flex items-start gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-xl border-[1.5px]"
                style={{ backgroundColor: hue.color, borderColor: hue.border, color: hue.textColor } as CSSProperties}
              >
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-copy-primary">
                  <span className="mr-1.5 text-copy-muted">{index + 1}.</span>
                  {title}
                </span>
                <span className="text-sm text-copy-secondary">{description}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="flex min-w-0 items-center justify-center p-4 sm:p-6">
        {children}
      </section>
    </div>
  )
}

/** A small example canvas (same shapes, palette and edge style as the editor) with a teammate's cursor. */
function DiagramIllustration() {
  const blue = palette("Blue")
  const purple = palette("Purple")
  const green = palette("Green")
  const orange = palette("Orange")
  const cursor = CURSOR_COLORS[4] // pink, a real cursor color
  const label = { fontSize: 11, fontWeight: 500, textAnchor: "middle", dominantBaseline: "central" } as const

  return (
    <figure className="max-w-md rounded-2xl border border-surface-border bg-base p-4">
      <svg
        viewBox="0 0 360 160"
        className="w-full"
        role="img"
        aria-label="Example diagram: a client calls an API gateway, which writes to a database and publishes to a queue"
      >
        <defs>
          <pattern id="intro-dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--border-subtle)" />
          </pattern>
          <marker id="intro-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--edge-color)" />
          </marker>
        </defs>
        <rect width="360" height="160" fill="url(#intro-dots)" />

        {/* Edges: right angles, like the editor's smooth-step edges. */}
        <g fill="none" stroke="var(--edge-color)" strokeOpacity="0.6" strokeWidth="1.5" markerEnd="url(#intro-arrow)">
          <path d="M96 80 H128" />
          <path d="M228 80 H246 V38 H262" />
          <path d="M228 80 H246 V122 H262" />
        </g>

        {/* Client (pill) */}
        <rect x="12" y="62" width="84" height="36" rx="18" fill={blue.color} stroke={blue.border} strokeWidth="1.5" />
        <text x="54" y="80" fill={blue.textColor} {...label}>Client</text>

        {/* API gateway (rectangle) */}
        <rect x="130" y="62" width="98" height="36" rx="6" fill={purple.color} stroke={purple.border} strokeWidth="1.5" />
        <text x="179" y="80" fill={purple.textColor} {...label}>API gateway</text>

        {/* Database (cylinder) */}
        <path d="M264 26 v24 a40 6 0 0 0 80 0 v-24" fill={green.color} stroke={green.border} strokeWidth="1.5" />
        <ellipse cx="304" cy="26" rx="40" ry="6" fill={green.color} stroke={green.border} strokeWidth="1.5" />
        <text x="304" y="41" fill={green.textColor} {...label}>Database</text>

        {/* Queue (hexagon) */}
        <polygon
          points="274,104 334,104 344,122 334,140 274,140 264,122"
          fill={orange.color}
          stroke={orange.border}
          strokeWidth="1.5"
        />
        <text x="304" y="122" fill={orange.textColor} {...label}>Queue</text>

        {/* A teammate's live cursor */}
        <g transform="translate(196 104)">
          <path d="M0 0 L0 14 L4 10.5 L7 17 L9.5 16 L6.5 9.5 L11.5 9.5 Z" fill={cursor} stroke="var(--bg-base)" strokeWidth="1" />
          <rect x="10" y="16" width="34" height="16" rx="8" fill={cursor} />
          <text x="27" y="24" fill="var(--bg-base)" fontSize="9" fontWeight="600" textAnchor="middle" dominantBaseline="central">
            Mai
          </text>
        </g>

        {/* "Drafted by AI" badge */}
        <g transform="translate(12 12)">
          <rect width="92" height="20" rx="10" fill="var(--accent-ai-dim)" />
          <text x="46" y="10" fill="var(--accent-ai-text)" fontSize="10" fontWeight="500" textAnchor="middle" dominantBaseline="central">
            ✦ Drafted by AI
          </text>
        </g>
      </svg>
    </figure>
  )
}
