---
name: source-command-convex-auth-setup
description: "Set up or extend authentication patterns in this Convex + Clerk project"
---

# Convex + Clerk Auth Setup (This Project)

This project uses **Clerk** with Convex JWT validation. Use this guide when
implementing auth flows, access control, or user management.

## Architecture

- **Backend**: `convex/auth.config.ts` validates Clerk JWTs via
  `CLERK_JWT_ISSUER_DOMAIN`
- **Helpers**: `convex/auth.ts` exposes `getCurrentUser` from
  `ctx.auth.getUserIdentity()`
- **Frontend**: `ClerkProvider` + `ConvexProviderWithClerk` /
  `useAuth` from `@clerk/nextjs`
- **Route protection**: `proxy.ts` (`clerkMiddleware`) plus
  `auth.protect()` in `app/dashboard/layout.tsx`
- **UI**: Clerk `<SignIn />` / `<SignUp />` at `/login` and `/signup`

## Getting the Current User

Prefer `ctx.auth.getUserIdentity()` in Convex functions, or the shared query:

```typescript
import { api } from "./_generated/api";

// Client
const user = useQuery(api.auth.getCurrentUser);
```

```typescript
import { query } from "./_generated/server";

export const myQuery = query({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    // identity.subject, identity.email, identity.name, identity.pictureUrl
  },
});
```

## Custom Authenticated Functions

```typescript
import {
  customQuery,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";

async function requireIdentity(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return { ctx: { ...ctx, identity }, args };
  },
});

export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return { ctx: { ...ctx, identity }, args };
  },
});
```

## Clerk Dashboard Checklist

1. Create a Clerk application
2. Enable Convex at https://dashboard.clerk.com/apps/setup/convex
3. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`
4. Set `bunx convex env set CLERK_JWT_ISSUER_DOMAIN <Frontend API URL>`
5. Sign out and back in after activating the Convex JWT template
6. Verify with `useConvexAuth()` and a protected query

## Rules

1. Read `convex/auth.ts` and `app/ConvexClientProvider.tsx` before changing auth
2. Use `ctx.auth.getUserIdentity()` (or `api.auth.getCurrentUser`) for identity
3. Do not reintroduce Better Auth, auth proxy routes, or
   `NEXT_PUBLIC_CONVEX_SITE_URL` for session auth
