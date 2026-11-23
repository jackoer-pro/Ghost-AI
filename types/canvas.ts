import type { Edge, Node } from "@xyflow/react"

// Shared canvas schema: user-created nodes, AI output and starter templates all use it
// (architecture invariant 5).

/** Supported node shapes (ui-context "Node Shapes"). */
export const NODE_SHAPES = ["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"] as const
export type NodeShape = (typeof NODE_SHAPES)[number]

/** Node color pairs (ui-context "Node Color Palette"): dark fill + vivid text tuned for the dark canvas. */
export const NODE_COLORS = [
  { name: "Neutral", color: "#1F1F1F", textColor: "#EDEDED" },
  { name: "Blue", color: "#10233D", textColor: "#52A8FF" },
  { name: "Purple", color: "#2E1938", textColor: "#BF7AF0" },
  { name: "Orange", color: "#331B00", textColor: "#FF990A" },
  { name: "Red", color: "#3C1618", textColor: "#FF6166" },
  { name: "Pink", color: "#3A1726", textColor: "#F75F8F" },
  { name: "Green", color: "#0F2E18", textColor: "#62C073" },
  { name: "Teal", color: "#062822", textColor: "#0AC7B4" },
] as const

export const DEFAULT_NODE_COLOR = NODE_COLORS[0].color
export const DEFAULT_NODE_TEXT_COLOR = NODE_COLORS[0].textColor

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
