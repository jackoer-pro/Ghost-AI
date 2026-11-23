import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import type { NodeShape } from "@/types/canvas"

interface NodeShapeBodyProps {
  shape: NodeShape
  /** Fill color (hex from node data). */
  color: string
  selected?: boolean
  className?: string
  children?: ReactNode
}

// SVG outlines in a 100×100 viewBox. `preserveAspectRatio="none"` stretches them to the node's
// size, and `vector-effect: non-scaling-stroke` keeps the border width constant while they stretch.
const SVG_SHAPES: Partial<Record<NodeShape, ReactNode>> = {
  diamond: <polygon points="50,0 100,50 50,100 0,50" />,
  hexagon: <polygon points="25,0 75,0 100,50 75,100 25,100 0,50" />,
  cylinder: (
    <>
      <path d="M0,12 A50,12 0 0 1 100,12 V88 A50,12 0 0 1 0,88 Z" />
      {/* Front rim of the top ellipse. */}
      <path d="M0,12 A50,12 0 0 0 100,12" fill="none" />
    </>
  ),
}

// Corner radius for the CSS shapes, and label insets that keep text inside the SVG outlines.
const SHAPE_CLASS: Record<NodeShape, string> = {
  rectangle: "rounded-xl px-3",
  pill: "rounded-full px-5",
  circle: "rounded-full px-3",
  diamond: "px-[25%] py-[25%]",
  hexagon: "px-[22%]",
  cylinder: "px-3 pt-[12%]",
}

/** Visual body of a node: CSS for rectangle/pill/circle, a stretched SVG for the rest. Fills its parent. */
export function NodeShapeBody({ shape, color, selected = false, className, children }: NodeShapeBodyProps) {
  const svg = SVG_SHAPES[shape]
  const borderColor = selected ? "var(--text-secondary)" : "var(--border-subtle)"

  return (
    <div
      className={cn("relative flex size-full items-center justify-center", SHAPE_CLASS[shape], className)}
      style={svg ? undefined : { backgroundColor: color, border: `1.5px solid ${borderColor}` }}
    >
      {svg ? (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          overflow="visible"
          aria-hidden
          className="absolute inset-0 size-full transition-[stroke] [&_*]:[vector-effect:non-scaling-stroke]"
          fill={color}
          stroke={borderColor}
          strokeWidth={1.5}
          strokeLinejoin="round"
        >
          {svg}
        </svg>
      ) : null}
      {/* Above the absolutely positioned SVG. */}
      <div className="relative min-w-0">{children}</div>
    </div>
  )
}
