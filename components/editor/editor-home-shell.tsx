"use client"

import { useState } from "react"

import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { ProjectSummary } from "@/lib/projects"

interface EditorHomeShellProps {
  owned: ProjectSummary[]
  shared: ProjectSummary[]
}

// Client boundary for the editor home: owns sidebar open state and project actions.
export function EditorHomeShell({ owned, shared }: EditorHomeShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const actions = useProjectActions()

  return (
    <div className="flex h-screen flex-col">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <main className="relative flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          owned={owned}
          shared={shared}
          onCreate={actions.openCreate}
          onRename={actions.openRename}
          onDelete={actions.openDelete}
        />
        <EditorHome onNewProject={actions.openCreate} />
      </main>
      <ProjectDialogs actions={actions} />
    </div>
  )
}
