import type { Edge, EdgeMarker, Node } from "@xyflow/react"

// Shared canvas schema: user-created nodes, AI output and starter templates all use it
// (architecture invariant 5).

/** Supported node shapes (ui-context "Node Shapes"). */
export const NODE_SHAPES = ["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"] as const
export type NodeShape = (typeof NODE_SHAPES)[number]

/**
 * Node color pairs (ui-context "Node Color Palette"): mid-tone fills that stand apart from the dark
 * canvas and from each other, with near-white text (WCAG AA, ≥ 4.5:1 on every fill).
 */
export const NODE_COLORS = [
  { name: "Neutral", color: "#3F3F46", textColor: "#FAFAFA" },
  { name: "Blue", color: "#1D4ED8", textColor: "#EFF6FF" },
  { name: "Purple", color: "#7E22CE", textColor: "#FAF5FF" },
  { name: "Orange", color: "#C2410C", textColor: "#FFF7ED" },
  { name: "Red", color: "#B91C1C", textColor: "#FEF2F2" },
  { name: "Pink", color: "#BE185D", textColor: "#FDF2F8" },
  { name: "Green", color: "#15803D", textColor: "#F0FDF4" },
  { name: "Teal", color: "#0F766E", textColor: "#F0FDFA" },
] as const

export const DEFAULT_NODE_COLOR = NODE_COLORS[0].color
export const DEFAULT_NODE_TEXT_COLOR = NODE_COLORS[0].textColor

// Fills of the first palette (near-black, hard to tell apart), in NODE_COLORS order. Nodes already in
// rooms and saved canvases still store these, so they're shown with the matching current pair.
const LEGACY_FILLS = ["#1f1f1f", "#10233d", "#2e1938", "#331b00", "#3c1618", "#3a1726", "#0f2e18", "#062822"]

/** The colors to draw a node with: its stored pair, or the current pair for a legacy fill. */
export function resolveNodeColors(data: Pick<CanvasNodeData, "color" | "textColor">): {
  color: string
  textColor: string
} {
  const legacy = LEGACY_FILLS.indexOf(data.color.toLowerCase())
  if (legacy !== -1) return NODE_COLORS[legacy]
  return { color: data.color, textColor: data.textColor ?? DEFAULT_NODE_TEXT_COLOR }
}

// `type`, not `interface`: React Flow requires node data to be a Record<string, unknown>,
// which interfaces don't satisfy (they have no implicit index signature).
export type CanvasNodeData = {
  label: string
  /** Node fill color (hex), normally one of NODE_COLORS. */
  color: string
  /** Label color paired with `color`. Optional: nodes created before feature 15 don't have it. */
  textColor?: string
  shape: NodeShape
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">
export type CanvasEdgeData = {
  /** Inline edge label; empty or missing = no label. */
  label?: string
}

export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">

/**
 * Arrow at the end of every edge (ui-context "Edge Style"). A string literal, not `MarkerType.ArrowClosed`:
 * @xyflow/react is a "use client" module and this file is also imported by server code.
 */
export const EDGE_MARKER_END: EdgeMarker = { type: "arrowclosed", color: "var(--edge-color)", width: 18, height: 18 }
