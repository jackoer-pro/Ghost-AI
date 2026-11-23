import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from "@xyflow/react"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"

import { cn } from "@/lib/utils"
import type { CanvasEdge as CanvasEdgeType } from "@/types/canvas"

export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
  data,
}: EdgeProps<CanvasEdgeType>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  })
  const { updateEdgeData } = useReactFlow()
  const [draft, setDraft] = useState<string | null>(null) // null = not editing
  const label = data?.label ?? ""
  const pathGroup = useRef<SVGGElement>(null)

  // Native listener, not onDoubleClick: React Flow's d3 zoom handles dblclick on the pane before
  // React sees it, so a React handler can't stop the canvas zooming in. `nopan` would stop the zoom
  // too, but it would also block drag-to-pan starting on the edge's wide hit area.
  useEffect(() => {
    const group = pathGroup.current
    if (!group) return
    function onDoubleClick(event: MouseEvent) {
      event.stopPropagation()
      setDraft(label)
    }
    group.addEventListener("dblclick", onDoubleClick)
    return () => group.removeEventListener("dblclick", onDoubleClick)
  }, [label])

  // Single save path: Enter/Escape blur the input, and blur saves.
  function save() {
    if (draft === null) return
    // Goes through onEdgesChange ("replace"), i.e. the Liveblocks-synced edge state.
    if (draft.trim() !== label) updateEdgeData(id, { label: draft.trim() })
    setDraft(null)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur()
  }

  return (
    <>
      {/* The <g> catches double-clicks on both the visible path and BaseEdge's wider invisible hit path. */}
      <g ref={pathGroup}>
        <BaseEdge
          path={path}
          markerEnd={markerEnd}
          interactionWidth={24}
          className={cn("canvas-edge", selected && "is-selected")}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          // nodrag/nopan: React Flow ignores pointer events from these for dragging and panning.
          className="nodrag nopan absolute"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: "all" }}
          onDoubleClick={() => setDraft(label)}
        >
          {draft !== null ? (
            <input
              autoFocus
              value={draft}
              size={Math.max(draft.length, 6)} // grows with the text
              onChange={(event) => setDraft(event.target.value)}
              onBlur={save}
              onKeyDown={onKeyDown}
              aria-label="Edge label"
              className="rounded-full border border-surface-border-subtle bg-elevated px-2 py-0.5 text-xs text-copy-primary outline-none"
            />
          ) : label ? (
            <span className="block rounded-full border border-surface-border bg-elevated px-2 py-0.5 text-xs whitespace-nowrap text-copy-secondary">
              {label}
            </span>
          ) : selected ? (
            <span className="text-xs whitespace-nowrap text-copy-faint">Double-click to label</span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
