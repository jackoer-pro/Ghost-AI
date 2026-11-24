import { useHistory } from "@liveblocks/react/suspense"
import { Handle, NodeResizer, Position, useReactFlow, type NodeProps } from "@xyflow/react"
import { useEffect, useState, type KeyboardEvent } from "react"

import { NodeColorToolbar } from "@/components/canvas/node-color-toolbar"
import { NodeShapeBody } from "@/components/canvas/node-shape"
import { cn } from "@/lib/utils"
import { resolveNodeColors, type CanvasNode as CanvasNodeType } from "@/types/canvas"

const HANDLE_SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left]

// Smallest size a node can be resized to; below this the label no longer fits any shape.
const MIN_WIDTH = 80
const MIN_HEIGHT = 40

const PLACEHOLDER = "Label"

export function CanvasNode({ id, data, selected }: NodeProps<CanvasNodeType>) {
  const { updateNodeData, deleteElements } = useReactFlow<CanvasNodeType>()
  const [editing, setEditing] = useState(false)
  const history = useHistory()
  const label = data.label

  // Each keystroke writes to storage (collaborators see typing live); pausing history makes
  // the whole edit one undo step. The cleanup also resumes it if the node unmounts mid-edit.
  useEffect(() => {
    if (!editing) return
    history.pause()
    return () => history.resume()
  }, [editing, history])
  const { color, textColor, border } = resolveNodeColors(data)

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") event.currentTarget.blur() // blur closes editing
  }

  return (
    <>
      {/* Writes go through onNodesChange ("replace") into Liveblocks storage, like label edits. */}
      <NodeColorToolbar
        color={color}
        onSelect={(pair) => updateNodeData(id, pair)}
        // deleteElements also removes the node's edges and goes through onDelete, i.e. Liveblocks.
        onDelete={() => void deleteElements({ nodes: [{ id }] })}
      />
      {/* Resizing emits "dimensions" changes through onNodesChange, i.e. the Liveblocks-synced node state. */}
      <NodeResizer
        isVisible={selected && !editing}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleClassName="canvas-resize-handle"
        lineClassName="canvas-resize-line"
      />
      {/* nopan: React Flow's zoom filter would otherwise zoom the canvas in on a node double-click.
          Node dragging only checks `nodrag`, so it still works. */}
      <div className="canvas-node nopan size-full">
        <NodeShapeBody shape={data.shape} color={color} borderColor={border} selected={selected}>
          <div className="relative" onDoubleClick={() => setEditing(true)}>
            {/* Always rendered so it sizes the box: the textarea sits exactly on top of it, no layout shift.
                The trailing space keeps a final newline's empty line visible. */}
            <span
              className={cn(
                "block text-center text-sm whitespace-pre-wrap break-words select-none",
                !label && "opacity-60", // placeholder: the label color, dimmed, so it reads on any fill
                editing && "invisible",
              )}
              style={{ color: textColor }}
            >
              {label ? label + (label.endsWith("\n") ? " " : "") : PLACEHOLDER}
            </span>
            {editing ? (
              <textarea
                autoFocus
                value={label}
                placeholder={PLACEHOLDER}
                // Every keystroke goes through onNodesChange ("replace"), so collaborators see it live.
                onChange={(event) => updateNodeData(id, { label: event.target.value })}
                onFocus={(event) => event.currentTarget.setSelectionRange(label.length, label.length)}
                onBlur={() => setEditing(false)}
                onKeyDown={onKeyDown}
                aria-label="Node label"
                // nodrag/nopan/nowheel: React Flow ignores these pointer and wheel events for drag, pan and zoom.
                className="nodrag nopan nowheel absolute inset-0 resize-none overflow-hidden border-0 bg-transparent p-0 text-center text-sm whitespace-pre-wrap break-words outline-none placeholder:text-current placeholder:opacity-60"
                style={{ color: textColor }}
              />
            ) : null}
          </div>
        </NodeShapeBody>
        {/* All handles are `source`: with ConnectionMode.Loose any handle can connect to any other. */}
        {HANDLE_SIDES.map((side) => (
          <Handle key={side} id={side} type="source" position={side} className="canvas-handle" />
        ))}
      </div>
    </>
  )
}
