"use client"

import { useState } from "react"

import { AiSidebar } from "@/components/editor/ai-sidebar"
import { CollaborativeCanvas } from "@/components/canvas/collaborative-canvas"
import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import type { CanvasAutosave } from "@/hooks/use-canvas-autosave"
import { useProjectActions } from "@/hooks/use-project-actions"
import { useShareDialog } from "@/hooks/use-share-dialog"
import type { ProjectSummary } from "@/lib/projects"

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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [autosave, setAutosave] = useState<CanvasAutosave | null>(null)
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
            onOpenTemplates: () => setIsTemplatesOpen(true),
            autosave,
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
          // Keyed so switching projects resets the room's error/loading state.
          <CollaborativeCanvas
            key={project.id}
            roomId={project.id}
            templatesOpen={isTemplatesOpen}
            onTemplatesOpenChange={setIsTemplatesOpen}
            onAutosaveChange={setAutosave}
          >
            {/* Inside the room: the sidebar reads the shared AI status feed and presence. */}
            <AiSidebar isOpen={isAiSidebarOpen} onClose={() => setIsAiSidebarOpen(false)} />
          </CollaborativeCanvas>
        ) : (
          <EditorHome onNewProject={actions.openCreate} />
        )}
      </main>

      <ProjectDialogs actions={actions} />
      {project && (
        <ShareDialog share={share} projectName={project.name} isOwner={project.isOwner} />
      )}
    </div>
  )
}
