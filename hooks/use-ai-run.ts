"use client"

import { useEffect, useEffectEvent } from "react"

import { fetchJson } from "@/lib/fetch-json"

export interface FinishedRun {
  status: "COMPLETED" | "FAILED"
  /** SPEC runs: the generated spec. */
  specId: string | null
}

const POLL_MS = 2000

/**
 * Follows one AI run (`GET /api/ai/runs/{runId}`) until it finishes, then calls `onDone` once.
 * Pass null when there's no run. Polling is enough here: a run takes tens of seconds, and the live
 * progress everyone sees already comes from Liveblocks (presence + `ai-status-feed`).
 */
export function useAiRun(runId: string | null, onDone: (run: FinishedRun) => void) {
  const finish = useEffectEvent(onDone)

  useEffect(() => {
    if (!runId) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    async function poll() {
      try {
        const run = await fetchJson<{ status: string; specId: string | null }>(`/api/ai/runs/${runId}`)
        if (stopped) return
        if (run?.status === "COMPLETED" || run?.status === "FAILED") return finish({ status: run.status, specId: run.specId })
      } catch (err) {
        if (stopped) return
        // A 404 means the run (or access to its project) is gone: nothing left to wait for.
        if (err instanceof Error && err.message === "Not found") return finish({ status: "FAILED", specId: null })
        // Anything else (offline, a 5xx) is retried; the server marks a run FAILED once it's too old.
      }
      timer = setTimeout(poll, POLL_MS)
    }

    timer = setTimeout(poll, POLL_MS)
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [runId])
}
