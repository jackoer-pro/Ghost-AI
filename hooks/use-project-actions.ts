"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import { fetchJson } from "@/lib/fetch-json"
import { makeRoomId, randomSuffix, toSlug, type ProjectSummary } from "@/lib/projects"

type DialogState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "rename"; project: ProjectSummary }
  | { kind: "delete"; project: ProjectSummary }

// Dialog state + project mutations against /api/projects. The server data is
// the source of truth: after a change we refresh (or navigate) instead of
// patching local state.
export function useProjectActions() {
  const router = useRouter()
  const { roomId: activeRoomId } = useParams<{ roomId?: string }>()

  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" })
  const [name, setName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = (next: DialogState, initialName = "") => {
    setName(initialName)
    setError(null)
    setDialog(next)
  }
  const openCreate = () => {
    setSuffix(randomSuffix()) // fixed per dialog so the preview doesn't jump while typing
    open({ kind: "create" })
  }
  const openRename = (project: ProjectSummary) => open({ kind: "rename", project }, project.name)
  const openDelete = (project: ProjectSummary) => open({ kind: "delete", project })
  const close = () => {
    if (!isSubmitting) setDialog({ kind: "closed" })
  }

  const trimmed = name.trim()
  const roomId = makeRoomId(trimmed, suffix)
  const canSubmitName = toSlug(trimmed) !== ""

  const submit = async () => {
    if (dialog.kind === "closed") return
    if (dialog.kind !== "delete" && !canSubmitName) return
    setIsSubmitting(true)
    setError(null)
    try {
      if (dialog.kind === "create") {
        await fetchJson("/api/projects", { method: "POST", body: { id: roomId, name: trimmed } })
        setDialog({ kind: "closed" })
        router.push(`/editor/${roomId}`)
      } else if (dialog.kind === "rename") {
        await fetchJson(`/api/projects/${dialog.project.id}`, { method: "PATCH", body: { name: trimmed } })
        setDialog({ kind: "closed" })
        router.refresh()
      } else {
        await fetchJson(`/api/projects/${dialog.project.id}`, { method: "DELETE" })
        setDialog({ kind: "closed" })
        if (dialog.project.id === activeRoomId) router.push("/editor")
        else router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    dialog,
    name,
    setName,
    roomId,
    canSubmitName,
    isSubmitting,
    error,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  }
}

export type ProjectActions = ReturnType<typeof useProjectActions>
