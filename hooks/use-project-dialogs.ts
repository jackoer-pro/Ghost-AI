"use client"

import { useState } from "react"

import { MOCK_PROJECTS, toSlug, type Project } from "@/lib/projects"

type DialogState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "rename"; project: Project }
  | { kind: "delete"; project: Project }

// Owns the project list (mock), which dialog is open, the name field and the
// submitting flag. Mutations are local only; swap them for API calls later.
export function useProjectDialogs() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" })
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openCreate = () => {
    setName("")
    setDialog({ kind: "create" })
  }
  const openRename = (project: Project) => {
    setName(project.name)
    setDialog({ kind: "rename", project })
  }
  const openDelete = (project: Project) => setDialog({ kind: "delete", project })
  const close = () => {
    if (!isSubmitting) setDialog({ kind: "closed" })
  }

  const trimmed = name.trim()
  const canSubmitName = toSlug(trimmed) !== ""

  const submit = async () => {
    if (dialog.kind === "closed") return
    if (dialog.kind !== "delete" && !canSubmitName) return
    setIsSubmitting(true)
    try {
      if (dialog.kind === "create") {
        setProjects((list) => [
          ...list,
          { id: crypto.randomUUID(), name: trimmed, slug: toSlug(trimmed), isOwner: true },
        ])
      } else if (dialog.kind === "rename") {
        const { id } = dialog.project
        setProjects((list) =>
          list.map((p) => (p.id === id ? { ...p, name: trimmed, slug: toSlug(trimmed) } : p))
        )
      } else {
        const { id } = dialog.project
        setProjects((list) => list.filter((p) => p.id !== id))
      }
      setDialog({ kind: "closed" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    projects,
    dialog,
    name,
    setName,
    slug: toSlug(trimmed),
    canSubmitName,
    isSubmitting,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  }
}

export type ProjectDialogsController = ReturnType<typeof useProjectDialogs>
