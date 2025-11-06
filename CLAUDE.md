# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 starter kit with Convex backend and Better Auth authentication. The stack includes:
- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS 4, shadcn/ui components
- **Backend**: Convex (real-time database and serverless functions)
- **Auth**: Better Auth with Convex integration (email/password, no verification required)
- **UI**: shadcn/ui (New York style) with Lucide icons

## Development Commands

### Starting Development
```bash
npm run dev
# Runs both frontend and backend in parallel:
# - Next.js dev server with Turbo (localhost:3000)
# - Convex dev server (convex dev)
```

### Individual Services
```bash
npm run dev:frontend    # Next.js only
npm run dev:backend     # Convex only
npm run predev          # Convex dev until success, then open dashboard
```

### Build and Lint
```bash
npm run build           # Build Next.js for production
npm run lint            # Run ESLint
```

### Convex Management
```bash
npx convex dev                              # Start Convex dev mode
npx convex dashboard                        # Open Convex dashboard
npx convex env set KEY value                # Set environment variable
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)  # Generate auth secret
npx convex env set SITE_URL http://localhost:3000                  # Set site URL
```

## Architecture

### Authentication Flow

**Better Auth + Convex Integration**: This project uses Better Auth with the Convex plugin, which stores auth data directly in Convex tables managed by a component.

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
   - Convex client configured with `expectAuth: true` (pauses queries until authenticated)

4. **HTTP Routes (convex/http.ts)**:
   - Auth routes registered via `authComponent.registerRoutes(http, createAuth)`
   - Available at `/api/auth/*` endpoints

5. **Middleware (middleware.ts)**:
   - Protects `/dashboard` routes
   - Validates session by calling `/api/auth/get-session`
   - Redirects to `/login` with `redirect` query param if unauthenticated

### Directory Structure

```
/app                        # Next.js App Router pages
  /api                      # API routes (if any)
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
  myFunctions.ts           # Example Convex functions
  schema.ts                # Database schema
  convex.config.ts         # Convex configuration

/lib                       # Shared utilities
  auth-client.ts           # Better Auth React client
  utils.ts                 # Utility functions (cn, etc.)

/hooks                     # React hooks
  use-mobile.ts            # Mobile detection hook

middleware.ts              # Next.js middleware (route protection)
```

### Convex Function Patterns

This project follows the new Convex function syntax with validators. See `.cursor/rules/convex_rules.mdc` for comprehensive Convex guidelines. Key patterns:

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
- `internalQuery`, `internalMutation`, `internalAction` - Private functions (only callable by other Convex functions)

**Calling functions**:
- Import from `api` for public functions: `api.myFunctions.listNumbers`
- Import from `internal` for internal functions: `internal.myModule.privateFunction`
- Use `ctx.runQuery()`, `ctx.runMutation()`, `ctx.runAction()` to call functions

**Getting current user**:
```typescript
const user = await authComponent.getAuthUser(ctx);
```

### Environment Variables

**Convex (set via `npx convex env set`)**:
- `BETTER_AUTH_SECRET` - Auth encryption secret (generate with `openssl rand -base64 32`)
- `SITE_URL` - Site URL (e.g., `http://localhost:3000`)

**Next.js (.env.local)**:
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL (auto-created by `npx convex dev`)

### shadcn/ui Configuration

- Style: `new-york`
- TypeScript: Enabled
- Path aliases: `@/components`, `@/lib`, `@/hooks`, etc.
- Base color: neutral
- CSS variables: Enabled
- Icon library: Lucide

Add components via:
```bash
npx shadcn@latest add [component-name]
```

## Important Convex Guidelines

Reference `.cursor/rules/convex_rules.mdc` for detailed guidelines. Key points:

1. **Schema**: Define in `convex/schema.ts`. Index names should include all fields (e.g., `by_channelId_and_userId`)

2. **Queries**: Use indexes instead of filters. Use `.unique()` for single results, `.take(n)` for limits, `.collect()` or async iteration for results

3. **Validators**:
   - Use `v.int64()` not `v.bigint()`
   - Use `v.null()` for null returns
   - Use `v.record()` for dynamic keys

4. **Actions**: Add `"use node";` directive when using Node.js built-in modules

5. **TypeScript**: Be strict with `Id<"tableName">` types. Use `as const` for string literals in unions

6. **No ctx.db in actions**: Actions cannot access the database directly, use `ctx.runQuery()` or `ctx.runMutation()`

## Authentication Notes

- Email/password authentication is enabled without email verification (for quick setup)
- Session validation happens via `/api/auth/get-session` endpoint
- Protected routes use middleware to check session and redirect to `/login` if unauthenticated
- Auth data is stored in Convex via the Better Auth component (not in separate auth tables you manage)
