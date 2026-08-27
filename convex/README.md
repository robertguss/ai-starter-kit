# Convex backend

This directory contains Web App Starter Kit's schema, authenticated functions,
HTTP routes, and backend tests.

Before changing Convex code:

1. Read [`_generated/ai/guidelines.md`](./_generated/ai/guidelines.md) for the
   version-current API rules.
2. Read the repository [`AGENTS.md`](../AGENTS.md) for this starter's ownership,
   validation, pagination, and verification requirements.
3. Use [`projects.ts`](./projects.ts) and
   [`projects.test.ts`](./projects.test.ts) as the reference for indexed
   owner-scoped data and negative authorization tests.

Useful commands:

```bash
pnpm dev:backend
pnpm codegen
pnpm test:once
pnpm lint
```

`pnpm codegen` and `pnpm dev:backend` require a linked Convex development
deployment. Do not deploy to production merely to generate local types.

Documentation: <https://docs.convex.dev/>.
