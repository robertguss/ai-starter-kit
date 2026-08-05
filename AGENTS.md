# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in
this repository.

## Project Overview

This is a TanStack Start starter kit with a Convex backend and Clerk
authentication. The stack includes:

- **Frontend**: TanStack Start with React 19, TypeScript, Tailwind CSS 4,
  shadcn/ui components
- **Backend**: Convex (real-time database and serverless functions)
- **Auth**: Clerk with Convex JWT validation
- **UI**: shadcn/ui (New York style) with Lucide icons

## Development Commands

### Starting Development

```bash
aubr dev
# Runs both frontend and backend in parallel:
# - TanStack Start Vite dev server (localhost:3000)
# - Convex dev server (convex dev)
```

### Individual Services

```bash
aubr dev:frontend # TanStack Start Vite dev server
aubr dev:backend # Convex only
aubr predev # Convex dev until success, then open dashboard
```

### Build and Lint

```bash
aubr build # Build for production (Vite + SSR + type check)
aubr lint # Run ESLint
```

### Testing

```bash
aubr test # Run tests in watch mode
aubr test:once # Run tests once
aubr test:debug # Debug tests with inspector
aubr test:coverage # Run tests with coverage report
```

### Convex Management

```bash
aubx convex dev # Start Convex dev mode
aubx convex dashboard # Open Convex dashboard
aubx convex env set KEY value # Set environment variable
aubx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
aubx convex codegen # Generate TypeScript types (required before running tests)
```

## Architecture

### Authentication Flow

**Clerk + Convex Integration**: Clerk owns sessions and UI. Convex validates
Clerk JWTs configured in `convex/auth.config.ts`.

1. **Backend (`convex/auth.config.ts`)**:
   - Provider domain from `CLERK_JWT_ISSUER_DOMAIN`
   - `applicationID: "convex"` (Clerk Convex JWT template)

2. **Backend helpers (`convex/auth.ts`)**:
   - `getCurrentUser` reads `ctx.auth.getUserIdentity()`
   - Returns `{ subject, name, email, image? } | null`

3. **Frontend providers**:
   - `ClerkProvider` in `app/routes/__root.tsx`
   - `ConvexProviderWithClerk` + Clerk `useAuth` in
     `app/ConvexClientProvider.tsx`
4. **Route protection**:
   - `app/start.ts` wires up `clerkMiddleware()` for request/session handling
   - `app/routes/_authenticated/route.tsx` uses `beforeLoad` + server `auth()`
     to gate all authenticated routes (e.g. `/dashboard`)
   - Convex functions must check `ctx.auth.getUserIdentity()` for data access

5. **Auth UI**:
   - `/login` → Clerk `<SignIn />` splat route (`app/routes/login.$.tsx`)
   - `/signup` → Clerk `<SignUp />` splat route (`app/routes/signup.$.tsx`)
   - Prefer `useConvexAuth()` for Convex-auth UI gates; Clerk `useUser` /
     `SignOutButton` for display / sign-out

### Directory Structure

```text
/app                         # TanStack Start application source
  /routes                    # TanStack Router routes
    __root.tsx               # Root route (providers + document shell)
    index.tsx                # Home page
    _authenticated/          # Pathless auth layout + protected routes
      route.tsx              # Shared beforeLoad auth gate
      dashboard.tsx          # Protected dashboard page
    login.$.tsx              # Clerk sign-in (splat for multi-step paths)
    signup.$.tsx             # Clerk sign-up (splat for multi-step paths)
  router.tsx                 # Router factory
  start.ts                   # TanStack Start entry + Clerk middleware
  ConvexClientProvider.tsx   # Convex + Clerk provider
  globals.css                # Tailwind CSS entry

/components                  # React components
  /ui                        # shadcn/ui components
  app-sidebar.tsx            # Main app sidebar
  nav-user.tsx               # User menu (Clerk signOut)
  [other components]

/convex                      # Convex backend
  /_generated                # Auto-generated Convex code
  auth.config.ts             # Clerk JWT provider config
  auth.ts                    # getCurrentUser helper
  http.ts                    # HTTP router
  schema.ts                  # Database schema
  test.setup.ts              # Test configuration for convex-test
  convex.config.ts           # Convex configuration

/lib                         # Shared utilities
  utils.ts                   # Utility functions (cn, etc.)

/hooks                       # React hooks
  use-mobile.ts              # Mobile detection hook

vite.config.ts               # Vite + TanStack Start plugin configuration
.mcp.json                    # Includes Clerk MCP (https://mcp.clerk.com/mcp)
```

### Convex Function Patterns

This project follows the new Convex function syntax with validators. See
`convex/CLAUDE.md` for comprehensive Convex guidelines. Key patterns:

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
const identity = await ctx.auth.getUserIdentity();
// or from the client: useQuery(api.auth.getCurrentUser)
```

### Environment Variables

**Convex (set via `aubx convex env set`)**:

- `CLERK_JWT_ISSUER_DOMAIN` - Clerk Frontend API URL / JWT issuer
  (from https://dashboard.clerk.com/apps/setup/convex)

**Frontend (`.env.local`)**:

- `VITE_CONVEX_URL` - Convex deployment URL (written by `aubx convex dev`;
  `setup.sh` ensures the `VITE_` key is present)
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `VITE_CLERK_SIGN_IN_URL` - `/login`
- `VITE_CLERK_SIGN_UP_URL` - `/signup`
- `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` - `/dashboard`
- `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` - `/dashboard`

### Clerk Dashboard Steps (Required Once Per Project)

1. Account (if needed): https://dashboard.clerk.com/sign-up
2. Create an application: https://dashboard.clerk.com/apps/new
3. Copy API keys from
   https://dashboard.clerk.com/last-active?path=api-keys into `.env.local`
   (`VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
4. Enable Convex at https://dashboard.clerk.com/apps/setup/convex and copy the
   Frontend API URL
5. `aubx convex env set CLERK_JWT_ISSUER_DOMAIN <Frontend API URL>`
6. Allow `http://localhost:3000` (+ `/login`, `/signup`, `/dashboard`) in Clerk
   path / redirect settings
7. After activating the JWT template, sign out completely and sign back in
8. Confirm `useConvexAuth()` is authenticated and
   `ctx.auth.getUserIdentity()` is non-null

Canonical walkthrough: `docs/AUTHENTICATION.md`.

For an agent-guided, interactive setup that walks through these steps and can
use a Clerk token when one is available, invoke the `setup-starter-kit` agent
skill in `.agents/skills/setup-starter-kit/`.

### Clerk MCP

This kit ships Clerk's MCP server in `.mcp.json`:

```json
"clerk": {
  "url": "https://mcp.clerk.com/mcp"
}
```

You can also run `clerk mcp install` or add it from Cursor Settings → Tools &
MCP. Tools include `clerk_sdk_snippet` and `list_clerk_sdk_snippets`.

### shadcn/ui Configuration

- Style: `new-york`
- TypeScript: Enabled
- Path aliases: `@/components`, `@/lib`, `@/hooks`, etc.
- Base color: neutral
- CSS variables: Enabled
- Icon library: Lucide

Add components via:

```bash
aubx shadcn@latest add [component-name]
```

## Convex Guidelines

See **`convex/CLAUDE.md`** for comprehensive Convex development rules covering
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

- Clerk hosts sign-in/sign-up UI and session cookies
- Convex trusts Clerk JWTs via `auth.config.ts`
- Protected routes use `clerkMiddleware` + `_authenticated` `beforeLoad` /
  server `auth()` (not Next.js `auth.protect()`)
- Prefer `useConvexAuth()` over raw Clerk state when deciding whether
  Convex-authenticated UI can render
- After activating the Convex JWT template, sign out and sign in fully before
  testing

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
3. **Run codegen first**: Tests require `aubx convex codegen` to be run first to
   generate the `_generated` directory

### Testing with Authentication

```typescript
it("should work with authenticated user", async () => {
  const t = convexTest(schema, modules);
  const asUser = t.withIdentity({ subject: "user123", name: "Test User" });

  const result = await asUser.query(api.auth.getCurrentUser, {});
  expect(result?.subject).toBe("user123");
});
```

### More Information

For detailed testing documentation, patterns, and best practices, see
**`docs/TESTING.md`**.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
