# Authentication Guide

Complete guide to authentication in the AI Starter Kit using Clerk + Convex.

The kit wires the code. You still finish setup once in the Clerk Dashboard
(create an app, copy keys, turn on the Convex JWT template).

---

## Overview

This starter uses **Clerk** for hosted authentication and **Convex** for
backend identity via Clerk JWTs.

- Email/password and social providers (configured in the Clerk Dashboard)
- Session management (Clerk)
- Protected routes (`proxy.ts` + `auth.protect()`)
- Backend identity via `ctx.auth.getUserIdentity()`

Official references:

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
- `app/layout.tsx` - `ClerkProvider`
- `app/ConvexClientProvider.tsx` - `ConvexProviderWithClerk`
- `proxy.ts` - bare `clerkMiddleware()` (session wiring)
- `app/dashboard/layout.tsx` - `auth.protect()` page gate
- `app/login/[[...sign-in]]/page.tsx` - Clerk `<SignIn />`
- `app/signup/[[...sign-up]]/page.tsx` - Clerk `<SignUp />`

### Environment Variables Required

```bash
# In .env.local
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# In Convex (bunx convex env set)
CLERK_JWT_ISSUER_DOMAIN=https://verb-noun-00.clerk.accounts.dev
```

`CLERK_JWT_ISSUER_DOMAIN` is the Clerk Frontend API URL from the Convex
integration page (same value Clerk sometimes labels "Frontend API").

---

## Finish Setup in the Clerk UI

Do this once per new project cloned from the kit. The code already expects
these values.

### 1. Create a Clerk account (if needed)

Open [https://dashboard.clerk.com/sign-up](https://dashboard.clerk.com/sign-up)
and create an account.

### 2. Create a Clerk application

Open [https://dashboard.clerk.com/apps/new](https://dashboard.clerk.com/apps/new).

1. Name the application (for example `my-app-dev`).
2. Choose sign-in options you want for local development (email/password is
   enough to start).
3. Create the application.

### 3. Copy API keys into `.env.local`

Open the API keys page for the active app:

[https://dashboard.clerk.com/last-active?path=api-keys](https://dashboard.clerk.com/last-active?path=api-keys)

Or navigate: Clerk Dashboard → your application → **Configure** → **API keys**.

Copy:

| Clerk Dashboard label | Put in `.env.local` as |
| --- | --- |
| Publishable key (`pk_test_…` or `pk_live_…`) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Secret key (`sk_test_…` or `sk_live_…`) | `CLERK_SECRET_KEY` |

Also keep the kit route defaults (already in `.env.example`):

```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

### 4. Turn on the Convex integration (required)

Open the Clerk Convex setup page:

[https://dashboard.clerk.com/apps/setup/convex](https://dashboard.clerk.com/apps/setup/convex)

Or navigate: Clerk Dashboard → your application → **Configure** →
**Integrations** → **Convex** (or the Convex setup deep link above).

1. Activate / enable the Convex integration if it is not already on.
2. Copy the **Frontend API URL** shown on that page.
   - Development looks like `https://verb-noun-00.clerk.accounts.dev`
   - Production custom domains look like `https://clerk.your-domain.com`
3. Set it on your Convex deployment:

```bash
bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://verb-noun-00.clerk.accounts.dev
```

This value is what `convex/auth.config.ts` uses with `applicationID: "convex"`.
Without this step, Clerk login can succeed while Convex still sees the user as
unauthenticated.

### 5. Allow local development URLs in Clerk

In the Clerk Dashboard, open your application’s path / URL settings
(**Configure** → **Paths**, or the account portal / domains settings for your
Clerk version) and ensure development can reach:

| Purpose | Local URL |
| --- | --- |
| App home | `http://localhost:3000` |
| Sign-in | `http://localhost:3000/login` |
| Sign-up | `http://localhost:3000/signup` |
| After auth | `http://localhost:3000/dashboard` |

If Clerk shows allowlists for redirect URLs or origins, add
`http://localhost:3000` and the paths above.

### 6. Sync Convex auth config

With your Convex project linked:

```bash
bunx convex dev
```

Leave it running so `auth.config.ts` stays synced. Then start the app:

```bash
bun run dev
```

### 7. Verify end to end

1. Open [http://localhost:3000/signup](http://localhost:3000/signup).
2. Create a user in the Clerk UI.
3. Confirm you land on `/dashboard`.
4. Sign out completely from Clerk, then sign in again at `/login`.
   Do this especially right after enabling the Convex JWT template. Old
   sessions can keep a token Convex rejects.
5. Confirm Convex auth:
   - Prefer `useConvexAuth()` showing authenticated in the app.
   - Or call `api.auth.getCurrentUser` and confirm it returns
     `{ subject, name, email, image? }` rather than `null`.

### Clerk UI URL cheat sheet

| Task | URL |
| --- | --- |
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
import { SignIn, SignUp } from "@clerk/nextjs";

<SignIn routing="path" path="/login" signUpUrl="/signup" />
<SignUp routing="path" path="/signup" signInUrl="/login" />
```

### Sign Out

```tsx
import { useClerk } from "@clerk/nextjs";

const { signOut } = useClerk();
await signOut({ redirectUrl: "/" });
```

### Client User State

```tsx
import { useUser } from "@clerk/nextjs";
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

`/dashboard` is gated by `auth.protect()` in `app/dashboard/layout.tsx`.
`proxy.ts` runs bare `clerkMiddleware()` so Clerk session state is available;
it does not duplicate route auth checks.

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
3. Confirm `auth.config.ts` was synced with `bunx convex dev`

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
