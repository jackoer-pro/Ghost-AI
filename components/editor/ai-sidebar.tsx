"use client"

import { shallow, useCreateFeedMessage, useFeedMessages, useOthers, useRoom, useSelf } from "@liveblocks/react"
import { Bot, FileText, Loader2, SendHorizontal, Sparkles, X } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"

import { SpecsPanel } from "@/components/editor/specs-panel"
import { Hint } from "@/components/hint"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAiRun } from "@/hooks/use-ai-run"
import { fetchJson } from "@/lib/fetch-json"
import { cn } from "@/lib/utils"
import {
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  aiChatMessageSchema,
  aiStatusMessageSchema,
  MAX_CHAT_MESSAGE_LENGTH,
  type AiChatMessage,
  type AiStatusMessage,
} from "@/types/tasks"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
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
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID)
  const latest = messages?.at(-1) // sorted oldest → newest
  const parsed = latest ? aiStatusMessageSchema.safeParse(latest.data) : null
  return { isGenerating, status: parsed?.success && parsed.data.text ? parsed.data : null }
}

// Slide-over AI sidebar on the right of the canvas. Open state is owned by the parent (editor shell).
export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const { isGenerating, status } = useAiActivity()
  const roomId = useRoom().id // room ID = project ID
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
        {/* keepMounted: Base UI unmounts inactive panels, which would wipe the chat, the draft and a
            run being followed on a tab switch. */}
        <TabsContent value="architect" keepMounted className="flex min-h-0 flex-col">
          <ArchitectChat roomId={roomId} isGenerating={isGenerating} status={status} />
        </TabsContent>
        <TabsContent value="specs" keepMounted className="min-h-0 overflow-y-auto p-3">
          <SpecsPanel roomId={roomId} />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })

interface ArchitectChatProps {
  roomId: string
  /** Someone's AI run is active in the room (from presence). */
  isGenerating: boolean
  status: AiStatusMessage | null
}

// Room chat on the `ai-chat` feed: everyone in the project sees the same messages live. Each message is
// also a design prompt: sending starts the design agent, whose outcome Ghost AI posts back to the chat.
function ArchitectChat({ roomId, isGenerating, status }: ArchitectChatProps) {
  const { messages, isLoading, error: loadError } = useFeedMessages(AI_CHAT_FEED_ID)
  const createFeedMessage = useCreateFeedMessage()
  // null until the room connects, so sending waits for a known sender.
  const me = useSelf((self) => ({ id: self.id, name: self.info.name }), shallow)
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  /** The design run this tab started, until it finishes. */
  const [runId, setRunId] = useState<string | null>(null)
  useAiRun(runId, () => setRunId(null)) // the agent posts the result (or error) to the chat itself
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Feed data is untrusted (any room member can write to it): drop anything that doesn't match the schema.
  const chat = (messages ?? []).flatMap((message) => {
    const parsed = aiChatMessageSchema.safeParse(message.data)
    return parsed.success ? [{ id: message.id, ...parsed.data }] : []
  })

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [chat.length])

  const isBusy = isGenerating || runId !== null
  const canSend = !!me && !isBusy && !isSending

  async function send(event?: FormEvent) {
    event?.preventDefault()
    const content = draft.trim()
    if (!content || !me || !canSend) return
    const message: AiChatMessage = { sender: me, role: "user", content, timestamp: Date.now() }
    setIsSending(true)
    setSendError(null)
    try {
      try {
        await createFeedMessage(AI_CHAT_FEED_ID, message)
      } catch {
        return setSendError("Message not sent. Check your connection and try again.") // draft kept
      }
      setDraft("") // the message is in the chat; the prompt now goes to the agent
      try {
        const res = await fetchJson<{ runId: string }>("/api/ai/design", {
          method: "POST",
          body: { prompt: content, roomId },
        })
        if (res) setRunId(res.runId)
      } catch (err) {
        // Shown only to this sender (e.g. "already working"): it's about their request, not the room's chat.
        setSendError(err instanceof Error ? err.message : "Ghost AI couldn't start. Try again.")
      }
    } finally {
      setIsSending(false)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter is a newline. Skip while an IME is composing (e.g. Vietnamese Telex, Japanese),
    // where Enter confirms the composed text.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) void send(event)
  }

  function pickStarter(prompt: string) {
    setDraft(prompt)
    inputRef.current?.focus()
  }

  return (
    <>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex min-h-full items-center justify-center gap-2 text-sm text-copy-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading chat…
          </div>
        ) : loadError ? (
          <p role="alert" className="flex min-h-full items-center justify-center px-4 text-center text-sm text-copy-muted">
            Couldn&apos;t load the chat. Reload the page to try again.
          </p>
        ) : chat.length === 0 ? (
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
            {chat.map((message) => {
              const isMine = message.role === "user" && message.sender.id === me?.id
              return (
                <li
                  key={message.id}
                  className={cn("flex max-w-[85%] flex-col gap-1", isMine ? "items-end self-end" : "self-start")}
                >
                  <p className="flex items-baseline gap-1.5 px-1 text-[11px] text-copy-faint">
                    <span className="max-w-40 truncate font-medium text-copy-muted">
                      {isMine ? "You" : message.sender.name}
                    </span>
                    <time dateTime={new Date(message.timestamp).toISOString()}>
                      {timeFormat.format(message.timestamp)}
                    </time>
                  </p>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                      message.role === "assistant"
                        ? "border border-surface-border bg-elevated text-ai-text"
                        : isMine
                          ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                          : "border border-surface-border bg-subtle text-copy-primary"
                    )}
                  >
                    {message.content}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {isBusy && <AiStatus status={status} />}
      <form onSubmit={send} className="shrink-0 border-t border-surface-border p-3">
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value)
              setSendError(null)
            }}
            onKeyDown={onKeyDown}
            // Not disabled while sending: that would drop focus mid-send. canSend guards double sends.
            disabled={isBusy || !me}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            placeholder={isBusy ? "Ghost AI is working…" : "Describe the system you want to design…"}
            aria-label="Message Ghost AI"
            aria-invalid={sendError ? true : undefined}
            aria-describedby="ai-chat-hint"
            rows={3}
            className="max-h-40 min-h-[72px] resize-none rounded-xl bg-elevated pr-12 dark:bg-elevated"
          />
          <Hint label={isBusy ? "Ghost AI is working" : "Send (Enter)"} side="top">
            <Button
              type="submit"
              size="icon-sm"
              disabled={!draft.trim() || !canSend}
              aria-label={isBusy ? "Ghost AI is working" : isSending ? "Sending" : "Send message"}
              className="absolute right-2 bottom-2 bg-ai text-white hover:bg-ai/85"
            >
              {isBusy || isSending ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
            </Button>
          </Hint>
        </div>
        <p
          id="ai-chat-hint"
          role={sendError ? "alert" : undefined}
          className={cn("mt-1.5 text-[11px]", sendError ? "text-state-error" : "text-copy-faint")}
        >
          {sendError ?? "Enter to send · Shift+Enter for a new line"}
        </p>
      </form>
    </>
  )
}

const ACTIVE_STAGES = new Set<AiStatusMessage["stage"]>(["started", "thinking", "applying"])

// Compact strip above the input, shown only while a run is active: the newest status, never the history.
function AiStatus({ status }: { status: AiStatusMessage | null }) {
  // The newest message can still be the previous run's "complete" while a new run starts.
  const text = status && ACTIVE_STAGES.has(status.stage) ? status.text : "Ghost AI is working…"
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex shrink-0 items-center gap-2 border-t border-surface-border bg-ai-dim/40 px-3 py-2 text-xs text-ai-text"
    >
      <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
      <span className="min-w-0 truncate">{text}</span>
    </div>
  )
}
