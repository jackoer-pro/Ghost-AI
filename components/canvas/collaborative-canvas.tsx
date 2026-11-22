"use client"

import { ClientSideSuspense, LiveblocksProvider, RoomProvider, useErrorListener } from "@liveblocks/react/suspense"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { Background, BackgroundVariant, ConnectionMode, MiniMap, ReactFlow } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Loader2, Unplug } from "lucide-react"
import { useState } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { Button } from "@/components/ui/button"
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
            <Flow />
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

function Flow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } = useLiveblocksFlow<
    CanvasNode,
    CanvasEdge
  >({ suspense: true, nodes: { initial: [] }, edges: { initial: [] } })

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      connectionMode={ConnectionMode.Loose}
      fitView
      colorMode="dark"
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="var(--border-subtle)" bgColor="var(--bg-base)" />
      <MiniMap<CanvasNode>
        pannable
        zoomable
        bgColor="var(--bg-surface)"
        maskColor="color-mix(in srgb, var(--bg-base) 60%, transparent)"
        nodeColor={(node) => node.data.color}
        className="overflow-hidden rounded-xl border border-surface-border"
      />
    </ReactFlow>
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
