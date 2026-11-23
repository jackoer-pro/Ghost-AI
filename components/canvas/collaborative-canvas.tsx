"use client"

import { ClientSideSuspense, LiveblocksProvider, RoomProvider, useErrorListener } from "@liveblocks/react/suspense"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Loader2, Unplug } from "lucide-react"
import { useState, type DragEvent } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { CanvasEdge as CanvasEdgeView } from "@/components/canvas/canvas-edge"
import { CanvasNode as CanvasNodeView } from "@/components/canvas/canvas-node"
import { MiniMapShape } from "@/components/canvas/node-shape"
import { ShapePanel } from "@/components/canvas/shape-panel"
import { Button } from "@/components/ui/button"
import { createShapeNode, parseShapeDragPayload, SHAPE_DRAG_TYPE } from "@/lib/shape-drag"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

interface CollaborativeCanvasProps {
  /** Project ID, which is also the Liveblocks room ID. */
  roomId: string
}

// Client boundary for the shared canvas: joins the project's Liveblocks room
// (token from /api/liveblocks-auth) and renders React Flow on the synced state.
export function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
        <ErrorBoundary fallback={<CanvasError />}>
          <ConnectionErrorGuard />
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <ReactFlowProvider>
              <Flow />
            </ReactFlowProvider>
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

// Outside the component so React Flow doesn't see a new object each render.
const nodeTypes: NodeTypes = { canvasNode: CanvasNodeView }
const edgeTypes: EdgeTypes = { canvasEdge: CanvasEdgeView }
// React Flow merges these into every new connection before calling onConnect.
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: { type: MarkerType.ArrowClosed, color: "var(--edge-color)", width: 18, height: 18 },
}

// Never zoom in past 100% when fitting a small diagram.
const fitViewOptions = { maxZoom: 1 }

function Flow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } = useLiveblocksFlow<CanvasNode, CanvasEdge>(
    { suspense: true, nodes: { initial: [] }, edges: { initial: [] } },
  )
  const { screenToFlowPosition } = useReactFlow()
  // Fit only when the room already had nodes on load. In an empty room React Flow would wait for
  // the first dropped node and zoom in on it (to maxZoom 2), so drops would land on top of each other.
  const [fitOnLoad] = useState(nodes.length > 0)

  function onDragOver(event: DragEvent) {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_TYPE)) return
    event.preventDefault() // allows the drop
    event.dataTransfer.dropEffect = "copy"
  }

  function onDrop(event: DragEvent) {
    const payload = parseShapeDragPayload(event.dataTransfer.getData(SHAPE_DRAG_TYPE))
    if (!payload) return
    event.preventDefault()
    const at = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    onNodesChange([{ type: "add", item: createShapeNode(payload, at) }])
  }

  return (
    <div className="relative size-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView={fitOnLoad}
        fitViewOptions={fitViewOptions}
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="var(--border-subtle)"
          bgColor="var(--bg-base)"
        />
        <MiniMap<CanvasNode>
          pannable
          zoomable
          bgColor="var(--bg-surface)"
          maskColor="color-mix(in srgb, var(--bg-base) 60%, transparent)"
          nodeClassName={(node) => node.data.shape}
          nodeComponent={MiniMapShape}
          // Hidden on phones: it would sit under the bottom-center shape panel.
          className="overflow-hidden rounded-xl border border-surface-border max-sm:hidden"
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  )
}

// A failed token request or a denied room never reaches the Suspense boundary
// (the room just stops connecting), so surface it to the ErrorBoundary by throwing on render.
function ConnectionErrorGuard() {
  const [error, setError] = useState<Error | null>(null)
  useErrorListener((event) => {
    if (event.context.type === "ROOM_CONNECTION_ERROR") setError(event)
  })
  if (error) throw error
  return null
}

function CanvasLoading() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-copy-muted">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Connecting to canvas…
    </div>
  )
}

function CanvasError() {
  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <Unplug className="size-8 text-copy-faint" aria-hidden />
      <p className="text-copy-primary">Couldn&apos;t connect to the canvas.</p>
      <p className="max-w-sm text-sm text-copy-muted">
        Check your connection, or ask the project owner whether you still have access.
      </p>
      {/* Liveblocks stops retrying after an auth failure, so a fresh page load is the real retry. */}
      <Button variant="outline" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  )
}
