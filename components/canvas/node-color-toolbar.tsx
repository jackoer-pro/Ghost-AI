import { NodeToolbar, Position } from "@xyflow/react"
import type { CSSProperties } from "react"

import { Hint } from "@/components/hint"
import { cn } from "@/lib/utils"
import { NODE_COLORS } from "@/types/canvas"

interface NodeColorToolbarProps {
  /** Current fill of the node; the matching swatch is shown as active. */
  color: string
  onSelect: (pair: { color: string; textColor: string }) => void
}

/**
 * Floating swatch row above a selected node. NodeToolbar renders outside the node element and,
 * with `isVisible` unset, only shows when this is the single selected node.
 */
export function NodeColorToolbar({ color, onSelect }: NodeColorToolbarProps) {
  return (
    <NodeToolbar position={Position.Top} offset={12}>
      {/* nodrag/nopan: clicks and drags here never move the node or pan the canvas. */}
      <div
        role="toolbar"
        aria-label="Node color"
        className="nodrag nopan flex items-center gap-1.5 rounded-xl border border-surface-border bg-elevated p-1.5 shadow-lg"
      >
        {NODE_COLORS.map((pair) => {
          const active = pair.color.toLowerCase() === color.toLowerCase()
          return (
            <Hint key={pair.color} label={`${pair.name} color`}>
              <button
                type="button"
                aria-label={pair.name}
                aria-pressed={active}
                onClick={() => onSelect({ color: pair.color, textColor: pair.textColor })}
                style={{ backgroundColor: pair.color, "--swatch-text": pair.textColor } as CSSProperties}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border border-[var(--swatch-text)]/50 transition-shadow outline-none",
                  // Tight glow in the pair's text color: small blur, small spread.
                  "hover:shadow-[0_0_0_1px_var(--swatch-text),0_0_6px_0_var(--swatch-text)] focus-visible:shadow-[0_0_0_1px_var(--swatch-text),0_0_6px_0_var(--swatch-text)]",
                  active && "ring-2 ring-copy-primary ring-offset-2 ring-offset-elevated",
                )}
              >
                <span className="size-2 rounded-full bg-[var(--swatch-text)]" />
              </button>
            </Hint>
          )
        })}
      </div>
    </NodeToolbar>
  )
}
