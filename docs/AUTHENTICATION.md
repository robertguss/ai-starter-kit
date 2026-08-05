# Authentication Guide

Complete guide to authentication in the AI Starter Kit using Clerk + Convex.

---

## Overview

This starter uses **Clerk** for hosted authentication and **Convex** for
backend identity via Clerk JWTs.

- Email/password and social providers (configured in the Clerk Dashboard)
- Session management (Clerk)
- Protected routes (`proxy.ts` + `auth.protect()`)
- Backend identity via `ctx.auth.getUserIdentity()`

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
- `proxy.ts` - `clerkMiddleware` early redirect for `/dashboard`
- `app/dashboard/layout.tsx` - resource-level `auth.protect()`
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

`CLERK_JWT_ISSUER_DOMAIN` is the Clerk Frontend API URL from
https://dashboard.clerk.com/apps/setup/convex.

---

## One-Time Clerk Dashboard Setup

1. Create an application at https://dashboard.clerk.com/apps/new
2. Open https://dashboard.clerk.com/apps/setup/convex and activate Convex
3. Copy the Frontend API URL into Convex as `CLERK_JWT_ISSUER_DOMAIN`
4. Copy publishable and secret keys into `.env.local`
5. Run `bunx convex dev` so Convex picks up `auth.config.ts`
6. Sign out completely and sign back in after enabling the JWT template
7. Confirm Convex sees the user (`useConvexAuth()` authenticated,
   `getCurrentUser` non-null)

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

`/dashboard` is protected in two places:

1. `proxy.ts` early redirect for signed-out users (performance UX)
2. `app/dashboard/layout.tsx` `auth.protect()` (resource guarantee)

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

1. Confirm the Convex integration is active in Clerk
2. Confirm `CLERK_JWT_ISSUER_DOMAIN` matches the Frontend API URL
3. Sign out completely and sign back in (old tokens may lack the Convex
   template)

### Dashboard redirects to sign-in after login

1. Check Clerk keys in `.env.local`
2. Confirm sign-in/sign-up URLs match `/login` and `/signup`
3. Confirm `auth.config.ts` was synced with `bunx convex dev`

### Build needs Clerk keys

Local production builds expect Clerk env vars. Placeholder `pk_test_…` /
`sk_test_…` values are enough to compile. Real keys are required for live auth.

---

## What this kit does not include (yet)

- Clerk → Convex user table sync / webhooks
- Custom email/password forms (uses Clerk hosted components)
