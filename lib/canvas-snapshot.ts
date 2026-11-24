import { NODE_SHAPES, type CanvasEdge, type CanvasNode } from "@/types/canvas"

/** What autosave stores in Vercel Blob: the room's nodes and edges, nothing else. */
export interface CanvasSnapshot {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/** Largest snapshot the save route accepts (serialized). A few thousand nodes fit comfortably. */
export const MAX_SNAPSHOT_BYTES = 2_000_000

// Per-viewer UI state React Flow keeps on nodes/edges. Not part of the diagram, and saving it would
// make a mere click (selection) or an in-progress drag look like an unsaved change.
const TRANSIENT_KEYS = ["selected", "dragging", "resizing", "measured"] as const

function withoutTransient<T extends object>(item: T): T {
  const copy = { ...item }
  for (const key of TRANSIENT_KEYS) delete (copy as Record<string, unknown>)[key]
  return copy
}

export function toSnapshot(nodes: CanvasNode[], edges: CanvasEdge[]): CanvasSnapshot {
  return { nodes: nodes.map(withoutTransient), edges: edges.map(withoutTransient) }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.length > 0

function isNode(value: unknown): value is CanvasNode {
  if (!isObject(value) || !isNonEmptyString(value.id) || value.type !== "canvasNode") return false
  const { position, data } = value
  return (
    isObject(position) &&
    Number.isFinite(position.x) &&
    Number.isFinite(position.y) &&
    isObject(data) &&
    typeof data.label === "string" &&
    typeof data.color === "string" &&
    (NODE_SHAPES as readonly unknown[]).includes(data.shape)
  )
}

function isEdge(value: unknown): value is CanvasEdge {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.source) &&
    isNonEmptyString(value.target) &&
    (value.data === undefined || isObject(value.data))
  )
}

/**
 * Validates a snapshot from an untrusted source (a save request, or a stored blob that any project
 * member could have written). Returns null when the shape is wrong, so a bad save can't later be
 * loaded into everyone's room. Transient keys are dropped.
 */
export function parseCanvasSnapshot(value: unknown): CanvasSnapshot | null {
  if (!isObject(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return null
  if (!value.nodes.every(isNode) || !value.edges.every(isEdge)) return null
  return toSnapshot(value.nodes, value.edges)
}
