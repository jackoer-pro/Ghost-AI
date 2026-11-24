"use client"

import { Download } from "lucide-react"

import { SVG_SHAPES } from "@/components/canvas/node-shape"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

export function StarterTemplatesModal({ open, onOpenChange, onImport }: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 rounded-3xl border border-surface-border bg-elevated p-6 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Starter templates</DialogTitle>
          <DialogDescription className="text-copy-muted">
            Start from a ready-made diagram. Importing replaces everything on the canvas for everyone in this
            project; press Ctrl+Z (⌘Z on Mac) to bring the previous canvas back.
          </DialogDescription>
        </DialogHeader>

        {/* The wrapper scrolls, not the grid: a height-capped grid shrinks its rows and squashes the cards. */}
        <div className="-mx-1 max-h-[65vh] overflow-y-auto px-1 pb-1">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <li
                key={template.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface"
              >
                <TemplatePreview template={template} />
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h3 className="text-sm font-medium text-copy-primary">{template.name}</h3>
                  <p className="flex-1 text-sm text-copy-muted">{template.description}</p>
                  <Button
                    className="mt-3 h-9 rounded-xl"
                    onClick={() => {
                      onImport(template)
                      onOpenChange(false)
                    }}
                  >
                    <Download />
                    Use this template
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const PREVIEW_PADDING = 40

/**
 * Static SVG thumbnail: the viewBox is the bounding box of the template's nodes, so the browser fits it
 * into the fixed-height viewport. Edges are straight lines between node centers, drawn under the nodes.
 */
function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const boxes = new Map(
    template.nodes.map((n) => [n.id, { x: n.position.x, y: n.position.y, w: n.width ?? 0, h: n.height ?? 0 }]),
  )
  const all = [...boxes.values()]
  const minX = Math.min(...all.map((b) => b.x)) - PREVIEW_PADDING
  const minY = Math.min(...all.map((b) => b.y)) - PREVIEW_PADDING
  const maxX = Math.max(...all.map((b) => b.x + b.w)) + PREVIEW_PADDING
  const maxY = Math.max(...all.map((b) => b.y + b.h)) + PREVIEW_PADDING

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className="h-40 w-full border-b border-surface-border bg-base [&_*]:[vector-effect:non-scaling-stroke]"
    >
      {template.edges.map((e) => {
        const a = boxes.get(e.source)
        const b = boxes.get(e.target)
        if (!a || !b) return null
        return (
          <line
            key={e.id}
            x1={a.x + a.w / 2}
            y1={a.y + a.h / 2}
            x2={b.x + b.w / 2}
            y2={b.y + b.h / 2}
            stroke="var(--edge-color)"
            strokeOpacity={0.45}
            strokeWidth={1.5}
          />
        )
      })}
      {template.nodes.map((n) => {
        const { x, y, w, h } = boxes.get(n.id)!
        const { shape, color, textColor } = n.data
        const outline = SVG_SHAPES[shape]
        const radius = shape === "rectangle" ? 12 : Math.min(w, h) / 2 // pill and circle are fully rounded
        return (
          <svg
            key={n.id}
            x={x}
            y={y}
            width={w}
            height={h}
            viewBox={outline ? "0 0 100 100" : undefined}
            preserveAspectRatio="none"
            overflow="visible"
            fill={color}
            stroke={textColor ?? "var(--border-subtle)"}
            strokeWidth={1.5}
            strokeLinejoin="round"
          >
            {outline ?? <rect width={w} height={h} rx={radius} />}
          </svg>
        )
      })}
    </svg>
  )
}
