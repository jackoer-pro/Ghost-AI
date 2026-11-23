"use client"

import { useUser } from "@clerk/nextjs"
import { Check, Link2, Lock, UserPlus, X } from "lucide-react"
import type { FormEvent } from "react"

import { RoleBadge } from "@/components/editor/role-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ShareDialogState } from "@/hooks/use-share-dialog"
import type { PersonView } from "@/lib/projects"

interface ShareDialogProps {
  share: ShareDialogState
  projectName: string
  /** Owners can invite and remove; collaborators only see the list. */
  isOwner: boolean
}

export function ShareDialog({ share: s, projectName, isOwner }: ShareDialogProps) {
  const myEmail = useUser().user?.primaryEmailAddress?.emailAddress.toLowerCase()

  const onInvite = (event: FormEvent) => {
    event.preventDefault()
    void s.invite()
  }

  return (
    <Dialog open={s.isOpen} onOpenChange={s.setIsOpen}>
      <DialogContent className="gap-5 rounded-3xl border border-surface-border bg-elevated p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">Share “{projectName}”</DialogTitle>
          <DialogDescription className="text-copy-muted">
            {isOwner
              ? "Invite people by email. Collaborators can open and edit this project."
              : "You can view who has access to this project."}
          </DialogDescription>
        </DialogHeader>

        {isOwner ? (
          <form onSubmit={onInvite} className="flex gap-2">
            <Input
              type="email"
              aria-label="Collaborator email"
              placeholder="name@example.com"
              value={s.email}
              onChange={(e) => s.setEmail(e.target.value)}
              disabled={s.busy === "invite"}
              className="h-9 rounded-xl"
            />
            <Button type="submit" className="h-9 rounded-xl" disabled={!s.email.trim() || s.busy === "invite"}>
              <UserPlus />
              {s.busy === "invite" ? "Inviting…" : "Invite"}
            </Button>
          </form>
        ) : (
          <p className="flex items-center gap-2 rounded-xl bg-subtle px-3 py-2 text-xs text-copy-secondary">
            <Lock className="size-4 shrink-0 text-copy-muted" aria-hidden />
            Only the owner can invite or remove people.
          </p>
        )}

        {s.error && (
          <p role="alert" className="-mt-2 text-sm text-destructive">
            {s.error}
          </p>
        )}

        <section aria-label="People with access" className="grid gap-2">
          <h3 className="text-xs font-medium tracking-wide text-copy-muted uppercase">
            People with access
          </h3>
          {s.collaborators === null ? (
            // A failed load shows the error above instead of an endless skeleton.
            !s.error && <ul className="grid gap-1" aria-busy>
              {[0, 1].map((i) => (
                <li key={i} className="flex items-center gap-3 px-2 py-1.5">
                  <span className="size-8 animate-pulse rounded-full bg-subtle" />
                  <span className="h-3 w-40 animate-pulse rounded-xl bg-subtle" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="-mx-2 grid max-h-72 gap-0.5 overflow-y-auto">
              {s.owner && (
                <PersonRow person={s.owner} isMe={s.owner.email?.toLowerCase() === myEmail}>
                  <RoleBadge isOwner />
                </PersonRow>
              )}
              {s.collaborators.map((c) => (
                <PersonRow key={c.id} person={c} isMe={c.email === myEmail}>
                  {isOwner ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void s.remove(c.id)}
                      disabled={s.busy === c.id}
                      aria-label={`Remove ${c.name ?? c.email}`}
                      className="hover:text-destructive"
                    >
                      <X className="size-5" />
                    </Button>
                  ) : (
                    <RoleBadge isOwner={false} />
                  )}
                </PersonRow>
              ))}
              {s.collaborators.length === 0 && (
                <li className="px-2 py-3 text-copy-muted">
                  {isOwner ? "No collaborators yet. Invite someone above." : "No other collaborators."}
                </li>
              )}
            </ul>
          )}
        </section>

        <div className="-mx-6 -mb-6 flex items-center justify-between gap-3 rounded-b-3xl border-t border-surface-border bg-surface px-6 py-4">
          <p className="text-xs text-copy-muted">People need access before the link works.</p>
          <Button variant="outline" className="rounded-xl" onClick={() => void s.copyLink()}>
            {s.copied ? <Check className="text-state-success" /> : <Link2 />}
            {s.copied ? "Copied!" : "Copy link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface PersonRowProps {
  person: PersonView
  isMe: boolean
  children: React.ReactNode
}

function PersonRow({ person, isMe, children }: PersonRowProps) {
  const label = person.name ?? person.email ?? "Unknown user"
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-subtle">
      {person.imageUrl ? (
        // Small Clerk avatar; next/image optimization isn't worth a remote-image config here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.imageUrl} alt="" className="size-8 shrink-0 rounded-full" />
      ) : (
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-medium text-copy-secondary uppercase"
        >
          {label[0]}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-copy-primary">
          {label}
          {isMe && <span className="text-copy-muted"> (you)</span>}
        </p>
        {person.name && person.email && (
          <p className="truncate text-xs text-copy-muted">{person.email}</p>
        )}
      </div>
      {children}
    </li>
  )
}
