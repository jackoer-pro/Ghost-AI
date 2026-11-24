import type { Edge, EdgeMarker, Node } from "@xyflow/react"

// Shared canvas schema: user-created nodes, AI output and starter templates all use it
// (architecture invariant 5).

/** Supported node shapes (ui-context "Node Shapes"). */
export const NODE_SHAPES = ["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"] as const
export type NodeShape = (typeof NODE_SHAPES)[number]

/**
 * Node colors (ui-context "Node Color Palette"): a dark fill tinted with the hue (32% of the hue over
 * `--bg-surface`), a softer outline in the same hue that carries most of the color, and a pale tinted
 * label (≥ 9:1 on its fill). Only `color` and `textColor` are stored on nodes; `border` is looked up.
 */
export const NODE_COLORS = [
  { name: "Neutral", color: "#303035", border: "#5E5E65", textColor: "#F4F4F5" },
  { name: "Blue", color: "#1E355C", border: "#4C83CB", textColor: "#DBEAFE" },
  { name: "Purple", color: "#41275D", border: "#9A68CC", textColor: "#F3E8FF" },
  { name: "Orange", color: "#5B3015", border: "#CB7530", textColor: "#FFEDD5" },
  { name: "Red", color: "#582123", border: "#C8595A", textColor: "#FEE2E2" },
  { name: "Pink", color: "#57233F", border: "#C55A92", textColor: "#FCE7F3" },
  { name: "Green", color: "#164B2C", border: "#3AB267", textColor: "#DCFCE7" },
  { name: "Teal", color: "#124643", border: "#25A99A", textColor: "#CCFBF1" },
] as const

export type NodeColors = { color: string; textColor: string; border: string }

export const DEFAULT_NODE_COLOR = NODE_COLORS[0].color
export const DEFAULT_NODE_TEXT_COLOR = NODE_COLORS[0].textColor

// Fills of earlier palettes, each in NODE_COLORS order. Nodes in rooms and saved canvases still store
// them, so they're drawn with the current pair at the same position.
const LEGACY_FILLS = [
  // v1: near-black, hard to tell apart
  ["#1f1f1f", "#10233d", "#2e1938", "#331b00", "#3c1618", "#3a1726", "#0f2e18", "#062822"],
  // v2: saturated mid-tones, too loud on the dark workspace
  ["#3f3f46", "#1d4ed8", "#7e22ce", "#c2410c", "#b91c1c", "#be185d", "#15803d", "#0f766e"],
]

/** The colors to draw a node with: its palette entry (current or legacy fill), else its stored pair. */
export function resolveNodeColors(data: Pick<CanvasNodeData, "color" | "textColor">): NodeColors {
  const fill = data.color.toLowerCase()
  const current = NODE_COLORS.find((c) => c.color.toLowerCase() === fill)
  if (current) return current
  for (const fills of LEGACY_FILLS) {
    const i = fills.indexOf(fill)
    if (i !== -1) return NODE_COLORS[i]
  }
  return { color: data.color, textColor: data.textColor ?? DEFAULT_NODE_TEXT_COLOR, border: "var(--border-subtle)" }
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
