import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"

async function RedirectByAuth(): Promise<never> {
  const { userId } = await auth()
  redirect(userId ? "/editor" : "/sign-in")
}

export default function Home() {
  return (
    <Suspense>
      <RedirectByAuth />
    </Suspense>
  )
}
