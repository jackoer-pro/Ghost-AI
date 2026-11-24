import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { signInUrl, signUpUrl } from "@/lib/auth-urls"

const isPublicRoute = createRouteMatcher([`${signInUrl}(.*)`, `${signUpUrl}(.*)`])
// API handlers check auth themselves so they can answer 401/403 as JSON;
// auth.protect() would answer API calls with a redirect or 404 instead.
const isApiRoute = createRouteMatcher(["/api(.*)"])

// signInUrl/signUpUrl passed explicitly: without them, auth.protect() redirects to Clerk's hosted
// Account Portal whenever NEXT_PUBLIC_CLERK_SIGN_IN_URL isn't set (e.g. on Vercel).
export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req) && !isApiRoute(req)) await auth.protect()
  },
  { signInUrl, signUpUrl }
)

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
