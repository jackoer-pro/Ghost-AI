import { cn } from "@/lib/utils"

interface RoleBadgeProps {
  isOwner: boolean
  className?: string
}

// Owner = brand accent; collaborator = neutral. Used in the navbar and share dialog.
export function RoleBadge({ isOwner, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-xl px-2 py-0.5 text-xs font-medium",
        isOwner ? "bg-accent-dim text-brand" : "bg-subtle text-copy-secondary",
        className
      )}
    >
      {isOwner ? "Owner" : "Collaborator"}
    </span>
  )
}
