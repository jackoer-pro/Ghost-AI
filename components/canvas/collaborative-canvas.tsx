"use client"

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useCanRedo,
  useCanUndo,
  useErrorListener,
  useRedo,
  useRoom,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
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
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { CanvasControls } from "@/components/canvas/canvas-controls"
import { CanvasEdge as CanvasEdgeView } from "@/components/canvas/canvas-edge"
import { CanvasNode as CanvasNodeView } from "@/components/canvas/canvas-node"
import { LiveCursors } from "@/components/canvas/live-cursors"
import { MiniMapShape } from "@/components/canvas/node-shape"
import { PresenceAvatars } from "@/components/canvas/presence-avatars"
import { ShapePanel } from "@/components/canvas/shape-panel"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import { Button } from "@/components/ui/button"
import { useCanvasAutosave, type CanvasAutosave } from "@/hooks/use-canvas-autosave"
import { useKeyboardShortcuts, ZOOM_ANIMATION } from "@/hooks/use-keyboard-shortcuts"
import { createShapeNode, parseShapeDragPayload, SHAPE_DRAG_TYPE } from "@/lib/shape-drag"
import { EDGE_MARKER_END, type CanvasEdge, type CanvasNode } from "@/types/canvas"

interface CollaborativeCanvasProps {
  /** Project ID, which is also the Liveblocks room ID. */
  roomId: string
  /** Starter templates modal; its state lives in the shell because the navbar opens it. */
  templatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
  /** Autosave state for the navbar's Save button; null while the canvas isn't connected. Must be stable. */
  onAutosaveChange: (autosave: CanvasAutosave | null) => void
}

interface CollaborativeCanvasRootProps extends CollaborativeCanvasProps {
  /** Rendered inside the room but outside the canvas error boundary (the AI sidebar). */
  children?: ReactNode
}

// Client boundary for the shared canvas: joins the project's Liveblocks room
// (token from /api/liveblocks-auth) and renders React Flow on the synced state.
export function CollaborativeCanvas({ roomId, children, ...flowProps }: CollaborativeCanvasRootProps) {
  return (
    // throttle 16ms (default 100ms) so live cursors move smoothly.
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth" throttle={16}>
      <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
        <div className="relative size-full">
          <ErrorBoundary fallback={<CanvasError />}>
            <ConnectionErrorGuard />
            <ClientSideSuspense fallback={<CanvasLoading />}>
              <ReactFlowProvider>
                <Flow roomId={roomId} {...flowProps} />
              </ReactFlowProvider>
            </ClientSideSuspense>
          </ErrorBoundary>
          {/* Outside the error boundary, so the user menu stays reachable when the room fails. */}
          <PresenceAvatars />
          {children}
        </div>
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
  markerEnd: EDGE_MARKER_END,
}

// React Flow only listens for Backspace by default; Delete is what most people reach for on Windows.
const DELETE_KEYS = ["Backspace", "Delete"]

// Never zoom in past 100% when fitting a small diagram.
const fitViewOptions = { maxZoom: 1 }

// The modal renders inside the room (it's portaled, so where doesn't matter) so imports can write to storage.
function Flow({ roomId, templatesOpen, onTemplatesOpenChange, onAutosaveChange }: CollaborativeCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } = useLiveblocksFlow<CanvasNode, CanvasEdge>(
    { suspense: true, nodes: { initial: [] }, edges: { initial: [] } },
  )
  const flow = useReactFlow()
  const { screenToFlowPosition } = flow
  // Room-wide Liveblocks history; drags and resizes are one step each (the binding pauses history meanwhile).
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  useKeyboardShortcuts({ flow, undo, redo })
  // Fit only when the room already had nodes on load. In an empty room React Flow would wait for
  // the first dropped node and zoom in on it (to maxZoom 2), so drops would land on top of each other.
  const [fitOnLoad] = useState(nodes.length > 0)
  const room = useRoom()
  const fitAfterImport = useRef(false)
  const updateMyPresence = useUpdateMyPresence()

  // Restoring the saved copy into an empty room: one batch, outside undo history, so Ctrl+Z can't
  // empty the canvas again (which autosave would then write over the saved copy).
  const autosave = useCanvasAutosave({
    projectId: roomId,
    nodes,
    edges,
    onLoad: (saved) =>
      room.history.disable(() =>
        room.batch(() => {
          onNodesChange(saved.nodes.map((item) => ({ type: "add", item })))
          onEdgesChange(saved.edges.map((item) => ({ type: "add", item })))
        }),
      ),
  })
  const { status: saveStatus, saveNow } = autosave
  useEffect(() => {
    onAutosaveChange({ status: saveStatus, saveNow })
  }, [saveStatus, saveNow, onAutosaveChange])
  useEffect(() => () => onAutosaveChange(null), [onAutosaveChange])

  // Replace, not merge: clear the canvas, then add the template, in one batch, so collaborators never see
  // a half-loaded diagram and a single undo brings the previous canvas back.
  // (`onNodesChange` ignores "remove" changes; deletion only goes through `onDelete`.)
  function importTemplate(template: CanvasTemplate) {
    room.batch(() => {
      onDelete({ nodes, edges })
      onNodesChange(template.nodes.map((item) => ({ type: "add", item })))
      onEdgesChange(template.edges.map((item) => ({ type: "add", item })))
    })
    fitAfterImport.current = true
  }

  // Runs once the imported nodes have reached React Flow; fitView then waits until they're measured.
  useEffect(() => {
    if (!fitAfterImport.current) return
    fitAfterImport.current = false
    void flow.fitView({ ...fitViewOptions, ...ZOOM_ANIMATION })
  }, [nodes, flow])

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
        deleteKeyCode={DELETE_KEYS}
        // Broadcast the pointer in flow coordinates, so it lands on the same spot for every viewer.
        // Pointer, not mouse, events: d3 (node drag, pan) swallows window `mousemove` in the capture
        // phase, so with onMouseMove a cursor would freeze for others while you drag a node.
        onPointerMove={(event) =>
          updateMyPresence({ cursor: screenToFlowPosition({ x: event.clientX, y: event.clientY }) })
        }
        onPointerLeave={() => updateMyPresence({ cursor: null })}
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
        <LiveCursors />
      </ReactFlow>
      <CanvasControls undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} fitViewOptions={fitViewOptions} />
      <ShapePanel />
      <StarterTemplatesModal open={templatesOpen} onOpenChange={onTemplatesOpenChange} onImport={importTemplate} />
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
