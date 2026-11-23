import { DEFAULT_NODE_COLOR, NODE_SHAPES, type CanvasNode, type NodeShape } from "@/types/canvas"

/** Custom drag MIME type, so the canvas ignores unrelated drops (files, links, text). */
export const SHAPE_DRAG_TYPE = "application/x-canvas-shape"

export interface ShapeSize {
  width: number
  height: number
}

export interface ShapeDragPayload {
  shape: NodeShape
  size: ShapeSize
}

/** Default size of a newly dropped node, per shape. */
export const SHAPE_DEFAULT_SIZES: Record<NodeShape, ShapeSize> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 160, height: 160 }, // larger: the label only fits the middle of the diamond
  circle: { width: 100, height: 100 },
  pill: { width: 160, height: 60 },
  cylinder: { width: 120, height: 100 },
  hexagon: { width: 160, height: 100 },
}

export function shapeDragPayload(shape: NodeShape): string {
  return JSON.stringify({ shape, size: SHAPE_DEFAULT_SIZES[shape] } satisfies ShapeDragPayload)
}

/** Drag data comes from outside our code (any page can start a drag), so validate it. */
export function parseShapeDragPayload(raw: string): ShapeDragPayload | null {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof value !== "object" || value === null) return null
  const { shape, size } = value as Record<string, unknown>
  if (!NODE_SHAPES.includes(shape as NodeShape)) return null
  if (typeof size !== "object" || size === null) return null
  const { width, height } = size as Record<string, unknown>
  if (!isPositive(width) || !isPositive(height)) return null
  return { shape: shape as NodeShape, size: { width, height } }
}

function isPositive(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0
}

let nodeCounter = 0

/** `shape-timestamp-counter`: the counter keeps IDs unique when two drops land in the same millisecond. */
export function makeNodeId(shape: NodeShape, now = Date.now()): string {
  nodeCounter += 1
  return `${shape}-${now}-${nodeCounter}`
}

/** Builds the dropped node, centered on the drop point (given in canvas coordinates). */
export function createShapeNode({ shape, size }: ShapeDragPayload, at: { x: number; y: number }): CanvasNode {
  return {
    id: makeNodeId(shape),
    type: "canvasNode",
    position: { x: at.x - size.width / 2, y: at.y - size.height / 2 },
    width: size.width,
    height: size.height,
    data: { label: "", color: DEFAULT_NODE_COLOR, shape },
  }
}
