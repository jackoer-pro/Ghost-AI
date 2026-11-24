import type { MutableFlow } from "@liveblocks/react-flow/node"
import { z } from "zod"

import { buildEdge, buildNode, MIN_NODE_HEIGHT, MIN_NODE_WIDTH, nodeCenter, type ColorName } from "@/lib/canvas-builders"
import { SHAPE_DEFAULT_SIZES } from "@/lib/shape-drag"
import { NODE_COLORS, NODE_SHAPES, resolveNodeColors, type CanvasEdge, type CanvasNode } from "@/types/canvas"

// The design agent's contract: the model proposes actions; this file decides what actually lands on
// the canvas. Shapes, colors, sizes and spacing are enforced here, never left to the model.

/** Grid the agent lays out on: the starter templates' spacing (node centers 260px apart, rows 160px). */
export const GRID = { column: 260, row: 160 } as const
/** Upper bound on actions applied per run (also keeps a runaway response from flooding the room). */
export const MAX_ACTIONS = 60
const MAX_NODE_WIDTH = 480
const MAX_NODE_HEIGHT = 320
const MAX_LABEL_LENGTH = 60
/** How far from the origin the grid goes; keeps a nonsense coordinate from flinging a node off-screen. */
const MAX_CELL = 40

const COLOR_NAMES = NODE_COLORS.map((c) => c.name) as [ColorName, ...ColorName[]]

// One flat object instead of a discriminated union: structured-output support for `anyOf` varies across
// Gemini models, and a flat schema with optional fields works everywhere. Per-type checks happen below.
// No length/range limits in the schema either: one long label would fail the whole response, so values
// are clamped in code instead.
export const designActionSchema = z.object({
  type: z.enum(["add_node", "move_node", "resize_node", "update_node", "delete_node", "add_edge", "delete_edge"]),
  id: z
    .string()
    .optional()
    .describe("Node id. add_node: a short new id that later actions can reference. Other node actions: an existing id."),
  label: z.string().optional().describe("Node or edge label, at most 4 words."),
  shape: z.enum(NODE_SHAPES).optional(),
  color: z.enum(COLOR_NAMES).optional(),
  column: z.number().optional().describe("Grid column, left to right in the direction of flow."),
  row: z.number().optional().describe("Grid row, top to bottom for parallel components."),
  width: z.number().optional().describe("resize_node only, in pixels."),
  height: z.number().optional().describe("resize_node only, in pixels."),
  source: z.string().optional().describe("add_edge / delete_edge: source node id."),
  target: z.string().optional().describe("add_edge / delete_edge: target node id."),
})

export const designPlanSchema = z.object({
  summary: z.string().describe("One short sentence describing what changed, shown to everyone in the room."),
  actions: z.array(designActionSchema),
})

export type DesignAction = z.infer<typeof designActionSchema>
export type DesignPlan = z.infer<typeof designPlanSchema>

export const DESIGN_SYSTEM_PROMPT = `You are Ghost AI, a system design assistant editing a shared architecture diagram.
Return the smallest list of actions that fulfils the user's request.

Actions:
- add_node: id, label, shape, color, column, row
- move_node: id, column, row
- resize_node: id, width, height (only when asked; default sizes are best)
- update_node: id, and any of label, shape, color
- delete_node: id (its edges are removed with it)
- add_edge: source, target, optional label (e.g. "HTTPS", "events")
- delete_edge: source, target

Shapes (pick by meaning):
- circle: client, user or endpoint
- hexagon: gateway, load balancer, external system or boundary
- pill: service or process
- rectangle: general component, worker or job
- cylinder: database, cache or storage
- diamond: decision

Colors (use them consistently by role): Neutral = clients and users, Blue = entry points and gateways,
Purple = services, Teal = data stores, Orange = queues, streams and decisions, Pink = external or third-party,
Green = success paths and outputs, Red = failures and alerts.

Layout:
- Place nodes on a grid with integer column and row numbers. Flow runs left to right: callers in lower
  columns, the things they call in the next column. Put parallel components of one layer in the same
  column on different rows, centered around row 0.
- Never put two nodes in the same cell. When extending an existing diagram, use free cells next to the
  nodes you connect to.

Rules:
- Labels: short, at most 4 words. No ids in labels.
- A new design usually has 5 to 15 nodes. Connect every node to at least one other.
- Only change existing nodes when the request asks for it. Reference existing nodes by their exact id.
- Edges point in the direction of calls or data flow.`

// ---------------------------------------------------------------------------------------------------
// Canvas <-> grid

const cellOf = (node: CanvasNode) => {
  const { x, y } = nodeCenter(node)
  return { column: Math.round(x / GRID.column), row: Math.round(y / GRID.row) }
}

const clampCell = (n: number) => Math.max(-MAX_CELL, Math.min(MAX_CELL, Math.round(n)))

/** The canvas as the model sees it: grid cells and palette names instead of pixels and hex values. */
export function describeCanvas(nodes: readonly CanvasNode[], edges: readonly CanvasEdge[]): string {
  return JSON.stringify({
    nodes: nodes.map((node) => {
      const { color } = resolveNodeColors(node.data)
      return {
        id: node.id,
        label: node.data.label,
        shape: node.data.shape,
        color: NODE_COLORS.find((c) => c.color === color)?.name ?? "custom",
        ...cellOf(node),
      }
    }),
    edges: edges.map((edge) => ({ source: edge.source, target: edge.target, label: edge.data?.label || undefined })),
  })
}

/** First free cell at (column, row) or below it, so two nodes never overlap. */
function freeCell(flow: Flow, column: number, row: number, ignoreId?: string) {
  const taken = new Set(
    flow.nodes.filter((n) => n.id !== ignoreId).map((n) => {
      const cell = cellOf(n)
      return `${cell.column},${cell.row}`
    })
  )
  let r = row
  while (taken.has(`${column},${r}`) && r < row + 2 * MAX_CELL) r++
  return { column, row: r }
}

// ---------------------------------------------------------------------------------------------------
// Applying actions

type Flow = MutableFlow<CanvasNode, CanvasEdge>

/** Per-run state: the model's ids for nodes it added → the ids they really got. */
export interface ApplyContext {
  ids: Map<string, string>
}

export type ApplyResult =
  | { applied: true; /** Where the AI cursor should point (flow coordinates). */ focus?: { x: number; y: number } }
  | { applied: false; reason: string }

const skip = (reason: string): ApplyResult => ({ applied: false, reason })
const cleanLabel = (label: string | undefined) => (label ?? "").trim().slice(0, MAX_LABEL_LENGTH)
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "node"

function newNodeId(flow: Flow, hint: string): string {
  const base = `ai-${slug(hint)}`
  let id = base
  for (let n = 2; flow.getNode(id); n++) id = `${base}-${n}`
  return id
}

/** Re-picks the facing handles of every edge touching a moved node, keeping ids and labels. */
function refreshEdgeHandles(flow: Flow, nodeId: string) {
  for (const edge of flow.edges) {
    if (edge.source !== nodeId && edge.target !== nodeId) continue
    const source = flow.getNode(edge.source)
    const target = flow.getNode(edge.target)
    if (!source || !target) continue
    const { sourceHandle, targetHandle } = buildEdge(source, target)
    flow.updateEdge(edge.id, { sourceHandle, targetHandle })
  }
}

/**
 * The node a model reference points at. Models aren't consistent here, so in order: an id it gave a
 * node it added this run, an existing id, that id in our `ai-` form, then an exact label.
 */
function findNode(flow: Flow, ctx: ApplyContext, ref: string | undefined): CanvasNode | undefined {
  if (!ref) return undefined
  const mapped = ctx.ids.get(ref)
  const label = ref.trim().toLowerCase()
  return (
    (mapped && flow.getNode(mapped)) ||
    flow.getNode(ref) ||
    flow.getNode(`ai-${slug(ref)}`) ||
    flow.nodes.find((n) => n.data.label.trim().toLowerCase() === label)
  )
}

const EDGE_ACTIONS = new Set<DesignAction["type"]>(["add_edge", "delete_edge"])

/**
 * The order actions are applied in: node changes first, then edges (stable within each group), so an
 * edge the model listed before its nodes still finds them.
 */
export function orderActions(actions: readonly DesignAction[]): DesignAction[] {
  return [...actions.filter((a) => !EDGE_ACTIONS.has(a.type)), ...actions.filter((a) => EDGE_ACTIONS.has(a.type))]
}

/** Validates one model action and applies it to the flow. Invalid actions are skipped, never thrown. */
export function applyDesignAction(flow: Flow, action: DesignAction, ctx: ApplyContext): ApplyResult {
  const find = (ref: string | undefined) => findNode(flow, ctx, ref)

  switch (action.type) {
    case "add_node": {
      const shape = action.shape ?? "rectangle"
      const color = action.color ?? "Neutral"
      const fallbackColumn = flow.nodes.length ? Math.max(...flow.nodes.map((n) => cellOf(n).column)) + 1 : 0
      const { column, row } = freeCell(
        flow,
        clampCell(action.column ?? fallbackColumn),
        clampCell(action.row ?? 0)
      )
      const id = newNodeId(flow, action.id || action.label || shape)
      if (action.id) ctx.ids.set(action.id, id)
      const node = buildNode(id, cleanLabel(action.label), shape, color, column * GRID.column, row * GRID.row)
      flow.addNode(node)
      return { applied: true, focus: nodeCenter(node) }
    }

    case "move_node": {
      const node = find(action.id)
      if (!node) return skip(`move_node: unknown node ${action.id}`)
      const current = cellOf(node)
      const { column, row } = freeCell(
        flow,
        clampCell(action.column ?? current.column),
        clampCell(action.row ?? current.row),
        node.id
      )
      const { x, y } = nodeCenter(node)
      const dx = column * GRID.column - x
      const dy = row * GRID.row - y
      flow.updateNode(node.id, { position: { x: node.position.x + dx, y: node.position.y + dy } })
      refreshEdgeHandles(flow, node.id)
      return { applied: true, focus: { x: x + dx, y: y + dy } }
    }

    case "resize_node": {
      const node = find(action.id)
      if (!node) return skip(`resize_node: unknown node ${action.id}`)
      const defaults = SHAPE_DEFAULT_SIZES[node.data.shape]
      const width = Math.round(Math.min(MAX_NODE_WIDTH, Math.max(MIN_NODE_WIDTH, action.width ?? defaults.width)))
      const height = Math.round(Math.min(MAX_NODE_HEIGHT, Math.max(MIN_NODE_HEIGHT, action.height ?? defaults.height)))
      const center = nodeCenter(node) // resize around the center, so the node stays on its grid cell
      flow.updateNode(node.id, { width, height, position: { x: center.x - width / 2, y: center.y - height / 2 } })
      return { applied: true, focus: center }
    }

    case "update_node": {
      const node = find(action.id)
      if (!node) return skip(`update_node: unknown node ${action.id}`)
      const pair = action.color ? NODE_COLORS.find((c) => c.name === action.color) : undefined
      const data: Partial<CanvasNode["data"]> = {
        ...(action.label !== undefined ? { label: cleanLabel(action.label) } : {}),
        ...(pair ? { color: pair.color, textColor: pair.textColor } : {}),
        ...(action.shape ? { shape: action.shape } : {}),
      }
      if (Object.keys(data).length === 0) return skip(`update_node: nothing to change on ${node.id}`)
      flow.updateNodeData(node.id, data)
      if (action.shape && action.shape !== node.data.shape) {
        // A new shape gets its own default size (a 160×80 diamond would be squashed), same center.
        const { width, height } = SHAPE_DEFAULT_SIZES[action.shape]
        const center = nodeCenter(node)
        flow.updateNode(node.id, { width, height, position: { x: center.x - width / 2, y: center.y - height / 2 } })
      }
      return { applied: true, focus: nodeCenter(flow.getNode(node.id) ?? node) }
    }

    case "delete_node": {
      const node = find(action.id)
      if (!node) return skip(`delete_node: unknown node ${action.id}`)
      // mutateFlow doesn't cascade like the client's deleteElements, so drop the node's edges first.
      flow.removeEdges(flow.edges.filter((e) => e.source === node.id || e.target === node.id).map((e) => e.id))
      flow.removeNode(node.id)
      return { applied: true, focus: nodeCenter(node) }
    }

    case "add_edge": {
      const source = find(action.source)
      const target = find(action.target)
      if (!source || !target) return skip(`add_edge: unknown node ${source ? action.target : action.source}`)
      if (source.id === target.id) return skip(`add_edge: self-loop on ${source.id}`)
      if (flow.edges.some((e) => e.source === source.id && e.target === target.id)) {
        return skip(`add_edge: ${source.id} -> ${target.id} already exists`)
      }
      const edge = buildEdge(source, target, cleanLabel(action.label) || undefined)
      if (flow.getEdge(edge.id)) return skip(`add_edge: edge id ${edge.id} is taken`)
      flow.addEdge(edge)
      const a = nodeCenter(source)
      const b = nodeCenter(target)
      return { applied: true, focus: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
    }

    case "delete_edge": {
      const sourceId = find(action.source)?.id
      const targetId = find(action.target)?.id
      const edges = sourceId && targetId ? flow.edges.filter((e) => e.source === sourceId && e.target === targetId) : []
      if (edges.length === 0) return skip(`delete_edge: no edge ${action.source} -> ${action.target}`)
      flow.removeEdges(edges.map((e) => e.id))
      return { applied: true }
    }
  }
}
