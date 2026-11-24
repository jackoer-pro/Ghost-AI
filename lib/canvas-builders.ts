import { SHAPE_DEFAULT_SIZES } from "@/lib/shape-drag"
import { EDGE_MARKER_END, NODE_COLORS, type CanvasEdge, type CanvasNode, type NodeShape } from "@/types/canvas"

// Builders shared by the starter templates and the AI design agent, so both produce the exact same
// node/edge schema as user-created content (architecture invariant 5).

export type ColorName = (typeof NODE_COLORS)[number]["name"]

/** Smallest node the resize handles allow (canvas-node.tsx); AI resizes are clamped to it too. */
export const MIN_NODE_WIDTH = 80
export const MIN_NODE_HEIGHT = 40

/** Node centered on (cx, cy) at its shape's default size, so columns line up whatever the shape. */
export function buildNode(
  id: string,
  label: string,
  shape: NodeShape,
  colorName: ColorName,
  cx: number,
  cy: number
): CanvasNode {
  const { width, height } = SHAPE_DEFAULT_SIZES[shape]
  const { color, textColor } = NODE_COLORS.find((c) => c.name === colorName)!
  return {
    id,
    type: "canvasNode",
    position: { x: cx - width / 2, y: cy - height / 2 },
    width,
    height,
    data: { label, color, textColor, shape },
  }
}

/** Center of a node, from its stored position and size (default size when it was never measured). */
export function nodeCenter(node: CanvasNode): { x: number; y: number } {
  const fallback = SHAPE_DEFAULT_SIZES[node.data.shape] ?? SHAPE_DEFAULT_SIZES.rectangle
  const width = node.width ?? fallback.width
  const height = node.height ?? fallback.height
  return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
}

/** Edge between the facing sides of two nodes (handle IDs are the side names, see canvas-node.tsx). */
export function buildEdge(source: CanvasNode, target: CanvasNode, label?: string): CanvasEdge {
  const a = nodeCenter(source)
  const b = nodeCenter(target)
  const dx = b.x - a.x
  const dy = b.y - a.y
  const horizontal = Math.abs(dx) >= Math.abs(dy)
  return {
    id: `${source.id}->${target.id}`,
    type: "canvasEdge",
    source: source.id,
    target: target.id,
    sourceHandle: horizontal ? (dx >= 0 ? "right" : "left") : dy >= 0 ? "bottom" : "top",
    targetHandle: horizontal ? (dx >= 0 ? "left" : "right") : dy >= 0 ? "top" : "bottom",
    markerEnd: EDGE_MARKER_END,
    data: label ? { label } : {},
  }
}
