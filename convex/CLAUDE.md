# Convex instructions

The authoritative project instructions are [`../AGENTS.md`](../AGENTS.md).

Before editing this directory, also read
[`_generated/ai/guidelines.md`](./_generated/ai/guidelines.md). Those generated,
version-current Convex rules override remembered APIs and generic examples.

The non-negotiable local rules are:

- validate every function's arguments and return value
- derive user ownership from authenticated identity, never a client argument
- verify ownership on direct reads and every write
- use indexes for predicates and pagination for every potentially growing list
- use internal functions unless a client genuinely needs a public API
- test unauthenticated and cross-identity denial paths with `convex-test`
- run `pnpm lint`, `pnpm typecheck`, and `pnpm test:once`
- run `pnpm codegen` when a development deployment is linked

See [`projects.ts`](./projects.ts) and [`projects.test.ts`](./projects.test.ts)
for the starter's reference implementation.
