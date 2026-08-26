# Roadmap

Web App Starter Kit stays intentionally lean. Roadmap items are opt-in
production capabilities, not a promise to bundle every SaaS concern into the
base template.

## Foundation complete

- [x] Next.js App Router + Vercel deployment path
- [x] Clerk + Convex JWT authentication
- [x] Owner-scoped CRUD and authorization tests
- [x] Strict TypeScript, linting, formatting, and local pre-commit checks
- [x] Sentry, Vercel Analytics, and Speed Insights
- [x] Playwright smoke tests and Convex unit/authz tests
- [x] Security headers, strict CSP, error boundaries, and health endpoints

## High-value next work

These improve the starter without forcing a product model:

- [ ] Document and automate a Convex backup/restore drill
- [ ] Add a production launch-readiness runbook with rollback verification
- [ ] Add an optional authenticated Clerk Playwright fixture using a dedicated
      test instance and user
- [ ] Add accessibility checks to the smoke suite
- [ ] Add a dependency-update policy and release checklist (without imposing CI)

## Product-driven recipes

Add these as documented recipes or separate examples when a real application
needs them:

- [ ] Clerk Organizations and organization-scoped Convex authorization
- [ ] Clerk webhook user sync with signature verification and idempotency
- [ ] Stripe billing and entitlement state
- [ ] Transactional email
- [ ] Convex file storage and upload authorization
- [ ] Rate limiting for public/expensive operations
- [ ] Append-only audit events for compliance-sensitive products
- [ ] Internationalization and locale routing
- [ ] Durable workflows for multi-step operations
- [ ] Product analytics beyond Vercel's web analytics

## Explicit non-goals for the base kit

- Alternative databases, ORMs, API layers, routers, or state stores
- A generic admin panel, CMS, billing portal, or organization model
- Preconfigured feature flags, search, queues, or workflow engines
- Bundled component libraries beyond the primitives the starter actually uses
- GitHub Actions or a prescribed CI provider

Each addition should come with a concrete use case, ownership model, negative
authorization tests, operational failure handling, and removal of any obsolete
alternative.
