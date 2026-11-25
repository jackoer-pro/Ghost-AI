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
export const MAX_ACTIONS = 100
const MAX_NODE_WIDTH = 480
const MAX_NODE_HEIGHT = 320
const MAX_LABEL_LENGTH = 60
/** How far from the origin the grid goes; keeps a nonsense coordinate from flinging a node off-screen. */
const MAX_CELL = 40

const COLOR_NAMES = NODE_COLORS.map((c) => c.name) as [ColorName, ...ColorName[]]

/** One change to apply. Internal: the model never sees this shape (see designPlanSchema). */
export interface DesignAction {
  type: "add_node" | "move_node" | "resize_node" | "update_node" | "delete_node" | "add_edge" | "delete_edge"
  id?: string
  label?: string
  shape?: (typeof NODE_SHAPES)[number]
  color?: ColorName
  column?: number
  row?: number
  width?: number
  height?: number
  source?: string
  target?: string
}

const nodeRef = () => z.string().describe("A node id: an existing node's id, or an id you gave in addNodes.")

// What the model returns: one list per kind of change, with required fields where the change needs them.
// (A single flat "action" with every field optional made Gemini lose track of which fields belong to which
// action: live runs produced an edge whose target was a paragraph, and an edge repeated thousands of times.)
// No unions (structured-output support for `anyOf` varies across Gemini models) and no length/range limits
// (one long label would fail the whole response): values are validated and clamped when applied.
export const designPlanSchema = z.object({
  summary: z.string().describe("1–2 sentences for the team: what was designed or changed, and the key decision."),
  addNodes: z
    .array(
      z.object({
        id: z.string().describe("Short new snake_case id, e.g. orders_db. Edges reference it."),
        label: z.string().describe("At most 4 words."),
        shape: z.enum(NODE_SHAPES),
        color: z.enum(COLOR_NAMES),
        column: z.number(),
        row: z.number(),
      })
    )
    .describe("New nodes."),
  updateNodes: z
    .array(
      z.object({
        id: nodeRef(),
        label: z.string().optional(),
        shape: z.enum(NODE_SHAPES).optional(),
        color: z.enum(COLOR_NAMES).optional(),
        column: z.number().optional().describe("With row: move the node to this cell."),
        row: z.number().optional(),
        width: z.number().optional().describe("Pixels; only when asked to resize."),
        height: z.number().optional(),
      })
    )
    .describe("Changes to existing nodes; only the fields that change."),
  deleteNodes: z.array(nodeRef()).describe("Ids of nodes to remove; their edges go with them."),
  addEdges: z
    .array(
      z.object({
        source: nodeRef(),
        target: nodeRef(),
        label: z.string().describe("Protocol or interaction, 1–3 words."),
      })
    )
    .describe("New connections, each listed once."),
  deleteEdges: z.array(z.object({ source: nodeRef(), target: nodeRef() })).describe("Connections to remove."),
})

export type DesignPlan = z.infer<typeof designPlanSchema>

/**
 * The plan as actions, in the order they're applied: removals first (so freed cells can be reused),
 * then updates, new nodes, and finally edges, which then find every node they reference.
 */
export function planToActions(plan: DesignPlan): DesignAction[] {
  const updates = plan.updateNodes.flatMap((u): DesignAction[] => [
    ...(u.label !== undefined || u.shape || u.color
      ? [{ type: "update_node" as const, id: u.id, label: u.label, shape: u.shape, color: u.color }]
      : []),
    ...(u.width !== undefined || u.height !== undefined
      ? [{ type: "resize_node" as const, id: u.id, width: u.width, height: u.height }]
      : []),
    ...(u.column !== undefined || u.row !== undefined
      ? [{ type: "move_node" as const, id: u.id, column: u.column, row: u.row }]
      : []),
  ])
  return [
    ...plan.deleteEdges.map((e): DesignAction => ({ type: "delete_edge", source: e.source, target: e.target })),
    ...plan.deleteNodes.map((id): DesignAction => ({ type: "delete_node", id })),
    ...updates,
    ...plan.addNodes.map((n): DesignAction => ({ type: "add_node", ...n })),
    ...plan.addEdges.map((e): DesignAction => ({ type: "add_edge", ...e })),
  ]
}

export const DESIGN_SYSTEM_PROMPT = `You are Ghost AI, a principal software architect editing a shared architecture diagram.
The team will build the real system from this diagram, so design like you would for production, not a toy.

Two kinds of request:
1. A new system (empty canvas, or "design / build / create …"): draw a complete end-to-end architecture
   for that product, from the users to the data. Infer the components a real version needs even when the
   prompt doesn't name them, but stay proportional: no component without a clear job in this product.
2. A change to the existing diagram ("add / rename / remove / move / connect …"): make only the changes
   asked for, plus the edges they need. Keep everything else exactly as it is.

What a complete design covers (pick what the product actually needs):
- Clients: web app, mobile app, admin console, partner/API consumers.
- Edge: CDN for static assets, WAF/rate limiting, load balancer or API gateway as the single entry point.
- Identity: an auth/identity service or provider (OAuth/OIDC) used by the gateway.
- Core services: split by business capability (e.g. Orders, Payments, Catalog), not by technical layer.
  Each owns its data.
- Async work: a message queue or event stream for slow, retryable or fan-out work, with the worker
  services that consume it (emails, notifications, indexing, billing, media processing).
- Data: a database per service where ownership differs (name the engine when it matters: PostgreSQL,
  MongoDB, Cassandra…), a cache for hot reads, object storage for files and media, a search index when
  there is search, a data warehouse or analytics pipeline when there is reporting.
- External systems: payment providers, email/SMS providers, maps, LLM APIs… as their own nodes.
- Operations: observability (logs, metrics, traces) and alerting for any non-trivial system.
A typical new product has 12 to 25 nodes. Prefer one clear, buildable design over listing alternatives.

Reply with a plan of five lists (use [] for the ones you don't need):
- addNodes: id, label, shape, color, column, row
- updateNodes: id plus only what changes (label, shape, color; column and row to move; width and height
  only when asked to resize, default sizes are best)
- deleteNodes: ids (their edges are removed with them)
- addEdges: source, target, label
- deleteEdges: source, target

Shapes (pick by meaning):
- circle: client, user or endpoint
- hexagon: gateway, load balancer, CDN, external system or boundary
- pill: service or process
- rectangle: worker, job, scheduler or general component
- cylinder: database, cache, queue, stream or storage
- diamond: decision

Colors (consistent by role): Neutral = clients and users, Blue = edge, gateways and identity,
Purple = services, Teal = databases, caches and storage, Orange = queues, streams and workers,
Pink = external or third-party systems, Green = analytics and outputs, Red = monitoring and alerting.

Layout (integer grid cells; flow runs left to right):
- column 0: clients · column 1: edge (CDN, WAF, load balancer) · column 2: gateway and identity ·
  columns 3–4: services · column 5: queues and workers · column 6: databases, caches, storage ·
  column 7: external systems and analytics. Skip columns the design doesn't use.
- Stack the components of one column on different rows, centered around row 0, and put each data store
  on the same row as the service that owns it so edges stay short and straight.
- Never put two nodes in the same cell. When extending a diagram, use free cells next to the nodes you connect.

Edges:
- Point in the direction of the call or data flow. Every node connects to at least one other. List each edge once.
- Always label them with the protocol or interaction, 1–3 words: "HTTPS", "REST", "gRPC", "SQL",
  "cache read", "publish OrderPlaced", "consume", "webhook", "S3 upload", "OIDC".

Labels: specific and short, at most 4 words ("Orders Service", "Orders DB (Postgres)", "Redis Cache"),
never generic ("Service 1", "Database") and never ids.
Reference existing nodes by their exact id.
Summary: 1–2 sentences for the team: what you designed or changed and the key decision (e.g. why a queue).`

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
