# Authentication Guide

Complete guide to authentication in the AI Starter Kit using Clerk + Convex.

The kit wires the code. Finish Clerk once with the **Clerk CLI** (recommended)
or the Dashboard fallback. Prefer the CLI so agents and humans share one path.

---

## Overview

This starter uses **Clerk** for hosted authentication and **Convex** for
backend identity via Clerk JWTs.

- Email/password and social providers (configured in Clerk)
- Session management (Clerk)
- Protected routes (TanStack Router `beforeLoad` + Clerk server auth)
- Backend identity via `ctx.auth.getUserIdentity()`

Official references:

- [Clerk CLI for agents](https://clerk.com/cli/agents.txt)
- [Clerk CLI docs](https://clerk.com/docs/cli)
- [Convex & Clerk](https://docs.convex.dev/auth/clerk)
- [Clerk ↔ Convex integration](https://clerk.com/docs/guides/development/integrations/databases/convex)

---

## How It Works

### Architecture

```
User → Clerk SignIn/SignUp → Clerk session cookie
                ↓
      ConvexProviderWithClerk fetches Clerk JWT
                ↓
      Convex validates JWT (auth.config.ts)
                ↓
      ctx.auth.getUserIdentity() returns claims
```

### Configuration Files

- `convex/auth.config.ts` - Clerk JWT issuer domain
- `convex/auth.ts` - `getCurrentUser` helper query
- `app/routes/__root.tsx` - `ClerkProvider`
- `app/ConvexClientProvider.tsx` - `ConvexProviderWithClerk`
- `app/start.ts` - TanStack Start entry with `clerkMiddleware()` (session wiring)
- `app/routes/_authenticated/route.tsx` - shared `beforeLoad` + server `auth()` gate
- `app/routes/_authenticated/dashboard.tsx` - protected dashboard page
- `app/routes/login.$.tsx` - Clerk `<SignIn />` (splat for multi-step paths)
- `app/routes/signup.$.tsx` - Clerk `<SignUp />` (splat for multi-step paths)

### Environment Variables Required

```bash
# In .env.local
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_SIGN_IN_URL=/login
VITE_CLERK_SIGN_UP_URL=/signup
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# In Convex (aubx convex env set)
CLERK_JWT_ISSUER_DOMAIN=https://verb-noun-00.clerk.accounts.dev
```

`CLERK_JWT_ISSUER_DOMAIN` is the Clerk Frontend API URL from the Convex
integration page (same value Clerk sometimes labels "Frontend API").

---

## Finish Setup with the Clerk CLI (recommended)

Do this once per new project cloned from the kit. The code already expects
these values. Prefer the CLI over copying keys from the Dashboard
([Clerk CLI agents guide](https://clerk.com/cli/agents.txt)).

This kit already includes Clerk providers, middleware, and `/login` +
`/signup` routes. **Do not run `clerk init`** in a clone of this starter; it
would fight those files. Use `./scripts/setup-clerk-auth.sh` instead (also
invoked from `./setup.sh` and `aubr setup:clerk`).

### 1. Authenticate the Clerk CLI (once per machine)

```bash
aubx clerk@latest auth login
aubx clerk@latest whoami
```

Use a normal terminal with a browser for the OAuth step. After that, agents
and scripts can create apps and pull keys without pasting secrets.

### 2. Run the kit's Clerk setup script

Convex should already be linked (`aubx convex dev --until-success` or
`./setup.sh`). Then:

```bash
./scripts/setup-clerk-auth.sh
# or
aubr setup:clerk
```

Optional flags:

```bash
./scripts/setup-clerk-auth.sh --app-name "my-app-dev"
./scripts/setup-clerk-auth.sh --app app_xxxxxxxx   # agent mode / existing app
```

What the script does (idempotent):

1. Ensures kit route defaults in `.env.local` (`/login`, `/signup`, `/dashboard`)
2. Creates or links a Clerk application when keys are missing
3. Runs `clerk env pull` into `.env.local`
4. Creates the Clerk JWT template named `convex` when missing
5. Sets `CLERK_JWT_ISSUER_DOMAIN` on Convex from the Frontend API URL

`CLERK_JWT_ISSUER_DOMAIN` is what `convex/auth.config.ts` uses with
`applicationID: "convex"`. Without it, Clerk login can succeed while Convex
still sees the user as unauthenticated.

### 3. Sync Convex and start the app

```bash
aubx convex dev
aubr dev
```

### 4. Verify end to end

1. Open [http://localhost:3000/signup](http://localhost:3000/signup).
2. Create a user.
3. Confirm you land on `/dashboard`.
4. Sign out completely, then sign in again at `/login` (old sessions can lack
   the Convex JWT template).
5. Confirm Convex auth via `useConvexAuth()` or `api.auth.getCurrentUser`.

### Agent path

Coding agents should run the same script. If the CLI is not logged in, stop
and ask the human to run `aubx clerk@latest auth login`. Pass `--app` when
agent mode cannot pick an application. See
`.agents/skills/setup-starter-kit/SKILL.md`.

---

## Dashboard fallback (manual)

Use this only when the Clerk CLI is unavailable.

### 1. Create a Clerk account (if needed)

Open [https://dashboard.clerk.com/sign-up](https://dashboard.clerk.com/sign-up).

### 2. Create a Clerk application

Open [https://dashboard.clerk.com/apps/new](https://dashboard.clerk.com/apps/new).

### 3. Copy API keys into `.env.local`

[https://dashboard.clerk.com/last-active?path=api-keys](https://dashboard.clerk.com/last-active?path=api-keys)

| Clerk Dashboard label | Put in `.env.local` as |
| --- | --- |
| Publishable key (`pk_test_…` or `pk_live_…`) | `VITE_CLERK_PUBLISHABLE_KEY` |
| Secret key (`sk_test_…` or `sk_live_…`) | `CLERK_SECRET_KEY` |

Keep the kit route defaults from `.env.example`.

### 4. Turn on the Convex integration

[https://dashboard.clerk.com/apps/setup/convex](https://dashboard.clerk.com/apps/setup/convex)

Copy the **Frontend API URL**, then:

```bash
aubx convex env set CLERK_JWT_ISSUER_DOMAIN https://verb-noun-00.clerk.accounts.dev
```

### 5. Allow local development URLs in Clerk

| Purpose | Local URL |
| --- | --- |
| App home | `http://localhost:3000` |
| Sign-in | `http://localhost:3000/login` |
| Sign-up | `http://localhost:3000/signup` |
| After auth | `http://localhost:3000/dashboard` |

### Clerk URL cheat sheet

| Task | URL |
| --- | --- |
| Clerk CLI docs | https://clerk.com/docs/cli |
| Clerk CLI agents guide | https://clerk.com/cli/agents.txt |
| Sign up for Clerk | https://dashboard.clerk.com/sign-up |
| Create an application | https://dashboard.clerk.com/apps/new |
| API keys (publishable + secret) | https://dashboard.clerk.com/last-active?path=api-keys |
| Enable Convex JWT / copy Frontend API URL | https://dashboard.clerk.com/apps/setup/convex |
| Convex docs for this stack | https://docs.convex.dev/auth/clerk |
| Clerk’s Convex guide | https://clerk.com/docs/guides/development/integrations/databases/convex |

---

## Using Authentication

### Sign Up / Sign In

Use the kit routes `/signup` and `/login`, or Clerk components:

```tsx
import { SignIn, SignUp } from "@clerk/tanstack-react-start";

<SignIn routing="path" path="/login" signUpUrl="/signup" />
<SignUp routing="path" path="/signup" signInUrl="/login" />
```

### Sign Out

```tsx
import { useClerk } from "@clerk/tanstack-react-start";

const { signOut } = useClerk();
await signOut({ redirectUrl: "/" });
```

### Client User State

```tsx
import { useUser } from "@clerk/tanstack-react-start";
import { useConvexAuth } from "convex/react";

const { isSignedIn, user } = useUser();
const { isAuthenticated } = useConvexAuth();
```

Prefer `useConvexAuth()` when deciding whether Convex-authenticated UI can
render.

### Backend Identity

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myData = query({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    // identity.subject, identity.email, identity.name, identity.pictureUrl
    return null;
  },
});
```

Or use the shared helper:

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const user = useQuery(api.auth.getCurrentUser);
```

---

## Protected Routes

`/dashboard` is gated by a TanStack Router `beforeLoad` function in
`app/routes/_authenticated/dashboard.tsx`. That function calls a server function which uses
`auth()` from `@clerk/tanstack-react-start/server` to check the current user;
if absent, the route throws a redirect to `/login`. `app/start.ts` runs
`clerkMiddleware()` so Clerk session state is available on the request; it does
not duplicate route auth checks.

Backend data access must still check `ctx.auth.getUserIdentity()` (or call
`api.auth.getCurrentUser`) inside Convex functions.

---

## Clerk MCP

The kit includes Clerk's MCP server in `.mcp.json`:

```json
"clerk": {
  "url": "https://mcp.clerk.com/mcp"
}
```

Install globally with `clerk mcp install`, or add the URL in Cursor Settings →
Tools & MCP. Useful tools: `clerk_sdk_snippet`, `list_clerk_sdk_snippets`.

---

## Common Issues

### Convex says no auth provider matched the token

1. Confirm Convex is activated at
   https://dashboard.clerk.com/apps/setup/convex
2. Confirm `CLERK_JWT_ISSUER_DOMAIN` matches the Frontend API URL on that page
3. Sign out completely and sign back in (old tokens may lack the Convex
   template)

### Dashboard redirects to sign-in after login

1. Check Clerk keys in `.env.local` from
   https://dashboard.clerk.com/last-active?path=api-keys
2. Confirm sign-in/sign-up URLs match `/login` and `/signup`
3. Confirm `auth.config.ts` was synced with `aubx convex dev`

### Clerk session works but Convex identity is null

Clerk cookies can be valid while Convex still rejects the JWT. Re-check step 4
above, then do a full Clerk sign-out and sign-in.

### Build needs Clerk keys

Local production builds expect Clerk env vars. Placeholder `pk_test_…` /
`sk_test_…` values are enough to compile. Real keys are required for live auth.

---

## What this kit does not include (yet)

- Clerk → Convex user table sync / webhooks
- Custom email/password forms (uses Clerk hosted components)
