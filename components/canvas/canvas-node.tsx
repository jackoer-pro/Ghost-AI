import { Handle, Position, type NodeProps } from "@xyflow/react"

import { NodeShapeBody } from "@/components/canvas/node-shape"
import type { CanvasNode as CanvasNodeType } from "@/types/canvas"

const HANDLE_SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left]

export function CanvasNode({ data, selected }: NodeProps<CanvasNodeType>) {
  return (
    <div className="canvas-node size-full">
      <NodeShapeBody shape={data.shape} color={data.color} selected={selected}>
        <span className="block text-center text-sm break-words text-copy-primary">{data.label}</span>
      </NodeShapeBody>
      {/* All handles are `source`: with ConnectionMode.Loose any handle can connect to any other. */}
      {HANDLE_SIDES.map((side) => (
        <Handle key={side} id={side} type="source" position={side} className="canvas-handle" />
      ))}
    </div>
  )
}
