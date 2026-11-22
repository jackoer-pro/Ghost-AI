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
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Input
          autoFocus
          aria-label="Project name"
          placeholder="Project name"
          value={a.name}
          onChange={(e) => a.setName(e.target.value)}
          disabled={a.isSubmitting}
        />
        {dialog.kind === "create" && (
          <p className="truncate font-mono text-xs text-muted-foreground">
            Room ID: {a.canSubmitName ? a.roomId : "—"}
          </p>
        )}
        {errorText}
      </div>
      <DialogFooter>
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
      <DialogContent className="rounded-3xl">
        {dialog.kind === "create" &&
          nameForm("Create project", "Give your new architecture workspace a name.", "Create")}

        {dialog.kind === "rename" &&
          nameForm("Rename project", `Rename “${dialog.project.name}”.`, "Rename")}

        {dialog.kind === "delete" && (
          <>
            <DialogHeader>
              <DialogTitle>Delete project</DialogTitle>
              <DialogDescription>
                “{dialog.project.name}” will be deleted. This can’t be undone.
              </DialogDescription>
            </DialogHeader>
            {errorText}
            <DialogFooter>
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
