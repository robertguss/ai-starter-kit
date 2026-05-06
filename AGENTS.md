# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in
this repository.

## Project Overview

This is a Next.js 16 starter kit with Convex backend and Better Auth
authentication. The stack includes:

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS 4, shadcn/ui
  components
- **Backend**: Convex (real-time database and serverless functions)
- **Auth**: Better Auth with Convex integration (email/password, no verification
  required)
- **UI**: shadcn/ui (New York style) with Lucide icons

## Development Commands

### Starting Development

```bash
bun run dev
# Runs both frontend and backend in parallel:
# - Next.js dev server with Turbo (localhost:3000)
# - Convex dev server (convex dev)
```

### Individual Services

```bash
bun run dev:frontend    # Next.js only
bun run dev:backend     # Convex only
bun run predev          # Convex dev until success, then open dashboard
```

### Build and Lint

```bash
bun run build           # Build Next.js for production
bun run lint            # Run ESLint
```

### Testing

```bash
bun run test            # Run tests in watch mode
bun run test:once       # Run tests once
bun run test:debug      # Debug tests with inspector
bun run test:coverage   # Run tests with coverage report
```

### Convex Management

```bash
bunx convex dev                              # Start Convex dev mode
bunx convex dashboard                        # Open Convex dashboard
bunx convex env set KEY value                # Set environment variable
bunx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)  # Generate auth secret
bunx convex env set SITE_URL http://localhost:3000                  # Set site URL
bunx convex codegen                          # Generate TypeScript types (required before running tests)
```

## Architecture

### Authentication Flow

**Better Auth + Convex Integration**: This project uses Better Auth with the
Convex plugin, which stores auth data directly in Convex tables managed by a
component.

1. **Backend (convex/auth.ts)**:
   - `authComponent`: Client for the Better Auth Convex component
   - `createAuth()`: Factory function that creates Better Auth instance
   - Validates `SITE_URL` and `BETTER_AUTH_SECRET` environment variables
   - Email/password auth enabled with `requireEmailVerification: false`

2. **Frontend (lib/auth-client.ts)**:
   - Creates auth client with `convexClient()` plugin
   - Used throughout React components for auth operations

3. **Provider (app/ConvexClientProvider.tsx)**:
   - Wraps app with `ConvexBetterAuthProvider`
   - Convex client configured with `expectAuth: true` (pauses queries until
     authenticated)

4. **HTTP Routes (convex/http.ts)**:
   - Auth routes registered via `authComponent.registerRoutes(http, createAuth)`
   - Available at `/api/auth/*` endpoints

5. **Middleware (middleware.ts)**:
   - Protects `/dashboard` routes
   - Validates session by calling `/api/auth/get-session`
   - Redirects to `/login` with `redirect` query param if unauthenticated

### Directory Structure

```text
/app                        # Next.js App Router pages
  /api/auth/[...all]       # Auth proxy route (forwards to Convex)
  /dashboard               # Protected dashboard pages
  /login                   # Login page
  /signup                  # Signup page
  ConvexClientProvider.tsx # Convex + Better Auth provider
  layout.tsx               # Root layout
  page.tsx                 # Home page

/components                # React components
  /ui                      # shadcn/ui components
  app-sidebar.tsx          # Main app sidebar
  login-form.tsx           # Login form
  signup-form.tsx          # Signup form
  data-table.tsx           # Reusable data table
  [other components]

/convex                    # Convex backend
  /_generated              # Auto-generated Convex code
  auth.config.ts           # Better Auth configuration
  auth.ts                  # Auth setup and helper functions
  http.ts                  # HTTP router (registers auth routes)
  schema.ts                # Database schema
  test.setup.ts            # Test configuration for convex-test
  convex.config.ts         # Convex configuration

/lib                       # Shared utilities
  auth-client.ts           # Better Auth React client
  utils.ts                 # Utility functions (cn, etc.)

/hooks                     # React hooks
  use-mobile.ts            # Mobile detection hook

middleware.ts              # Next.js middleware (route protection)
```

### Convex Function Patterns

This project follows the new Convex function syntax with validators. See
`convex/AGENTS.md` for comprehensive Convex guidelines. Key patterns:

**Always use argument and return validators**:

```typescript
export const myQuery = query({
  args: { id: v.id("tableName") },
  returns: v.object({ name: v.string() }),
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

**Function types and visibility**:

- `query`, `mutation`, `action` - Public functions (part of API)
- `internalQuery`, `internalMutation`, `internalAction` - Private functions
  (only callable by other Convex functions)

**Calling functions**:

- Import from `api` for public functions: `api.myModule.myFunction`
- Import from `internal` for internal functions:
  `internal.myModule.privateFunction`
- Use `ctx.runQuery()`, `ctx.runMutation()`, `ctx.runAction()` to call functions

**Getting current user**:

```typescript
const user = await authComponent.getAuthUser(ctx);
```

### Environment Variables

**Convex (set via `bunx convex env set`)**:

- `BETTER_AUTH_SECRET` - Auth encryption secret (generate with
  `openssl rand -base64 32`)
- `SITE_URL` - Site URL (e.g., `http://localhost:3000`)

**Next.js (.env.local)**:

- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL (auto-created by
  `bunx convex dev`)
- `NEXT_PUBLIC_CONVEX_SITE_URL` - Convex HTTP endpoint for auth proxy (MUST be
  manually added)
  - **CRITICAL**: Must end in `.convex.site` (e.g.,
    `https://your-deployment.convex.site`)
  - **DO NOT** set this to `localhost:3000` - it will cause infinite loops and
    500 errors
  - Used by `app/api/auth/[...all]/route.ts` to proxy auth requests to Convex

### shadcn/ui Configuration

- Style: `new-york`
- TypeScript: Enabled
- Path aliases: `@/components`, `@/lib`, `@/hooks`, etc.
- Base color: neutral
- CSS variables: Enabled
- Icon library: Lucide

Add components via:

```bash
bunx shadcn@latest add [component-name]
```

## Convex Guidelines

See **`convex/AGENTS.md`** for comprehensive Convex development rules covering
argument validation, async handling, authentication, custom functions, error
handling, schema design, query optimization, pagination, and more.

See also **`docs/CONVEX_BEST_PRACTICES.md`** for additional best practices.

## Convex Helpers Library

This project includes **convex-helpers** (v0.1.108) for utility functions and
common patterns. Always prefer these helpers over custom implementations.

**Key Categories:**

- **Relationships**: `getOneFromOrThrow`, `getManyFrom`, `getManyViaOrThrow` -
  traverse database relationships
- **Validators**: `nullable`, `literals`, `partial`, `brandedString` - enhanced
  validators beyond standard `v.*`
- **Custom Functions**: `customQuery`, `customMutation` - add auth, RLS, or
  custom context to all functions
- **Pagination**: `getPage`, `paginator`, `stream` - advanced pagination
  patterns
- **Utilities**: `asyncMap`, `pick`, `omit`, `nullThrows`, `withoutSystemFields`
- **React**: Enhanced `useQuery` with status, query caching, session tracking

See **`docs/CONVEX_HELPERS.md`** for comprehensive documentation, import paths,
and examples.

## Authentication Notes

- Email/password authentication is enabled without email verification (for quick
  setup)
- Session validation happens via `/api/auth/get-session` endpoint
- Protected routes use middleware to check session and redirect to `/login` if
  unauthenticated
- Auth data is stored in Convex via the Better Auth component (not in separate
  auth tables you manage)
- **Auth Proxy**: The `app/api/auth/[...all]/route.ts` file proxies all auth
  requests to Convex via `NEXT_PUBLIC_CONVEX_SITE_URL`
  - If you see 500 errors with ~10 second timeouts on `/api/auth/*`, check that
    `NEXT_PUBLIC_CONVEX_SITE_URL` is set correctly (must be `.convex.site`, NOT
    `localhost:3000`)

## Testing Convex Functions

This project uses **Vitest** with **convex-test** for testing Convex functions.
Tests run in an isolated mock environment that closely mimics the Convex
backend.

### Key Testing Concepts

**Test File Location**: Place test files in the `convex/` directory with a
`.test.ts` extension (e.g., `todos.test.ts`)

**Test Setup**: Always import the test setup configuration:

```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

it("should test something", async () => {
  const t = convexTest(schema, modules);
  // Your test code here
});
```

**Important Testing Rules**:

1. **Always use `modules`**: Import `{ modules }` from `"./test.setup"` and pass
   it to `convexTest(schema, modules)`
2. **Fresh instances**: Create a new `convexTest(schema, modules)` instance in
   each test for isolation
3. **Run codegen first**: Tests require `bunx convex codegen` to be run first to
   generate the `_generated` directory

### Testing Patterns

**Testing Queries**:

```typescript
it("should query data", async () => {
  const t = convexTest(schema, modules);
  const result = await t.query(api.myModule.listItems, { count: 10 });
  expect(result).toEqual([]);
});
```

**Testing Mutations**:

```typescript
it("should insert data", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.myModule.createItem, { name: "test" });

  // Verify with direct database access
  const items = await t.run(async (ctx) => {
    return await ctx.db.query("items").collect();
  });

  expect(items).toHaveLength(1);
  expect(items[0].name).toBe("test");
});
```

**Testing Actions**:

```typescript
it("should perform action", async () => {
  const t = convexTest(schema, modules);
  await t.action(api.myModule.myAction, { input: "test" });

  // Verify side effects
  const items = await t.run(async (ctx) => {
    return await ctx.db.query("items").collect();
  });

  expect(items).toHaveLength(1);
});
```

**Testing with Authentication**:

```typescript
it("should work with authenticated user", async () => {
  const t = convexTest(schema, modules);
  const asUser = t.withIdentity({ subject: "user123", name: "Test User" });

  const result = await asUser.query(api.myModule.listItems, { count: 10 });
  expect(result).toEqual([]);
});
```

**Direct Database Access** (for setup/verification):

```typescript
it("should access database directly", async () => {
  const t = convexTest(schema, modules);

  // Insert data directly
  await t.run(async (ctx) => {
    await ctx.db.insert("tableName", { field: "value" });
  });

  // Query data directly
  const data = await t.run(async (ctx) => {
    return await ctx.db.query("tableName").collect();
  });

  expect(data).toHaveLength(1);
});
```

### Common Testing Mistakes to Avoid

1. **❌ Forgetting to import modules**:

   ```typescript
   const t = convexTest(schema); // WRONG - will fail to find _generated
   ```

   ```typescript
   const t = convexTest(schema, modules); // CORRECT
   ```

2. **❌ Reusing test instances across tests**:

   ```typescript
   // WRONG - shared state between tests
   const t = convexTest(schema, modules);
   it("test 1", async () => {
     await t.mutation(...);
   });
   it("test 2", async () => {
     await t.query(...); // May see data from test 1
   });
   ```

   ```typescript
   // CORRECT - fresh instance per test
   it("test 1", async () => {
     const t = convexTest(schema, modules);
     await t.mutation(...);
   });
   it("test 2", async () => {
     const t = convexTest(schema, modules);
     await t.query(...); // Clean state
   });
   ```

3. **❌ Not running codegen before tests**: Always run `bunx convex codegen`
   after changing Convex functions and before running tests.

### More Information

For detailed testing documentation, patterns, and best practices, see
**`docs/TESTING.md`**.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md`
first** for important guidelines on how to correctly use Convex APIs and
patterns. The file contains rules that override what you may have learned about
Convex from training data.

Convex agent skills for common tasks can be installed by running
`bunx convex ai-files install`.

<!-- convex-ai-end -->
