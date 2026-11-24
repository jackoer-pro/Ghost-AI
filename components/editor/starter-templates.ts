import { buildEdge, buildNode } from "@/lib/canvas-builders"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

/** A predefined diagram that replaces the canvas when imported. */
export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

const node = buildNode

type Link = [source: string, target: string, label?: string]

/** Edges between the facing sides of each node pair. */
function connect(nodes: CanvasNode[], links: Link[]): CanvasEdge[] {
  const find = (id: string) => {
    const n = nodes.find((candidate) => candidate.id === id)
    if (!n) throw new Error(`Template edge references unknown node "${id}"`)
    return n
  }
  return links.map(([source, target, label]) => buildEdge(find(source), find(target), label))
}

function template(id: string, name: string, description: string, nodes: CanvasNode[], links: Link[]): CanvasTemplate {
  return { id, name, description, nodes, edges: connect(nodes, links) }
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  template(
    "microservices",
    "Microservices",
    "An API gateway routing client traffic to independent services, each owning its own data store.",
    [
      node("ms-client", "Web client", "circle", "Neutral", 0, 200),
      node("ms-gateway", "API gateway", "hexagon", "Blue", 230, 200),
      node("ms-auth", "Auth service", "pill", "Purple", 500, 40),
      node("ms-users", "User service", "pill", "Purple", 500, 200),
      node("ms-orders", "Order service", "pill", "Purple", 500, 360),
      node("ms-cache", "Session cache", "cylinder", "Teal", 760, 40),
      node("ms-users-db", "Users DB", "cylinder", "Teal", 760, 200),
      node("ms-orders-db", "Orders DB", "cylinder", "Teal", 760, 360),
    ],
    [
      ["ms-client", "ms-gateway", "HTTPS"],
      ["ms-gateway", "ms-auth"],
      ["ms-gateway", "ms-users"],
      ["ms-gateway", "ms-orders"],
      ["ms-auth", "ms-cache"],
      ["ms-users", "ms-users-db"],
      ["ms-orders", "ms-orders-db"],
    ],
  ),
  template(
    "ci-cd-pipeline",
    "CI/CD pipeline",
    "From a pushed commit through build, tests and a quality gate to staging and production.",
    [
      node("ci-commit", "Git push", "circle", "Neutral", 0, 0),
      node("ci-build", "Build", "rectangle", "Blue", 220, 0),
      node("ci-test", "Run tests", "rectangle", "Blue", 440, 0),
      node("ci-gate", "Tests pass?", "diamond", "Orange", 670, 0),
      node("ci-staging", "Deploy to staging", "pill", "Green", 910, 0),
      node("ci-prod", "Deploy to production", "pill", "Green", 1140, 0),
      node("ci-registry", "Artifact registry", "cylinder", "Teal", 220, 200),
      node("ci-notify", "Notify team", "rectangle", "Red", 670, 230),
    ],
    [
      ["ci-commit", "ci-build", "push"],
      ["ci-build", "ci-test"],
      ["ci-build", "ci-registry", "image"],
      ["ci-test", "ci-gate"],
      ["ci-gate", "ci-staging", "yes"],
      ["ci-gate", "ci-notify", "no"],
      ["ci-staging", "ci-prod", "approve"],
    ],
  ),
  template(
    "event-driven",
    "Event-driven system",
    "Producers publish events to a shared bus; independent consumers react to them asynchronously.",
    [
      node("ev-checkout", "Checkout service", "pill", "Purple", 0, 80),
      node("ev-payments", "Payment service", "pill", "Purple", 0, 280),
      node("ev-bus", "Event bus", "hexagon", "Orange", 260, 180),
      node("ev-email", "Email worker", "rectangle", "Blue", 520, 20),
      node("ev-shipping", "Shipping worker", "rectangle", "Blue", 520, 180),
      node("ev-analytics", "Analytics worker", "rectangle", "Blue", 520, 340),
      node("ev-provider", "Email provider", "hexagon", "Pink", 780, 20),
      node("ev-warehouse", "Data warehouse", "cylinder", "Teal", 780, 340),
    ],
    [
      ["ev-checkout", "ev-bus", "order.placed"],
      ["ev-payments", "ev-bus", "payment.settled"],
      ["ev-bus", "ev-email"],
      ["ev-bus", "ev-shipping"],
      ["ev-bus", "ev-analytics"],
      ["ev-email", "ev-provider"],
      ["ev-analytics", "ev-warehouse"],
    ],
  ),
]
