Set up the realtime collaboration infrastructure using Liveblocks.

## Configuration

Configure the `liveblocks.config.ts` at the project root.

Define:

### Presence

- cursor position
- `thinking` boolean (named `thinking`, not `isThinking`, to match specs 19 and 24, which read it)

### UserMeta

- user ID
- display name
- avatar URL
- cursor color

## Liveblocks Client

Create a cached Liveblocks node client in `lib`.

Add a helper that deterministically maps a user ID to a consistent color from a fixed palette.

## Auth Route

Create `POST /api/liveblocks-auth`.

Use the project ID as the Liveblocks room ID.

This route must:

1. require Clerk authentication
2. verify project access using the existing access helper
3. ensure the Liveblocks room exists (create only if needed)
4. return a session token with:
   - user name
   - avatar
   - generated cursor color

Return `403` for unauthorized project access.

## Dependencies

`@liveblocks/client` and `@liveblocks/react` were already installed; `@liveblocks/node` (server SDK for auth and rooms) was not and was added at the same version (3.25.2).

The server needs `LIVEBLOCKS_SECRET_KEY` (starts with `sk_`) in `.env.local`.

## Check When Done

- `liveblocks.config.ts` defines Presence and UserMeta
- Liveblocks client is cached
- auth route verifies project access
- user metadata is attached to sessions
- `npm run build` passes
