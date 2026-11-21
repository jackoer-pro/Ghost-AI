import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Project } from "@/lib/projects"
import { cn } from "@/lib/utils"

type ProjectSidebarProps = {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  onCreate: () => void
  onRename: (project: Project) => void
  onDelete: (project: Project) => void
}

// Positioned against the nearest `relative` ancestor (the editor area below
// the navbar), so it overlays the canvas instead of pushing it.
export function ProjectSidebar({
  isOpen,
  onClose,
  projects,
  onCreate,
  onRename,
  onDelete,
}: ProjectSidebarProps) {
  const owned = projects.filter((p) => p.isOwner)
  const shared = projects.filter((p) => !p.isOwner)

  const list = (items: Project[], empty: string) =>
    items.length === 0 ? (
      <p className="py-8 text-center text-muted-foreground">{empty}</p>
    ) : (
      <ul className="grid gap-1 py-2">
        {items.map((project) => (
          <li
            key={project.id}
            className="group flex items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-sidebar-accent"
          >
            <span className="min-w-0 flex-1 truncate">{project.name}</span>
            {project.isOwner && (
              <div className="flex shrink-0 gap-0.5 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRename(project)}
                  aria-label={`Rename ${project.name}`}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(project)}
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    )

  return (
    <>
      {/* Mobile-only scrim: tapping outside the sidebar closes it. */}
      {isOpen && (
        <div
          aria-hidden
          onClick={onClose}
          className="absolute inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
      <aside
        inert={!isOpen}
        className={cn(
          "absolute inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
          <h2 className="text-sm font-medium">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="min-h-0 flex-1 overflow-y-auto p-3">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          <TabsContent value="my-projects">{list(owned, "No projects yet.")}</TabsContent>
          <TabsContent value="shared">{list(shared, "Nothing shared with you yet.")}</TabsContent>
        </Tabs>

        <div className="shrink-0 border-t border-sidebar-border p-3">
          <Button className="w-full" onClick={onCreate}>
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
