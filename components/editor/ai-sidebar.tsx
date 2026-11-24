"use client"

import { useFeedMessages, useOthers } from "@liveblocks/react"
import { Bot, Download, FileText, Loader2, SendHorizontal, Sparkles, X } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"

import { Hint } from "@/components/hint"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AI_STATUS_FEED_ID, aiStatusMessageSchema, type AiStatusMessage } from "@/types/tasks"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

// Active tab: AI accent. `dark:` repeats are needed to beat the shadcn trigger's own dark-mode active styles.
const tabClass =
  "text-copy-muted data-active:bg-ai-dim data-active:text-ai-text dark:data-active:border-transparent dark:data-active:bg-ai-dim dark:data-active:text-ai-text"

/**
 * Shared AI activity for the room. `isGenerating` comes from presence (the agent sets `thinking`, and its
 * presence has a TTL, so a crashed run can't leave the sidebar locked); `status` is the newest valid
 * `ai-status-feed` message. Non-suspense hooks: the sidebar must render while the room still connects.
 */
function useAiActivity(): { isGenerating: boolean; status: AiStatusMessage | null } {
  const isGenerating = useOthers((others) => others.some((other) => other.presence.thinking))
  // A missing feed (no run yet in this room) comes back as an error; that just means no status.
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID)
  const latest = messages?.at(-1) // sorted oldest → newest
  const parsed = latest ? aiStatusMessageSchema.safeParse(latest.data) : null
  return { isGenerating, status: parsed?.success && parsed.data.text ? parsed.data : null }
}

// Slide-over AI sidebar on the right of the canvas. Open state is owned by the parent (editor shell).
export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const { isGenerating, status } = useAiActivity()
  return (
    <aside
      inert={!isOpen}
      aria-label="AI workspace"
      className={cn(
        "absolute inset-y-2 right-2 z-40 flex w-96 max-w-[calc(100%-1rem)] flex-col rounded-2xl border border-surface-border bg-surface/85 text-copy-primary shadow-2xl shadow-black/40 backdrop-blur-xl transition-[translate,opacity] duration-200",
        isOpen ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+1rem)] opacity-0"
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-surface-border px-3 py-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-ai-dim">
          <Bot className="size-4 text-ai-text" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-copy-primary">AI Workspace</h2>
          <p className="truncate text-xs text-copy-muted">Collaborate with Ghost AI</p>
        </div>
        <Hint label="Close AI workspace" side="left">
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close AI sidebar">
            <X className="size-5" />
          </Button>
        </Hint>
      </header>

      <AiStatus isGenerating={isGenerating} status={status} />

      <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-0">
        <div className="shrink-0 px-3 pt-3">
          <TabsList className="w-full bg-subtle">
            <TabsTrigger value="architect" className={tabClass}>
              <Sparkles />
              AI Architect
            </TabsTrigger>
            <TabsTrigger value="specs" className={tabClass}>
              <FileText />
              Specs
            </TabsTrigger>
          </TabsList>
        </div>
        {/* keepMounted: Base UI unmounts inactive panels, which would wipe the chat and draft on a tab switch. */}
        <TabsContent value="architect" keepMounted className="flex min-h-0 flex-col">
          <ArchitectChat isGenerating={isGenerating} />
        </TabsContent>
        <TabsContent value="specs" className="min-h-0 overflow-y-auto p-3">
          <SpecsPanel />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

// ponytail: messages live in local state; feature 25 replaces them with the room's `ai-chat` feed.
function ArchitectChat({ isGenerating }: { isGenerating: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length])

  function send(event?: FormEvent) {
    event?.preventDefault()
    const content = draft.trim()
    if (!content || isGenerating) return
    setMessages((list) => [...list, { id: crypto.randomUUID(), role: "user", content }])
    setDraft("")
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter is a newline. Skip while an IME is composing (e.g. Vietnamese Telex, Japanese),
    // where Enter confirms the composed text.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) send(event)
  }

  function pickStarter(prompt: string) {
    setDraft(prompt)
    inputRef.current?.focus()
  }

  return (
    <>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 px-2 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-ai-dim">
              <Bot className="size-8 text-ai-text" aria-hidden />
            </span>
            <div className="space-y-1">
              <p className="font-medium text-copy-primary">Design with AI</p>
              <p className="text-sm text-copy-muted">
                Describe a system and Ghost AI will sketch its architecture on the canvas.
              </p>
            </div>
            <ul className="flex flex-wrap justify-center gap-2 pt-1">
              {STARTER_PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => pickStarter(prompt)}
                    className="rounded-full bg-subtle px-3 py-1.5 text-xs text-ai-text transition-colors outline-none hover:bg-ai-dim focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol aria-label="Messages" className="flex flex-col gap-3">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                  message.role === "user"
                    ? "self-end border-2 border-brand/50 bg-accent-dim text-copy-primary"
                    : "self-start border border-surface-border bg-elevated text-ai-text"
                )}
              >
                {message.content}
              </li>
            ))}
          </ol>
        )}
      </div>

      <form onSubmit={send} className="shrink-0 border-t border-surface-border p-3">
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={isGenerating}
            placeholder={isGenerating ? "Ghost AI is working…" : "Describe the system you want to design…"}
            aria-label="Message Ghost AI"
            rows={3}
            className="max-h-40 min-h-[72px] resize-none rounded-xl bg-elevated pr-12 dark:bg-elevated"
          />
          <Hint label={isGenerating ? "Ghost AI is working" : "Send (Enter)"} side="top">
            <Button
              type="submit"
              size="icon-sm"
              disabled={!draft.trim() || isGenerating}
              aria-label={isGenerating ? "Ghost AI is working" : "Send message"}
              className="absolute right-2 bottom-2 bg-ai text-white hover:bg-ai/85"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
            </Button>
          </Hint>
        </div>
        <p className="mt-1.5 text-[11px] text-copy-faint">Enter to send · Shift+Enter for a new line</p>
      </form>
    </>
  )
}

// One-line strip under the header: only the newest status, never the history.
function AiStatus({ isGenerating, status }: { isGenerating: boolean; status: AiStatusMessage | null }) {
  // While someone is generating, show a spinner even before the first status message lands.
  if (!status && !isGenerating) return null
  const isError = !isGenerating && status?.stage === "error"
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex shrink-0 items-center gap-2 border-b border-surface-border px-3 py-2 text-xs",
        isError ? "text-state-error" : isGenerating ? "text-ai-text" : "text-copy-muted"
      )}
    >
      {isGenerating ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="size-3.5 shrink-0" aria-hidden />
      )}
      <span className="min-w-0 truncate">{status?.text ?? "Ghost AI is working…"}</span>
    </div>
  )
}

// Static demo until spec generation lands (features 27–29).
function SpecsPanel() {
  return (
    <div className="flex flex-col gap-3">
      <Button className="w-full bg-ai text-white hover:bg-ai/85">
        <Sparkles />
        Generate Spec
      </Button>
      <article className="flex gap-3 rounded-2xl border border-surface-border bg-elevated p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ai-dim">
          <FileText className="size-5 text-ai-text" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-copy-primary">E-commerce backend spec</h3>
          <p className="mt-1 line-clamp-3 text-xs text-copy-muted">
            API gateway in front of catalog, cart and order services; orders publish events to a queue consumed by
            payments and notifications. Postgres per service, Redis for sessions.
          </p>
        </div>
        <Hint label="Download (coming soon)" side="left">
          {/* Wrapper span: a disabled button gets no pointer events, so the tooltip needs its own trigger. */}
          <span className="self-start" tabIndex={0}>
            <Button variant="ghost" size="icon-sm" disabled aria-label="Download spec">
              <Download className="size-4" />
            </Button>
          </span>
        </Hint>
      </article>
    </div>
  )
}
