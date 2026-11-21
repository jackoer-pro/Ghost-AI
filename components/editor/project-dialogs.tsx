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
import type { ProjectDialogsController } from "@/hooks/use-project-dialogs"

interface ProjectDialogsProps {
  controller: ProjectDialogsController
}

// Renders whichever project dialog the controller says is open.
export function ProjectDialogs({ controller: c }: ProjectDialogsProps) {
  const { dialog } = c

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void c.submit()
  }

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
          value={c.name}
          onChange={(e) => c.setName(e.target.value)}
          disabled={c.isSubmitting}
        />
        {dialog.kind === "create" && (
          <p className="font-mono text-xs text-muted-foreground">
            Slug: {c.slug || "—"}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={c.close}>
          Cancel
        </Button>
        <Button type="submit" disabled={!c.canSubmitName || c.isSubmitting}>
          {action}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <Dialog open={dialog.kind !== "closed"} onOpenChange={(open) => !open && c.close()}>
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
            <DialogFooter>
              <Button variant="outline" onClick={c.close}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => void c.submit()}
                disabled={c.isSubmitting}
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
