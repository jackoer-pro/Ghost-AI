import { FolderOpen, Pencil, Plus, Trash2, Users, X } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ProjectSummary } from "@/lib/projects"
import { cn } from "@/lib/utils"

type ProjectSidebarProps = {
  isOpen: boolean
  onClose: () => void
  owned: ProjectSummary[]
  shared: ProjectSummary[]
  /** The open workspace's project, highlighted in the list. */
  activeProjectId?: string
  onCreate: () => void
  onRename: (project: ProjectSummary) => void
  onDelete: (project: ProjectSummary) => void
}

// Floating overlay (ui-context: "floating overlay with dark semi-transparent
// background and subtle border"), positioned against the nearest `relative`
// ancestor so it overlays the canvas instead of pushing it.
export function ProjectSidebar({
  isOpen,
  onClose,
  owned,
  shared,
  activeProjectId,
  onCreate,
  onRename,
  onDelete,
}: ProjectSidebarProps) {
  const list = (items: ProjectSummary[], empty: string) =>
    items.length === 0 ? (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <FolderOpen className="size-8 text-copy-faint" aria-hidden />
        <p className="text-copy-muted">{empty}</p>
      </div>
    ) : (
      <ul className="grid gap-0.5 py-2">
        {items.map((project) => {
          const isActive = project.id === activeProjectId
          return (
            <li
              key={project.id}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-2 py-1.5 text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary",
                isActive && "bg-accent-dim text-brand hover:bg-accent-dim hover:text-brand"
              )}
            >
              {!project.isOwner && (
                <Users className="size-4 shrink-0 text-copy-faint" aria-label="Shared with you" />
              )}
              <Link
                href={`/editor/${project.id}`}
                aria-current={isActive ? "page" : undefined}
                className="min-w-0 flex-1 truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {project.name}
              </Link>
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
                    className="hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )

  return (
    <>
      {/* Mobile-only scrim: tapping outside the sidebar closes it. */}
      {isOpen && (
        <div
          aria-hidden
          onClick={onClose}
          className="absolute inset-0 z-30 bg-base/60 backdrop-blur-sm md:hidden"
        />
      )}
      <aside
        inert={!isOpen}
        aria-label="Projects"
        className={cn(
          "absolute inset-y-2 left-2 z-40 flex w-72 max-w-[calc(100%-1rem)] flex-col rounded-2xl border border-surface-border bg-surface/85 text-copy-primary shadow-2xl shadow-black/40 backdrop-blur-xl transition-[translate,opacity] duration-200",
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-[calc(100%+1rem)] opacity-0"
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border px-3">
          <h2 className="text-sm font-medium">Projects</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close sidebar">
            <X className="size-5" />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="min-h-0 flex-1 overflow-y-auto p-3">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects">
              My Projects
              <Count n={owned.length} />
            </TabsTrigger>
            <TabsTrigger value="shared">
              Shared
              <Count n={shared.length} />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my-projects">{list(owned, "No projects yet.")}</TabsContent>
          <TabsContent value="shared">{list(shared, "Nothing shared with you yet.")}</TabsContent>
        </Tabs>

        <div className="shrink-0 border-t border-surface-border p-3">
          <Button className="w-full" onClick={onCreate}>
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

function Count({ n }: { n: number }) {
  return n > 0 ? <span className="text-xs text-copy-faint tabular-nums">{n}</span> : null
}
