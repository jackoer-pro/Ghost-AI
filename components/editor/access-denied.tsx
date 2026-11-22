import { Lock } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

// Shown for projects that don't exist or that the user can't access. One
// message for both, so the page doesn't reveal which project IDs exist.
export function AccessDenied() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-base px-4 text-center">
      <div className="mb-1 flex size-14 items-center justify-center rounded-2xl border border-surface-border bg-surface">
        <Lock className="size-8 text-copy-muted" aria-hidden />
      </div>
      <h1 className="text-xl font-medium text-balance text-copy-primary">You don’t have access to this project</h1>
      <p className="max-w-md text-balance text-copy-muted">
        It may have been deleted, or the owner hasn’t shared it with you.
      </p>
      <Button className="mt-2" render={<Link href="/editor" />} nativeButton={false}>
        Back to projects
      </Button>
    </div>
  )
}
