import { Plus, Workflow } from "lucide-react"

import { Button } from "@/components/ui/button"

interface EditorHomeProps {
  onNewProject: () => void
}

export function EditorHome({ onNewProject }: EditorHomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="mb-1 flex size-14 items-center justify-center rounded-2xl border border-surface-border bg-surface">
        <Workflow className="size-8 text-brand" aria-hidden />
      </div>
      <h1 className="text-xl font-medium text-balance text-copy-primary">Create a project or open an existing one</h1>
      <p className="max-w-md text-balance text-copy-muted">
        Start a new architecture workspace, or choose a project from the sidebar.
      </p>
      <Button className="mt-2" onClick={onNewProject}>
        <Plus />
        New Project
      </Button>
    </div>
  )
}
