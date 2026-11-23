import type { Edge, Node } from "@xyflow/react"

// Shared canvas schema: user-created nodes, AI output and starter templates all use it
// (architecture invariant 5).

/** Supported node shapes (ui-context "Node Shapes"). */
export const NODE_SHAPES = ["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"] as const
export type NodeShape = (typeof NODE_SHAPES)[number]

/** Default node fill (ui-context "Node Color Palette"); the full palette lands in feature 15. */
export const DEFAULT_NODE_COLOR = "#1F1F1F"

// `type`, not `interface`: React Flow requires node data to be a Record<string, unknown>,
// which interfaces don't satisfy (they have no implicit index signature).
export type CanvasNodeData = {
  label: string
  /** Node fill color (hex); the text color is paired with it (palette lands in feature 15). */
  color: string
  shape: NodeShape
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">
export type CanvasEdgeData = {
  /** Inline edge label; empty or missing = no label. */
  label?: string
}

export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">
