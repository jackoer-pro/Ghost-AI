"use client"

import { Download, FileText, Loader2, Sparkles } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Hint } from "@/components/hint"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAiRun } from "@/hooks/use-ai-run"
import { fetchJson } from "@/lib/fetch-json"
import type { SpecSummary } from "@/lib/specs"
import { cn } from "@/lib/utils"

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })

const downloadUrl = (projectId: string, specId: string) => `/api/projects/${projectId}/specs/${specId}/download`

// Specs tab: generate a spec from the canvas + chat, list the project's specs, preview and download them.
export function SpecsPanel({ roomId }: { roomId: string }) {
  const projectId = roomId // room ID = project ID
  const [specs, setSpecs] = useState<SpecSummary[] | null>(null)
  const [listError, setListError] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [preview, setPreview] = useState<SpecSummary | null>(null)

  const loadSpecs = useCallback(async () => {
    try {
      const res = await fetchJson<{ specs: SpecSummary[] }>(`/api/projects/${projectId}/specs`)
      setSpecs(res?.specs ?? [])
      setListError(false)
    } catch {
      setListError(true)
    }
  }, [projectId])

  useEffect(() => {
    void loadSpecs() // eslint-disable-line react-hooks/set-state-in-effect -- fetching on mount is the point
  }, [loadSpecs])

  useAiRun(runId, (run) => {
    setRunId(null)
    if (run.status === "COMPLETED") void loadSpecs()
    else setRunError("Couldn't generate the spec. Make sure the canvas has components, then try again.")
  })

  async function generate() {
    setIsStarting(true)
    setRunError(null)
    try {
      const res = await fetchJson<{ runId: string }>("/api/ai/spec", { method: "POST", body: { roomId } })
      if (res) setRunId(res.runId)
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Couldn't start spec generation.")
    } finally {
      setIsStarting(false)
    }
  }

  const isGenerating = isStarting || runId !== null

  return (
    <div className="flex flex-col gap-3">
      <Button className="w-full bg-ai text-white hover:bg-ai/85" onClick={() => void generate()} disabled={isGenerating}>
        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {isGenerating ? "Generating spec…" : "Generate Spec"}
      </Button>
      {runError && (
        <p role="alert" className="text-xs text-state-error">
          {runError}
        </p>
      )}

      {listError ? (
        <p role="alert" className="text-sm text-copy-muted">
          Couldn&apos;t load specs.{" "}
          <button type="button" onClick={() => void loadSpecs()} className="text-ai-text underline-offset-2 hover:underline">
            Try again
          </button>
        </p>
      ) : specs === null ? (
        <p className="flex items-center gap-2 text-sm text-copy-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading specs…
        </p>
      ) : specs.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-copy-muted">
          No specs yet. Sketch a design on the canvas, then generate a spec from it.
        </p>
      ) : (
        <ul aria-label="Specs" className="flex flex-col gap-2">
          {specs.map((spec) => (
            <li key={spec.id} className="flex items-center gap-1 rounded-xl border border-surface-border bg-elevated pr-1">
              <button
                type="button"
                onClick={() => setPreview(spec)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2.5 text-left outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ai-dim">
                  <FileText className="size-4 text-ai-text" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-copy-primary">{spec.filename}</span>
                  <time dateTime={spec.createdAt} className="block text-xs text-copy-muted">
                    {dateFormat.format(new Date(spec.createdAt))}
                  </time>
                </span>
              </button>
              <DownloadLink projectId={projectId} spec={spec} />
            </li>
          ))}
        </ul>
      )}

      <SpecPreview projectId={projectId} spec={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

// A plain link: the route answers with Content-Disposition: attachment, so the browser downloads it.
function DownloadLink({ projectId, spec }: { projectId: string; spec: SpecSummary }) {
  return (
    <Hint label="Download" side="left">
      <a
        href={downloadUrl(projectId, spec.id)}
        download={spec.filename}
        aria-label={`Download ${spec.filename}`}
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
      >
        <Download className="size-4" />
      </a>
    </Hint>
  )
}

type PreviewState = { status: "loading" } | { status: "error" } | { status: "ready"; markdown: string }

// Modal preview. Content is fetched through the download route each time (never straight from Blob,
// never kept after closing). Esc and the close button close it (Base UI Dialog).
function SpecPreview({ projectId, spec, onClose }: { projectId: string; spec: SpecSummary | null; onClose: () => void }) {
  const [state, setState] = useState<PreviewState>({ status: "loading" })
  const specId = spec?.id

  useEffect(() => {
    if (!specId) return
    let cancelled = false
    setState({ status: "loading" }) // eslint-disable-line react-hooks/set-state-in-effect -- reset for the new spec
    fetch(downloadUrl(projectId, specId))
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((markdown) => !cancelled && setState({ status: "ready", markdown }))
      .catch(() => !cancelled && setState({ status: "error" }))
    return () => {
      cancelled = true
    }
  }, [projectId, specId])

  return (
    <Dialog open={spec !== null} onOpenChange={(open) => !open && onClose()}>
      {/* A fixed height, not max-h: ScrollArea's viewport is `size-full`, which needs a definite parent
          height. With only max-h, 100% resolved to the content height and the spec overflowed the dialog,
          covering the Download button. */}
      <DialogContent className="flex h-[85dvh] flex-col gap-4 rounded-3xl border border-surface-border bg-elevated p-6 sm:max-w-3xl">
        <DialogHeader className="pr-8">
          <DialogTitle className="truncate">{spec?.filename ?? "Spec"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1 rounded-xl border border-surface-border bg-base">
          <div className="p-4">
            {state.status === "loading" && (
              <p className="flex items-center gap-2 text-sm text-copy-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading spec…
              </p>
            )}
            {state.status === "error" && (
              <p role="alert" className="text-sm text-state-error">
                Couldn&apos;t load this spec. Close and try again.
              </p>
            )}
            {state.status === "ready" && (
              // react-markdown never renders raw HTML, so AI or prompt-injected content can't inject markup.
              <div className={markdownClass}>
                <Markdown remarkPlugins={[remarkGfm]}>{state.markdown}</Markdown>
              </div>
            )}
          </div>
        </ScrollArea>
        {spec && (
          <div className="flex justify-end">
            <a
              href={downloadUrl(projectId, spec.id)}
              download={spec.filename}
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Download className="size-4" />
              Download
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Markdown styling with plain utilities (no typography plugin installed).
const markdownClass = cn(
  "space-y-3 text-sm leading-relaxed text-copy-primary break-words",
  "[&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-medium",
  "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
  "[&_a]:text-ai-text [&_a]:underline [&_strong]:font-semibold",
  "[&_code]:rounded [&_code]:bg-subtle [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em]",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-subtle [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:block [&_table]:overflow-x-auto [&_table]:text-xs [&_td]:border [&_td]:border-surface-border [&_td]:px-2 [&_td]:py-1",
  "[&_th]:border [&_th]:border-surface-border [&_th]:bg-subtle [&_th]:px-2 [&_th]:py-1 [&_th]:text-left",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-surface-border [&_blockquote]:pl-3 [&_blockquote]:text-copy-muted"
)
