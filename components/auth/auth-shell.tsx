import { Check, Ghost } from "lucide-react"

const features = [
  "Describe a system in plain English",
  "AI maps it onto a shared canvas",
  "Refine the architecture with your team in real time",
  "Generate a Markdown technical spec from the graph",
]

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    // minmax(0,1fr): grid columns default to min-width:auto, which let Clerk's
    // card push the page wider than a phone screen.
    <div className="grid min-h-dvh flex-1 grid-cols-[minmax(0,1fr)] bg-base lg:grid-cols-2">
      <section className="hidden flex-col justify-center gap-8 border-r border-surface-border bg-surface px-16 lg:flex">
        <div className="flex items-center gap-2 text-copy-primary">
          <Ghost className="size-5 text-brand" aria-hidden />
          <span className="font-semibold">Ghost AI</span>
        </div>
        <div className="flex max-w-sm flex-col gap-5">
          <h1 className="text-2xl font-semibold text-balance text-copy-primary">
            System design, drafted by AI and refined together.
          </h1>
          <ul className="flex flex-col gap-3 text-sm text-copy-secondary">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-accent-dim">
                  <Check className="size-3 text-brand" aria-hidden />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="flex min-w-0 items-center justify-center p-4 sm:p-6">
        {children}
      </section>
    </div>
  )
}
