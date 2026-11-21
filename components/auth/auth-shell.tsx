import { Ghost } from "lucide-react"

const features = [
  "Describe a system in plain English",
  "AI maps it onto a shared canvas",
  "Refine the architecture with your team in real time",
  "Generate a Markdown technical spec from the graph",
]

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-2">
      <section className="hidden flex-col justify-center gap-8 border-r border-border bg-card px-16 lg:flex">
        <div className="flex items-center gap-2 text-foreground">
          <Ghost className="size-5 text-accent-primary" />
          <span className="font-semibold">Ghost AI</span>
        </div>
        <div className="flex max-w-sm flex-col gap-4">
          <h1 className="text-2xl font-semibold text-foreground">
            System design, drafted by AI and refined together.
          </h1>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        {children}
      </section>
    </div>
  )
}
