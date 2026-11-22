"use client"

import { Sparkles, X } from "lucide-react"
import { useState } from "react"

import { CollaborativeCanvas } from "@/components/canvas/collaborative-canvas"
import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareDialog } from "@/hooks/use-share-dialog"
import type { ProjectSummary } from "@/lib/projects"
import { cn } from "@/lib/utils"

interface EditorShellProps {
  owned: ProjectSummary[]
  shared: ProjectSummary[]
  /** Set on `/editor/[roomId]`; omitted on the editor home. */
  project?: ProjectSummary
}

// Client boundary for the editor: sidebar/AI panel state and project actions.
// Layout (ui-context): floating sidebar on the left, canvas in the center,
// slide-over AI sidebar on the right; both sidebars overlay the canvas.
export function EditorShell({ owned, shared, project }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)
  const actions = useProjectActions()
  // Always called (hooks can't be conditional); it only fetches once opened, which needs a project.
  const share = useShareDialog(project?.id ?? "")

  return (
    <div className="flex h-dvh flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        workspace={
          project && {
            projectName: project.name,
            isOwner: project.isOwner,
            isAiSidebarOpen,
            onToggleAiSidebar: () => setIsAiSidebarOpen((open) => !open),
            onShare: share.open,
          }
        }
      />
      <main className="relative min-h-0 flex-1 overflow-hidden">
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
          <CollaborativeCanvas roomId={project.id} />
        ) : (
          <EditorHome onNewProject={actions.openCreate} />
        )}

        {project && (
          // Placeholder for the AI chat (feature 20).
          <aside
            inert={!isAiSidebarOpen}
            aria-label="AI assistant"
            className={cn(
              "absolute inset-y-2 right-2 z-40 flex w-80 max-w-[calc(100%-1rem)] flex-col rounded-2xl border border-surface-border bg-surface/85 shadow-2xl shadow-black/40 backdrop-blur-xl transition-[translate,opacity] duration-200",
              isAiSidebarOpen ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+1rem)] opacity-0"
            )}
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border px-3">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4 text-ai-text" aria-hidden />
                AI assistant
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsAiSidebarOpen(false)}
                aria-label="Close AI sidebar"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <Sparkles className="size-8 text-ai-text" aria-hidden />
              <p className="text-copy-muted">
                Describe a system and the AI will sketch it on the canvas. Coming soon.
              </p>
            </div>
          </aside>
        )}
      </main>

      <ProjectDialogs actions={actions} />
      {project && (
        <ShareDialog share={share} projectName={project.name} isOwner={project.isOwner} />
      )}
    </div>
  )
}
