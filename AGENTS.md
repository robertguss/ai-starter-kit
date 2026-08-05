# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in
this repository.

## Project Overview

This is a Next.js 16 starter kit with Convex backend and Clerk
authentication. The stack includes:

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS 4, shadcn/ui
  components
- **Backend**: Convex (real-time database and serverless functions)
- **Auth**: Clerk with Convex JWT validation
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
bun run dev:frontend # Next.js only
bun run dev:backend # Convex only
bun run predev # Convex dev until success, then open dashboard
```

### Build and Lint

```bash
bun run build # Build Next.js for production
bun run lint # Run ESLint
```

### Testing

```bash
bun run test # Run tests in watch mode
bun run test:once # Run tests once
bun run test:debug # Debug tests with inspector
bun run test:coverage # Run tests with coverage report
```

### Convex Management

```bash
bunx convex dev # Start Convex dev mode
bunx convex dashboard # Open Convex dashboard
bunx convex env set KEY value # Set environment variable
bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
bunx convex codegen # Generate TypeScript types (required before running tests)
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
   - `ClerkProvider` in `app/layout.tsx`
   - `ConvexProviderWithClerk` + Clerk `useAuth` in
     `app/ConvexClientProvider.tsx`
   - Convex client uses `expectAuth: true`

4. **Route protection (`proxy.ts`)**:
   - Next.js 16 uses `proxy.ts` (not `middleware.ts`)
   - `clerkMiddleware` early-redirects unauthenticated `/dashboard` visits
   - `app/dashboard/layout.tsx` calls `auth.protect()` as the resource check

5. **Auth UI**:
   - `/login` → Clerk `<SignIn />` (`app/login/[[...sign-in]]/page.tsx`)
   - `/signup` → Clerk `<SignUp />` (`app/signup/[[...sign-up]]/page.tsx`)

### Directory Structure

```text
/app                         # Next.js App Router pages
  /dashboard                 # Protected dashboard pages
  /login/[[...sign-in]]      # Clerk sign-in
  /signup/[[...sign-up]]     # Clerk sign-up
  ConvexClientProvider.tsx   # Convex + Clerk provider
  layout.tsx                 # Root layout (ClerkProvider)
  page.tsx                   # Home page

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

proxy.ts                     # Next.js proxy (Clerk middleware)
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

**Convex (set via `bunx convex env set`)**:

- `CLERK_JWT_ISSUER_DOMAIN` - Clerk Frontend API URL / JWT issuer
  (from https://dashboard.clerk.com/apps/setup/convex)

**Next.js (`.env.local`)**:

- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL (auto-created by
  `bunx convex dev`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - `/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - `/signup`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` - `/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` - `/dashboard`

### Clerk Dashboard Steps (Required Once Per Project)

1. Create a Clerk application at https://dashboard.clerk.com/apps/new
2. Enable the Convex integration at
   https://dashboard.clerk.com/apps/setup/convex
3. Copy API keys into `.env.local`
4. Set `CLERK_JWT_ISSUER_DOMAIN` on Convex to the Frontend API URL shown there
5. After activating the JWT template, sign out completely and sign back in
6. Confirm `useConvexAuth()` is authenticated and
   `ctx.auth.getUserIdentity()` is non-null

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
bunx shadcn@latest add [component-name]
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
- Protected routes use `clerkMiddleware` + `auth.protect()` on `/dashboard`
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
3. **Run codegen first**: Tests require `bunx convex codegen` to be run first to
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

When working on Convex code, **always read `convex/_generated/ai/guidelines.md`
first** for important guidelines on how to correctly use Convex APIs and
patterns. The file contains rules that override what you may have learned about
Convex from training data.

Convex agent skills for common tasks can be installed by running
`bunx convex ai-files install`.

<!-- convex-ai-end -->
