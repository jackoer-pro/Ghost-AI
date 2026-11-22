import { redirect } from "next/navigation"
import { Suspense } from "react"

import { EditorShell } from "@/components/editor/editor-shell"
import { getCurrentIdentity } from "@/lib/project-access"
import { getEditorProjects } from "@/lib/project-data"

async function EditorHomeWithProjects() {
  const identity = await getCurrentIdentity()
  if (!identity) redirect("/sign-in")
  const { owned, shared } = await getEditorProjects(identity)
  return <EditorShell owned={owned} shared={shared} />
}

// Server component: projects are loaded here, not fetched on the client.
// Suspense is required because cacheComponents treats auth()/DB reads as dynamic.
export default function EditorPage() {
  return (
    <Suspense>
      <EditorHomeWithProjects />
    </Suspense>
  )
}
