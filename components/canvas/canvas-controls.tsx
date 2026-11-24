"use client"

import type { FitViewOptions } from "@xyflow/react"
import { useReactFlow } from "@xyflow/react"
import { Maximize, Minus, Plus, Redo2, Undo2, type LucideIcon } from "lucide-react"

import { Hint } from "@/components/hint"
import { ZOOM_ANIMATION } from "@/hooks/use-keyboard-shortcuts"

interface CanvasControlsProps {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  fitViewOptions: FitViewOptions
}

// Floating pill at the bottom-left of the canvas: zoom group | history group.
// On phones it moves up to sit above the bottom-center shape panel instead of overlapping it.
export function CanvasControls({ undo, redo, canUndo, canRedo, fitViewOptions }: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div
      role="toolbar"
      aria-label="Canvas controls"
      className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-full border border-surface-border bg-surface/85 p-1.5 backdrop-blur max-sm:bottom-20"
    >
      <ControlButton icon={Minus} label="Zoom out (-)" onClick={() => zoomOut(ZOOM_ANIMATION)} />
      <ControlButton icon={Maximize} label="Fit diagram to screen" onClick={() => fitView({ ...fitViewOptions, ...ZOOM_ANIMATION })} />
      <ControlButton icon={Plus} label="Zoom in (+)" onClick={() => zoomIn(ZOOM_ANIMATION)} />
      <div aria-hidden className="mx-1 h-5 w-px bg-surface-border" />
      <ControlButton icon={Undo2} label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo} />
      <ControlButton icon={Redo2} label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo} />
    </div>
  )
}

interface ControlButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
}

function ControlButton({ icon: Icon, label, onClick, disabled }: ControlButtonProps) {
  return (
    <Hint label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="flex size-9 items-center justify-center rounded-full text-copy-muted transition-colors outline-none hover:bg-subtle hover:text-copy-primary focus-visible:ring-2 focus-visible:ring-copy-primary disabled:pointer-events-none disabled:opacity-35"
      >
        <Icon className="size-5" aria-hidden />
      </button>
    </Hint>
  )
}
