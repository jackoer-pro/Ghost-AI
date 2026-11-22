import { redirect } from "next/navigation"
import { Suspense } from "react"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorShell } from "@/components/editor/editor-shell"
import { getCurrentIdentity, getProjectForUser } from "@/lib/project-access"
import { getEditorProjects } from "@/lib/project-data"

async function Workspace({ params }: PageProps<"/editor/[roomId]">) {
  const identity = await getCurrentIdentity()
  if (!identity) redirect("/sign-in")

  const { roomId } = await params
  const [project, { owned, shared }] = await Promise.all([
    getProjectForUser(roomId, identity),
    getEditorProjects(identity),
  ])
  if (!project) return <AccessDenied />

  return <EditorShell owned={owned} shared={shared} project={project} />
}

// Server component: access is checked before anything renders.
export default function WorkspacePage(props: PageProps<"/editor/[roomId]">) {
  return (
    <Suspense>
      <Workspace {...props} />
    </Suspense>
  )
}
