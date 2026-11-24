"use client"

import type { ReactElement } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface HintProps {
  /** What the control does, shown on hover and keyboard focus. */
  label: string
  side?: "top" | "bottom" | "left" | "right"
  /** The control itself; it becomes the tooltip trigger (props and ref are merged onto it). */
  children: ReactElement
}

/** Visible label for icon-only controls, so people can tell what a button does before clicking it. */
export function Hint({ label, side = "top", children }: HintProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}
