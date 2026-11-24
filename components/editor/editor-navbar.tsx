import { UserButton } from "@clerk/nextjs"
import { LayoutTemplate, PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react"

import { Hint } from "@/components/hint"
import { RoleBadge } from "@/components/editor/role-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EditorNavbarProps = {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  /** Workspace only: shows the project name, the user's role and the share / AI actions. */
  workspace?: {
    projectName: string
    isOwner: boolean
    isAiSidebarOpen: boolean
    onToggleAiSidebar: () => void
    onShare: () => void
    onOpenTemplates: () => void
  }
}

export function EditorNavbar({ isSidebarOpen, onToggleSidebar, workspace }: EditorNavbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-surface-border bg-surface px-2">
      <div className="flex flex-1 items-center">
        <Hint label={isSidebarOpen ? "Hide projects" : "Show projects"} side="bottom">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
          </Button>
        </Hint>
      </div>

      <div className="flex min-w-0 flex-[2] items-center justify-center gap-2">
        {workspace && (
          <>
            <h1 className="truncate text-sm font-medium text-copy-primary">
              {workspace.projectName}
            </h1>
            <RoleBadge isOwner={workspace.isOwner} className="hidden sm:inline-flex" />
          </>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-1">
        {workspace && (
          <>
            <Hint label="Start from a starter template" side="bottom">
              <Button variant="ghost" size="sm" onClick={workspace.onOpenTemplates} aria-label="Templates">
                <LayoutTemplate />
                {/* Icon-only on phones so the project name keeps room. */}
                <span className="hidden sm:inline">Templates</span>
              </Button>
            </Hint>
            <Hint label="Invite people to this project" side="bottom">
              <Button variant="ghost" size="sm" onClick={workspace.onShare} aria-label="Share">
                <Share2 />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </Hint>
            <Hint label={workspace.isAiSidebarOpen ? "Close AI assistant" : "Open AI assistant"} side="bottom">
              <Button
                variant="ghost"
                size="icon"
                onClick={workspace.onToggleAiSidebar}
                aria-label={workspace.isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
                aria-pressed={workspace.isAiSidebarOpen}
                className={cn(
                  workspace.isAiSidebarOpen && "bg-ai-dim text-ai-text hover:bg-ai-dim hover:text-ai-text"
                )}
              >
                <Sparkles className="size-5" />
              </Button>
            </Hint>
          </>
        )}
        {/* In a workspace the user's button moves into the canvas presence group (PresenceAvatars). */}
        {!workspace && (
          <div className="ml-1 flex items-center">
            <UserButton />
          </div>
        )}
      </div>
    </header>
  )
}
