# Web App Starter Kit

A lean, production-oriented TypeScript starter for applications deployed on
Vercel. It combines **Next.js App Router**, **Convex**, **Clerk**, **Tailwind
CSS**, and **shadcn/ui** without preloading a SaaS application's product
decisions into the foundation.

## What ships

- Next.js App Router with React Server Components and typed routes
- Clerk resource-based authentication with a strict nonce-based CSP
- Convex realtime data, schema validation, indexed pagination, and Clerk JWTs
- A real owner-scoped projects CRUD feature—not a static dashboard mock
- Sentry errors/tracing, Vercel Analytics, and Vercel Speed Insights
- Security headers, health endpoints, error boundaries, and dark mode
- Strict TypeScript, ESLint, Prettier, Husky, and lint-staged
- Vitest + convex-test authorization tests and Playwright Chromium smoke tests
- Node.js 24 and pnpm 11, pinned through repository metadata

The starter deliberately omits billing, organizations, email, uploads, audit
logs, feature flags, workflows, and admin tooling. Add those only when the
product requires them; see
[Optional production capabilities](#optional-production-capabilities).

## Quick start

### Prerequisites

- Node.js **24.x**
- pnpm **11.x**
- Clerk and Convex accounts

```bash
git clone https://github.com/robertguss/web-app-starter-kit.git
cd web-app-starter-kit
./setup.sh
```

The setup script installs dependencies, links a Convex project, creates or links
a Clerk app, creates the `convex` JWT template, configures the Clerk issuer on
Convex, and starts both development servers.

For an agent or a non-interactive environment:

```bash
./setup.sh --yes --no-dev --clerk-app app_xxx
```

Use `--skip-convex` or `--skip-clerk` to defer either external setup step.

### Manual setup

```bash
pnpm install --frozen-lockfile
pnpm exec convex dev --until-success
pnpm dlx clerk@latest auth login
pnpm setup:clerk
pnpm dev
```

Do **not** run `clerk init`: this repository already owns its providers,
middleware, auth routes, and environment conventions.

Useful Clerk dashboard links:

- Create an app: <https://dashboard.clerk.com/apps/new>
- API keys: <https://dashboard.clerk.com/last-active?path=api-keys>
- Convex integration: <https://dashboard.clerk.com/apps/setup/convex>

After enabling the Convex JWT template for the first time, sign out completely
and sign in again so Clerk issues a session with the new template.

## Architecture

```text
Browser
  ├─ Next.js App Router on Vercel
  │    ├─ ClerkProvider + resource-level auth protection
  │    ├─ proxy.ts auth context + nonce CSP
  │    ├─ Server Components for public/authenticated shells
  │    └─ Sentry + Vercel web telemetry
  └─ ConvexReactClient
       └─ Clerk "convex" JWT
            └─ Convex queries and mutations
                 └─ ownerId = identity.tokenIdentifier
```

### Authentication and authorization

Authentication and authorization are separate layers:

1. [`proxy.ts`](./proxy.ts) initializes Clerk's request context and nonce CSP;
   it does not authorize resources by pathname.
2. The dashboard layout and page protect their resources directly with
   `await auth.protect()`.
3. Every project function calls `ctx.auth.getUserIdentity()` and derives
   ownership from `identity.tokenIdentifier`.
4. No public Convex function accepts an owner/user ID from the client.
5. Cross-owner reads, updates, and deletes return the same not-found error so
   callers cannot enumerate records.

Clerk's ESLint rule treats resources as protected by default and explicitly
exempts only the public landing, auth, and health routes. It prevents future App
Router pages, route handlers, or Server Functions from omitting their own auth
check.

The strict Clerk CSP uses per-request nonces for substantially stronger script
injection protection. Keep the Convex and Sentry `connect-src` entries in
`proxy.ts` when customizing the policy.

### Projects reference feature

The projects vertical slice demonstrates the patterns expected of production
features:

- schema and compound owner/update index in `convex/schema.ts`
- argument and return validators on every Convex function
- bounded paginated reads—no unbounded table scans
- server-side trimming and length validation with structured `ConvexError`s
- accessible create/edit/delete UI with optimistic realtime refresh
- client errors captured by Sentry without sending default PII
- tests with two identities proving owner isolation

Copy the security shape, not necessarily the project domain model.

## Commands

| Command              | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `pnpm dev`           | Run Next.js and Convex together               |
| `pnpm dev:frontend`  | Run Next.js only                              |
| `pnpm dev:backend`   | Run Convex only                               |
| `pnpm build`         | Create a production Next.js build             |
| `pnpm lint`          | Run ESLint with zero warnings allowed         |
| `pnpm typecheck`     | Run TypeScript without emitting               |
| `pnpm test:once`     | Run unit/backend tests once                   |
| `pnpm test:e2e`      | Run Playwright Chromium smoke tests           |
| `pnpm test:coverage` | Run Vitest with coverage                      |
| `pnpm check`         | Format, lint, typecheck, unit, and setup test |
| `pnpm codegen`       | Regenerate Convex types (linked project)      |
| `pnpm setup:clerk`   | Configure Clerk + Convex JWT auth             |

Install the Playwright browser once on a new machine:

```bash
pnpm exec playwright install chromium
```

The checked-in smoke suite covers the public page, health route, signed-out
dashboard redirect, Clerk sign-in page, and 404. Authenticated end-to-end tests
should use a dedicated Clerk test instance and test user; backend authorization
is already tested deterministically with `convex-test`.

Local browser tests load `.env.local` with Next.js semantics and fail fast when
Clerk is not configured. To test a configured preview instead, set
`PLAYWRIGHT_BASE_URL`; Playwright will not start a local server in that mode.

## Environment variables

Start with [`.env.example`](./.env.example). Important boundaries:

- `NEXT_PUBLIC_*` values are shipped to the browser; never put secrets there.
- `CLERK_SECRET_KEY`, `SENTRY_AUTH_TOKEN`, and `CONVEX_DEPLOY_KEY` are secrets.
- `CLERK_JWT_ISSUER_DOMAIN` lives in each Convex deployment, not `.env.local`.
- Scope development, preview, and production credentials separately.
- `CLERK_AUTHORIZED_PARTIES` is optional, but when set it must include every
  legitimate local, preview, and production origin.

Sentry remains disabled when `NEXT_PUBLIC_SENTRY_DSN` is absent. Source maps are
uploaded only when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are
all present during the build. Default PII collection and Session Replay are off;
production tracing samples 10% of transactions.

## Deploying to Vercel

1. Import the repository at <https://vercel.com/new>. Vercel detects Next.js and
   pnpm from `package.json` and `pnpm-lock.yaml`.
2. Create a Convex production deploy key with `deployment:deploy` permission and
   set it as `CONVEX_DEPLOY_KEY` in Vercel's **Production** environment.
3. Set the Vercel build command to:

   ```bash
   pnpm exec convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'pnpm build'
   ```

4. Configure the production Clerk keys and set the production Clerk Frontend API
   URL as `CLERK_JWT_ISSUER_DOMAIN` on the Convex production deployment.
5. Configure a real production domain in Clerk. Do not treat a generated
   `*.vercel.app` hostname as the long-term authentication origin.
6. Add the optional Sentry variables from `.env.example` to enable monitoring
   and source maps. Vercel Analytics and Speed Insights need no application
   secrets.
7. For isolated preview data, create a separate Convex **preview** deploy key
   scoped to Vercel's Preview environment. Never point previews at production
   data by convenience.

Current Convex deployment guidance:
<https://docs.convex.dev/production/hosting/vercel>.

### Production launch checklist

- Use separate Clerk and Convex development/preview/production environments.
- Verify signed-out redirects and sign-in/up redirects on the production domain.
- Exercise one create/read/update/delete flow as two different users.
- Configure Sentry alert routing and test a non-sensitive synthetic error.
- Enable and rehearse Convex backups before storing irreplaceable data.
- Add rate limiting before exposing abuse-prone mutations, actions, or webhooks.
- Define data retention, deletion, and migration runbooks for the product.
- Review CSP additions instead of weakening or disabling the policy.
- Run `pnpm check`, `pnpm build`, and `pnpm test:e2e` before release.
- Monitor `/api/health`, Convex health, Web Vitals, and server/client errors.

## Optional production capabilities

Add capabilities in response to a concrete product requirement:

| Need                        | Recommended direction                                          |
| --------------------------- | -------------------------------------------------------------- |
| B2B tenancy                 | Clerk Organizations plus org-scoped Convex authorization tests |
| App-owned user profiles     | Clerk webhooks with signature verification and idempotency     |
| Billing                     | Stripe with webhook-driven entitlement state                   |
| Transactional email         | Resend or Postmark from a Convex action                        |
| File uploads                | Convex file storage with owner-scoped metadata                 |
| Abuse protection            | `@convex-dev/rate-limiter` at server trust boundaries          |
| Compliance/audit history    | Append-only, actor-attributed Convex audit events              |
| Product analytics           | PostHog only if Vercel's web analytics is insufficient         |
| Internationalization        | `next-intl` once multiple locales are committed                |
| Complex forms               | React Hook Form when native state is no longer maintainable    |
| Long-running business flows | `@convex-dev/workflow` when durable orchestration is required  |

Avoid adding Redux, React Query, tRPC, Axios, Prisma, or a second database by
default. Next.js and Convex already own the corresponding state, transport, API,
and persistence concerns. A second abstraction should solve a measured problem
rather than duplicate the stack.

## Repository layout

```text
app/                  Next.js routes, layouts, errors, and health endpoint
components/           Application and shadcn/ui components
convex/               Schema, authenticated functions, and backend tests
e2e/                  Playwright smoke tests
lib/                  Framework-neutral utilities and tests
scripts/              Idempotent setup and wiring checks
proxy.ts              Clerk request context and nonce-based CSP
instrumentation*.ts   Sentry server, edge, and browser instrumentation
```

## License

[MIT](./LICENSE)
