import { UserButton } from "@clerk/nextjs"
import {
  AlertCircle,
  Check,
  LayoutTemplate,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Share2,
  Sparkles,
} from "lucide-react"

import { Hint } from "@/components/hint"
import { RoleBadge } from "@/components/editor/role-badge"
import { Button } from "@/components/ui/button"
import type { CanvasAutosave, SaveStatus } from "@/hooks/use-canvas-autosave"
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
    /** Canvas autosave; null until the canvas connects. */
    autosave: CanvasAutosave | null
  }
}

const SAVE_LABELS: Record<SaveStatus, { text: string; hint: string }> = {
  loading: { text: "Loading…", hint: "Checking for a saved canvas" },
  "load-error": { text: "Load failed", hint: "Couldn't check the saved canvas. Click to retry" },
  idle: { text: "Save", hint: "Changes save automatically" },
  saving: { text: "Saving…", hint: "Saving the canvas" },
  saved: { text: "Saved", hint: "All changes saved" },
  error: { text: "Save failed", hint: "Couldn't save the canvas. Click to retry" },
}

function SaveButton({ autosave }: { autosave: CanvasAutosave | null }) {
  const status = autosave?.status ?? "loading"
  const { text, hint } = SAVE_LABELS[status]
  const failed = status === "error" || status === "load-error"
  const busy = status === "loading" || status === "saving"
  const Icon = busy ? Loader2 : failed ? AlertCircle : status === "saved" ? Check : Save
  return (
    <Hint label={hint} side="bottom">
      <Button
        variant="ghost"
        size="sm"
        onClick={autosave?.saveNow}
        disabled={!autosave || busy}
        aria-label={text}
        className={cn(failed && "text-state-error hover:text-state-error")}
      >
        <Icon className={cn(busy && "animate-spin", status === "saved" && "text-state-success")} />
        <span className="hidden sm:inline">{text}</span>
        {/* Announces status changes; the visible text is hidden on phones and aria-label changes aren't read. */}
        <span role="status" className="sr-only">
          {text}
        </span>
      </Button>
    </Hint>
  )
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
            <SaveButton autosave={workspace.autosave} />
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
