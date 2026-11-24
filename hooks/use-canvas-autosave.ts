"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { toSnapshot, type CanvasSnapshot } from "@/lib/canvas-snapshot"
import { fetchJson } from "@/lib/fetch-json"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

/**
 * - `loading` / `load-error`: checking for a saved canvas; autosave is off until this succeeds, so an
 *   empty room can never overwrite the saved copy.
 * - `idle`: nothing saved this session yet. `saving` / `saved` / `error`: the last save attempt.
 */
export type SaveStatus = "loading" | "load-error" | "idle" | "saving" | "saved" | "error"

export interface CanvasAutosave {
  status: SaveStatus
  /** Save now (skipping the debounce), or retry the load if that failed. Stable across renders. */
  saveNow: () => void
}

const SAVE_DEBOUNCE_MS = 1500

interface Options {
  /** Constant for the hook's lifetime: the canvas is remounted (keyed) per project. */
  projectId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  /** Writes a saved snapshot into the (empty) room. */
  onLoad: (snapshot: CanvasSnapshot) => void
}

// ponytail: every connected collaborator saves the same room state after each change (N writes per edit,
// last one wins, all identical). Elect a single saver via presence if Blob write volume ever matters.
export function useCanvasAutosave({ projectId, nodes, edges, onLoad }: Options): CanvasAutosave {
  const [status, setStatus] = useState<SaveStatus>("loading")
  const [ready, setReady] = useState(false)
  const current = useMemo(() => {
    const snapshot = toSnapshot(nodes, edges)
    return { snapshot, json: JSON.stringify(snapshot) }
  }, [nodes, edges])

  const latest = useRef(current)
  const onLoadRef = useRef(onLoad)
  const readyRef = useRef(false)
  /** JSON of what the server holds (as far as we know); null = unknown, so the next change is saved. */
  const saved = useRef<string | null>(null)
  useEffect(() => {
    latest.current = current
    onLoadRef.current = onLoad
    readyRef.current = ready
  })

  // Created once: only reads refs, so timers and the unmount cleanup never call a stale copy.
  const [actions] = useState(() => {
    const url = `/api/projects/${encodeURIComponent(projectId)}/canvas`
    let inFlight = false
    let queued = false

    async function save() {
      // One request at a time, so an older snapshot can't land after a newer one.
      if (inFlight) {
        queued = true
        return
      }
      const { snapshot, json } = latest.current
      if (json === saved.current) {
        setStatus("saved") // e.g. Save clicked with nothing new: confirm instead of doing nothing
        return
      }
      inFlight = true
      setStatus("saving")
      try {
        await fetchJson(url, { method: "PUT", body: snapshot })
        saved.current = json
        setStatus("saved")
      } catch {
        setStatus("error") // the next change, or a click on Save, retries
      } finally {
        inFlight = false
        if (queued) {
          queued = false
          void save()
        }
      }
    }

    let loading = false
    async function load() {
      if (loading) return // StrictMode runs the mount effect twice; one request is enough
      loading = true
      setStatus("loading")
      try {
        const res = await fetchJson<{ canvas: CanvasSnapshot | null }>(url)
        const { snapshot, json } = latest.current
        // Checked again after the request: someone may have started drawing meanwhile.
        const roomEmpty = snapshot.nodes.length === 0 && snapshot.edges.length === 0
        if (roomEmpty && res?.canvas) {
          onLoadRef.current(res.canvas)
          saved.current = JSON.stringify(res.canvas)
        } else if (roomEmpty) {
          saved.current = json // nothing saved and nothing drawn: no need to write an empty canvas
        }
        // Otherwise `saved` stays null, so what was drawn meanwhile gets saved.
        setStatus("idle")
        setReady(true)
      } catch {
        setStatus("load-error")
      } finally {
        loading = false
      }
    }

    const saveNow = () => void (readyRef.current ? save() : load())
    return { save, load, saveNow }
  })

  // On mount: a room that already has content is live collaboration, never overwritten by the saved copy.
  // `saved` stays null (we don't know what the server holds), so the room is saved once after the debounce.
  // Assuming it was already saved left rooms drawn before autosave, or whose save failed, never written,
  // and made Save report "Saved" without sending anything.
  useEffect(() => {
    const { snapshot } = latest.current
    if (snapshot.nodes.length > 0 || snapshot.edges.length > 0) {
      setStatus("idle")
      setReady(true)
    } else {
      void actions.load()
    }
    // Leaving the project (or closing the canvas) mid-debounce: send the pending change instead of dropping it.
    return () => {
      if (readyRef.current) void actions.save()
    }
  }, [actions])

  useEffect(() => {
    if (!ready || current.json === saved.current) return
    const timer = setTimeout(() => void actions.save(), SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [current, ready, actions])

  return { status, saveNow: actions.saveNow }
}
