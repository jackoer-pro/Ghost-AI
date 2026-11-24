import { Circle, Cylinder, Diamond, Hexagon, Pill, RectangleHorizontal, type LucideIcon } from "lucide-react"
import { useRef, type DragEvent } from "react"

import { NodeShapeBody } from "@/components/canvas/node-shape"
import { Hint } from "@/components/hint"
import { SHAPE_DEFAULT_SIZES, SHAPE_DRAG_TYPE, shapeDragPayload } from "@/lib/shape-drag"
import { DEFAULT_NODE_COLOR, NODE_SHAPES, type NodeShape } from "@/types/canvas"

const SHAPE_ICONS: Record<NodeShape, LucideIcon> = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Cylinder,
  hexagon: Hexagon,
}

// Floating pill toolbar at the bottom-center of the canvas; drag a shape onto the canvas to add a node.
export function ShapePanel() {
  // Off-screen copies of each shape at drop size, used as the native drag image (ghost preview).
  // The browser moves it with the cursor and removes it on drop or cancel.
  const previews = useRef<Partial<Record<NodeShape, HTMLDivElement | null>>>({})

  function onDragStart(event: DragEvent, shape: NodeShape) {
    event.dataTransfer.setData(SHAPE_DRAG_TYPE, shapeDragPayload(shape))
    event.dataTransfer.effectAllowed = "copy"
    const preview = previews.current[shape]
    const { width, height } = SHAPE_DEFAULT_SIZES[shape]
    // Centered on the cursor, matching where the node lands (createShapeNode centers it on the drop point).
    if (preview) event.dataTransfer.setDragImage(preview, width / 2, height / 2)
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label="Shapes"
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full border border-surface-border bg-surface/85 p-1.5 backdrop-blur"
      >
        {NODE_SHAPES.map((shape) => {
          const Icon = SHAPE_ICONS[shape]
          return (
            <Hint key={shape} label={`Drag onto the canvas to add a ${shape}`}>
              <div
                draggable
                onDragStart={(event) => onDragStart(event, shape)}
                aria-label={`${shape} shape`}
                className="flex size-9 cursor-grab items-center justify-center rounded-full text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
              >
                <Icon className="size-5" aria-hidden />
              </div>
            </Hint>
          )
        })}
      </div>
      {/* Rendered (not display:none) so setDragImage can snapshot them, but kept off screen. */}
      <div aria-hidden className="pointer-events-none fixed top-0 -left-[9999px]">
        {NODE_SHAPES.map((shape) => (
          <div
            key={shape}
            ref={(el) => {
              previews.current[shape] = el
            }}
            style={SHAPE_DEFAULT_SIZES[shape]}
          >
            <NodeShapeBody shape={shape} color={DEFAULT_NODE_COLOR} />
          </div>
        ))}
      </div>
    </>
  )
}
