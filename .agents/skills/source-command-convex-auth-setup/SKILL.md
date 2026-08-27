---
name: source-command-convex-auth-setup
description: Set up or extend Clerk authentication and owner authorization in this Next.js and Convex starter.
---

# Clerk + Convex auth in this project

## Existing architecture

- `app/layout.tsx` installs Clerk's Next.js provider.
- `components/app-providers.tsx` passes Clerk's `useAuth` to Convex.
- `proxy.ts` initializes Clerk request auth and creates a strict nonce-based
  CSP; it does not authorize resources by pathname.
- Dashboard layouts and pages protect themselves with `await auth.protect()`.
- Clerk's ESLint rule requires auth protection on future server resources
  unless their folder is explicitly public.
- `/sign-in` and `/sign-up` include catch-all pages for Clerk's multi-step flows.
- `convex/auth.config.ts` validates the Clerk JWT template named `convex`.
- `convex/projects.ts` is the authorization reference implementation.

Route protection is not data authorization. Every public Convex function that
reads or writes private data must enforce identity and ownership itself.

## Canonical ownership pattern

For simple user-owned data, derive the owner key from the Clerk identity:

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new ConvexError({
    code: "UNAUTHENTICATED",
    message: "You must be signed in.",
  });
}

const ownerId = identity.tokenIdentifier;
```

Never accept `ownerId`, `userId`, or another identity field from a public
function argument. On direct reads, updates, and deletes, load the document and
compare its `ownerId` to the derived value before returning or mutating it. Use
the same not-found response for missing and another user's documents to avoid
resource enumeration.

Do not add a users table merely to mirror Clerk. Add app-owned user records only
when the product needs profile fields, relationships, lifecycle sync, or roles;
then verify signed Clerk webhooks and make processing idempotent.

## Setup

Use the repository setup path; do not run `clerk init`:

```bash
pnpm exec convex dev --until-success
pnpm dlx clerk@latest auth login
pnpm setup:clerk
```

The script writes `NEXT_PUBLIC_CLERK_*` values, creates the `convex` JWT
template, and sets `CLERK_JWT_ISSUER_DOMAIN` on the linked Convex deployment.
Dashboard links:

- <https://dashboard.clerk.com/last-active?path=api-keys>
- <https://dashboard.clerk.com/apps/setup/convex>

Sign out completely and sign in again after first creating the JWT template.

## Verification

For every owner-scoped feature:

1. Seed records through the real mutation as owner A and owner B.
2. Prove each owner list returns only that owner's rows.
3. Prove owner B cannot directly read, update, or delete owner A's ID.
4. Prove unauthenticated callers cannot use any private operation.
5. Run `pnpm lint`, `pnpm typecheck`, and `pnpm test:once`.

Use `useConvexAuth()` for client UI readiness. Use Clerk hooks/components for
display and account controls; do not add a public Convex “current user” query
unless the application genuinely owns user data that Clerk does not provide.
