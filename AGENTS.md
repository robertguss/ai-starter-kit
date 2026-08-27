# AGENTS.md

## Project

Web App Starter Kit is a production-oriented Next.js App Router starter for
Vercel with React 19, Convex, Clerk, TypeScript, Tailwind CSS, shadcn/ui,
Sentry, Vercel Analytics, and Playwright.

Use **pnpm** exclusively. The supported runtime is **Node.js 24.x**.

## Commands

```bash
pnpm dev               # Next.js + Convex
pnpm dev:frontend      # Next.js only
pnpm dev:backend       # Convex only
pnpm build             # production Next.js build
pnpm check             # formatting, lint, types, unit tests, setup wiring
pnpm test:once         # Vitest + convex-test
pnpm test:e2e          # Playwright Chromium smoke tests
pnpm codegen           # Convex codegen; requires a linked deployment
pnpm setup:clerk       # idempotent Clerk + Convex JWT setup
```

Fresh non-interactive setup:

```bash
./setup.sh --yes --no-dev
./setup.sh --yes --no-dev --clerk-app app_xxx
```

## Architecture

- `app/`: App Router pages, layouts, route handlers, and error boundaries
- `components/`: application components and only the shadcn primitives in use
- `convex/`: schema, queries/mutations, auth config, and backend tests
- `e2e/`: Playwright browser smoke tests
- `proxy.ts`: Clerk request context and strict content security policy
- `instrumentation*.ts`, `sentry.*.config.ts`: Sentry setup
- `scripts/`: setup automation and offline wiring checks

### Authentication

- `ClerkProvider` lives in `app/layout.tsx` and sets `dynamic` so the strict
  nonce CSP from `proxy.ts` can be applied to the document.
- `ConvexProviderWithClerk` lives in `components/app-providers.tsx` and is
  skipped when `NEXT_PUBLIC_CONVEX_URL` is unset, so public routes still render.
- `/sign-in` and `/sign-up` use Clerk optional catch-all routes under
  `app/(auth)`.
- `proxy.ts` initializes Clerk request auth, a nonce CSP, and
  `createRouteMatcher(["/dashboard(.*)"])` authorization.
- The dashboard layout is the RSC fallback with `await auth.protect()`. Nested
  dashboard pages inherit that layout and must not repeat the call.
- Convex public functions use `authedQuery` / `authedMutation` in
  `convex/lib/functions.ts`. Those wrappers put `ownerId` from
  `identity.tokenIdentifier` on `ctx`. Never trust a route guard as data
  authorization.
- Convex validates Clerk JWTs in `convex/auth.config.ts` using the template
  named `convex` with audience `convex`.

### Data ownership

- Derive owner identity from `ctx.auth.getUserIdentity()` and use the canonical
  `identity.tokenIdentifier`.
- Never accept a user/owner ID argument for authorization.
- Check ownership on direct reads and every update/delete.
- Prefer non-enumerating not-found responses for another user's records.
- Test as at least two identities and include negative cross-user cases.

## Convex rules

Before editing `convex/`, read `convex/_generated/ai/guidelines.md`; it
overrides memorized API behavior.

- Use object-form functions with `args` and `returns` validators.
- Public `query`/`mutation`/`action` functions are Internet-facing. Use internal
  functions unless a client actually calls them.
- Use indexes for query predicates. Never use `.filter()` as a database WHERE.
- Never use unbounded `.collect()` on a growing table; paginate or take a bound.
- Use `v.id(table)` for document IDs and structured `ConvexError` data for
  expected client errors.
- Keep external I/O in actions; queries and mutations are transactional.
- Run `pnpm test:once`, `pnpm typecheck`, and Convex codegen/dev validation when
  a deployment is configured.

Convex generated files are committed. If codegen cannot run because the clone
has no linked deployment, state that limitation; do not create an external
deployment without approval.

## Frontend rules

- Prefer Server Components. Add `"use client"` only at an interaction/provider
  boundary.
- Keep authentication in Clerk and realtime application data in Convex.
- Use Next.js `Link`, metadata APIs, route handlers, and error conventions.
- Add shadcn components through `pnpm dlx shadcn@latest add <component>` and
  keep only components the application uses.
- Use Lucide icons; do not add a second icon library.
- Preserve accessible labels, keyboard behavior, loading/empty/error states, and
  destructive-action confirmation.
- Capture unexpected client failures in Sentry, but do not enable default PII or
  Session Replay without an explicit privacy decision.

## Environment and setup

- Browser-visible values use `NEXT_PUBLIC_*`; never expose secrets with that
  prefix.
- `.env.local` and secret files must remain uncommitted.
- `CLERK_JWT_ISSUER_DOMAIN` is a Convex deployment variable.
- Do not run `clerk init`; use `pnpm setup:clerk` (`scripts/setup-clerk-auth.sh`
  wraps `scripts/setup-clerk-auth.mjs`).
- The setup script must remain idempotent and Node 24-safe. Never print full
  secret values.
- Development, preview, and production must use separate Clerk/Convex
  credentials and data.

## Verification

For application changes, run the narrowest relevant check followed by
`pnpm check`. For framework/shared changes, also run `pnpm build` and
`pnpm test:e2e`. Browser claims require an executed DOM/accessibility check and
an inspected screenshot for affected UI states.

The project runs GitHub Actions on pull requests and `main` (`pnpm check` plus a
high-severity audit). Do not remove `.github/workflows/ci.yml` without an
explicit replacement.

## Deployment

Vercel is the target. The production build command is:

```bash
pnpm exec convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'pnpm build'
```

It requires a scoped `CONVEX_DEPLOY_KEY`. Do not deploy, mutate production data,
or change shared external configuration without explicit approval.
