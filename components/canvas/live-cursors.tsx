"use client"

import { useAuth } from "@clerk/nextjs"
import { useOthers } from "@liveblocks/react/suspense"
import { useStore, ViewportPortal } from "@xyflow/react"

// Other participants' pointers. Positions are flow coordinates (see the canvas onMouseMove), so a
// cursor points at the same spot of the diagram whatever each viewer's pan and zoom.
export function LiveCursors() {
  const { userId } = useAuth()
  const others = useOthers()
  const zoom = useStore((state) => state.transform[2])

  return (
    <ViewportPortal>
      {others.map(({ connectionId, id, info, presence }) => {
        // useOthers already skips this tab; also skip the current user's other tabs.
        if (!presence.cursor || id === userId) return null
        return (
          <div
            key={connectionId}
            aria-hidden
            // The portal is zoomed with the canvas; undo that so the pointer stays the same size on screen.
            // z-index above selected nodes, which React Flow lifts to 1000.
            className="pointer-events-none absolute top-0 left-0 z-[1001] origin-top-left"
            style={{ transform: `translate(${presence.cursor.x}px, ${presence.cursor.y}px) scale(${1 / zoom})` }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" className="drop-shadow" style={{ color: info.color }}>
              <path d="M1 1 L16 7.5 L9 9 L7.5 16 Z" fill="currentColor" stroke="var(--bg-base)" strokeWidth="1.25" strokeLinejoin="round" />
            </svg>
            <span
              style={{ backgroundColor: info.color }}
              className="absolute top-4 left-3.5 max-w-40 truncate rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap text-bg-base"
            >
              {info.name}
            </span>
          </div>
        )
      })}
    </ViewportPortal>
  )
}
