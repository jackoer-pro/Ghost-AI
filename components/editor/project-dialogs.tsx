"use client"

import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ProjectActions } from "@/hooks/use-project-actions"

interface ProjectDialogsProps {
  actions: ProjectActions
}

// Matches the p-6 / rounded-3xl dialog (the shadcn footer assumes p-4 / rounded-xl).
const footerClass = "-mx-6 -mb-6 rounded-b-3xl border-surface-border bg-surface px-6 py-4"

// Renders whichever project dialog the actions hook says is open.
export function ProjectDialogs({ actions: a }: ProjectDialogsProps) {
  const { dialog } = a

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void a.submit()
  }

  const errorText = a.error && (
    <p role="alert" className="text-sm text-destructive">
      {a.error}
    </p>
  )

  const nameForm = (title: string, description: string, action: string) => (
    <form onSubmit={onSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="text-copy-muted">{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Input
          autoFocus
          aria-label="Project name"
          placeholder="Project name"
          className="h-9 rounded-xl"
          value={a.name}
          onChange={(e) => a.setName(e.target.value)}
          disabled={a.isSubmitting}
        />
        {dialog.kind === "create" && (
          <p className="truncate rounded-xl bg-base px-3 py-2 font-mono text-xs text-copy-muted">
            <span className="text-copy-faint">Room ID </span>
            <span className={a.canSubmitName ? "text-brand" : undefined}>
              {a.canSubmitName ? a.roomId : "—"}
            </span>
          </p>
        )}
        {errorText}
      </div>
      <DialogFooter className={footerClass}>
        <Button type="button" variant="outline" onClick={a.close}>
          Cancel
        </Button>
        <Button type="submit" disabled={!a.canSubmitName || a.isSubmitting}>
          {action}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <Dialog open={dialog.kind !== "closed"} onOpenChange={(open) => !open && a.close()}>
      <DialogContent className="gap-5 rounded-3xl border border-surface-border bg-elevated p-6">
        {dialog.kind === "create" &&
          nameForm("Create project", "Give your new architecture workspace a name.", "Create")}

        {dialog.kind === "rename" &&
          nameForm("Rename project", `Rename “${dialog.project.name}”.`, "Rename")}

        {dialog.kind === "delete" && (
          <>
            <DialogHeader>
              <DialogTitle>Delete project</DialogTitle>
              <DialogDescription className="text-copy-muted">
                “{dialog.project.name}” will be deleted. This can’t be undone.
              </DialogDescription>
            </DialogHeader>
            {errorText}
            <DialogFooter className={footerClass}>
              <Button variant="outline" onClick={a.close}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => void a.submit()}
                disabled={a.isSubmitting}
              >
                Delete
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
