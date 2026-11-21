import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface EditorHomeProps {
  onNewProject: () => void
}

export function EditorHome({ onNewProject }: EditorHomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-medium">Create a project or open an existing one</h1>
      <p className="max-w-md text-muted-foreground">
        Start a new architecture workspace, or choose a project from the sidebar.
      </p>
      <Button className="mt-2" onClick={onNewProject}>
        <Plus />
        New Project
      </Button>
    </div>
  )
}
