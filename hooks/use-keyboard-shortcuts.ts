"use client"

import type { ReactFlowInstance } from "@xyflow/react"
import { useEffect } from "react"

/** Short animation shared by the zoom buttons and shortcuts. */
export const ZOOM_ANIMATION = { duration: 200 }

interface KeyboardShortcutsOptions {
  flow: Pick<ReactFlowInstance, "zoomIn" | "zoomOut">
  undo: () => void
  redo: () => void
}

/** True when the key press belongs to a text field, so shortcuts must leave it alone. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

// Canvas shortcuts on window: + / = zoom in, - zoom out, Cmd/Ctrl+Z undo,
// Cmd/Ctrl+Shift+Z and Cmd/Ctrl+Y redo. Skipped while typing in a field.
export function useKeyboardShortcuts({ flow, undo, redo }: KeyboardShortcutsOptions) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event.target)) return
      const key = event.key.toLowerCase()
      const mod = event.metaKey || event.ctrlKey

      if (mod && !event.altKey) {
        if (key === "z" && !event.shiftKey) undo()
        else if ((key === "z" && event.shiftKey) || key === "y") redo()
        else return
      } else if (!mod && !event.altKey) {
        // Plain keys only: Ctrl/Cmd + = / - stays the browser's page zoom.
        if (key === "+" || key === "=") flow.zoomIn(ZOOM_ANIMATION)
        else if (key === "-") flow.zoomOut(ZOOM_ANIMATION)
        else return
      } else return

      event.preventDefault()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [flow, undo, redo])
}
