"use client"

import { useEffect, useRef, useState } from "react"

import { fetchJson } from "@/lib/fetch-json"
import type { CollaboratorView, PersonView } from "@/lib/projects"

interface CollaboratorsResponse {
  collaborators: CollaboratorView[]
  owner?: PersonView | null
}

// Share dialog state: collaborator list (loaded when the dialog opens),
// invite/remove calls, and the copy-link feedback.
export function useShareDialog(projectId: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [collaborators, setCollaborators] = useState<CollaboratorView[] | null>(null)
  const [owner, setOwner] = useState<PersonView | null>(null)
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState<"invite" | string | null>(null) // "invite" or the collaborator id being removed
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const base = `/api/projects/${projectId}/collaborators`

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    fetchJson<CollaboratorsResponse>(base)
      .then((data) => {
        if (cancelled) return
        setOwner(data?.owner ?? null)
        setCollaborators(data?.collaborators ?? [])
      })
      .catch((err: Error) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [isOpen, base])

  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  const open = () => {
    setCollaborators(null)
    setEmail("")
    setError(null)
    setIsOpen(true)
  }

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(null)
    }
  }

  const invite = () =>
    run("invite", async () => {
      const data = await fetchJson<CollaboratorsResponse>(base, {
        method: "POST",
        body: { email },
      })
      setCollaborators(data?.collaborators ?? [])
      setEmail("")
    })

  const remove = (collaboratorId: string) =>
    run(collaboratorId, async () => {
      await fetchJson(`${base}/${collaboratorId}`, { method: "DELETE" })
      setCollaborators((list) => list?.filter((c) => c.id !== collaboratorId) ?? null)
    })

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/editor/${projectId}`)
      setCopied(true)
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Couldn’t copy the link. Copy it from the address bar instead.")
    }
  }

  return {
    isOpen,
    open,
    setIsOpen,
    owner,
    collaborators,
    email,
    setEmail,
    busy,
    error,
    copied,
    invite,
    remove,
    copyLink,
  }
}

export type ShareDialogState = ReturnType<typeof useShareDialog>
