import { Lock } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

// Shown for projects that don't exist or that the user can't access. One
// message for both, so the page doesn't reveal which project IDs exist.
export function AccessDenied() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <Lock className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-medium">You don’t have access to this project</h1>
      <p className="max-w-md text-muted-foreground">
        It may have been deleted, or the owner hasn’t shared it with you.
      </p>
      <Button className="mt-2" render={<Link href="/editor" />} nativeButton={false}>
        Back to projects
      </Button>
    </div>
  )
}
