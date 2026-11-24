"use client"

import { useAuth, UserButton } from "@clerk/nextjs"
import { ClientSideSuspense, shallow, useOthers } from "@liveblocks/react/suspense"

import { collaboratorsOf, initials } from "@/lib/presence"

const MAX_AVATARS = 5
// Same box as the collaborator avatars, so the group reads as one row.
const userButtonAppearance = { elements: { avatarBox: "size-7" } }

// Top-right of the canvas: other people in the room, then the current user's own Clerk button.
// The button sits outside the Suspense boundary so it's there while the room is still connecting.
export function PresenceAvatars() {
  return (
    <div className="absolute top-3 right-3 z-30 flex items-center gap-2 rounded-full border border-surface-border bg-surface/85 p-1 backdrop-blur">
      <ClientSideSuspense fallback={null}>
        <Collaborators />
      </ClientSideSuspense>
      <UserButton appearance={userButtonAppearance} />
    </div>
  )
}

type CollaboratorInfo = Liveblocks["UserMeta"]["info"]

function Collaborators() {
  const { userId } = useAuth()
  // Select only `info`: it's fixed per connection, while each `other` object is rebuilt on every cursor
  // move, so this list doesn't re-render while people move their pointers.
  const people = useOthers((others) => collaboratorsOf(others, userId).map((other) => other.info), shallow)
  if (people.length === 0) return null

  const shown = people.slice(0, MAX_AVATARS)
  const hidden = people.length - shown.length
  const label = `${people.length} ${people.length === 1 ? "collaborator" : "collaborators"} here`

  return (
    <>
      <ul aria-label={label} className="flex -space-x-2">
        {shown.map((person, i) => (
          <li key={i}>
            <CollaboratorAvatar person={person} />
          </li>
        ))}
        {hidden > 0 && (
          <li>
            <span
              title={people.slice(MAX_AVATARS).map((p) => p.name).join(", ")}
              className="flex size-7 items-center justify-center rounded-full bg-subtle text-[11px] font-medium text-copy-secondary ring-2 ring-surface"
            >
              +{hidden}
            </span>
          </li>
        )}
      </ul>
      <div aria-hidden className="h-5 w-px bg-surface-border" />
    </>
  )
}

// Display only: no button, no menu. The ring in the bar's color separates overlapping avatars on the dark canvas.
function CollaboratorAvatar({ person }: { person: CollaboratorInfo }) {
  const ring = "size-7 rounded-full ring-2 ring-surface"
  return person.avatar ? (
    // Small Clerk avatar; next/image optimization isn't worth a remote-image config here.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.avatar} alt={person.name} title={person.name} className={`${ring} object-cover`} />
  ) : (
    <span
      role="img"
      aria-label={person.name}
      title={person.name}
      // Initials on the person's cursor color, so the avatar matches their pointer on the canvas.
      style={{ backgroundColor: person.color }}
      className={`${ring} flex items-center justify-center text-[11px] font-semibold text-bg-base`}
    >
      {initials(person.name)}
    </span>
  )
}
