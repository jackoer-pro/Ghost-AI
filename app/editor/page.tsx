import { Suspense } from "react"

import { EditorHomeShell } from "@/components/editor/editor-home-shell"
import { getEditorProjects } from "@/lib/project-data"

async function EditorHomeWithProjects() {
  const { owned, shared } = await getEditorProjects()
  return <EditorHomeShell owned={owned} shared={shared} />
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
