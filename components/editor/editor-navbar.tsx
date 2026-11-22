import { UserButton } from "@clerk/nextjs"
import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

type EditorNavbarProps = {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  /** Workspace only: shows the project name and the share / AI actions. */
  workspace?: {
    projectName: string
    isAiSidebarOpen: boolean
    onToggleAiSidebar: () => void
  }
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  workspace,
}: EditorNavbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      <div className="flex flex-1 items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center">
        {workspace && (
          <h1 className="truncate text-sm font-medium">{workspace.projectName}</h1>
        )}
      </div>
      <div className="flex flex-1 items-center justify-end gap-1">
        {workspace && (
          <>
            {/* ponytail: no handler until the share dialog (feature 09). */}
            <Button variant="ghost" size="sm">
              <Share2 />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={workspace.onToggleAiSidebar}
              aria-label={workspace.isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
              aria-pressed={workspace.isAiSidebarOpen}
            >
              <Sparkles />
            </Button>
          </>
        )}
        <UserButton />
      </div>
    </header>
  )
}
