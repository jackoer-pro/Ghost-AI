"use client"

import { useState } from "react"

import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectSummary } from "@/lib/projects"
import { cn } from "@/lib/utils"

interface EditorShellProps {
  owned: ProjectSummary[]
  shared: ProjectSummary[]
  /** Set on `/editor/[roomId]`; omitted on the editor home. */
  project?: ProjectSummary
}

// Client boundary for the editor: sidebar/AI panel state and project actions.
export function EditorShell({ owned, shared, project }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)
  const actions = useProjectActions()

  return (
    <div className="flex h-screen flex-col">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        workspace={
          project && {
            projectName: project.name,
            isAiSidebarOpen,
            onToggleAiSidebar: () => setIsAiSidebarOpen((open) => !open),
          }
        }
      />
      <div className="relative flex min-h-0 flex-1">
        <main className="relative flex-1 overflow-hidden">
          <ProjectSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            owned={owned}
            shared={shared}
            activeProjectId={project?.id}
            onCreate={actions.openCreate}
            onRename={actions.openRename}
            onDelete={actions.openDelete}
          />
          {project ? (
            <div className="flex h-full items-center justify-center bg-bg-base text-muted-foreground">
              Canvas coming soon
            </div>
          ) : (
            <EditorHome onNewProject={actions.openCreate} />
          )}
        </main>
        {project && (
          // Placeholder for the AI chat. Overlays on small screens, sits beside the canvas on md+.
          <aside
            inert={!isAiSidebarOpen}
            className={cn(
              "absolute inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground md:static",
              !isAiSidebarOpen && "hidden"
            )}
          >
            <div className="flex h-12 shrink-0 items-center border-b border-sidebar-border px-3">
              <h2 className="text-sm font-medium">AI assistant</h2>
            </div>
            <p className="p-6 text-center text-muted-foreground">AI chat coming soon.</p>
          </aside>
        )}
      </div>
      <ProjectDialogs actions={actions} />
    </div>
  )
}
