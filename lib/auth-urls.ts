// Our own sign-in/up pages. The env vars can override them; the fallbacks keep a deploy without
// those vars on our pages instead of Clerk's hosted Account Portal.
export const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in"
export const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up"
