# Changelog

All notable changes are documented here following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Next.js App Router application shell, auth routes, protected dashboard, 404,
  loading states, and Sentry error boundaries
- Owner-scoped Convex projects CRUD with indexed pagination and a shared input
  schema
- Authenticated Convex query/mutation wrappers via convex-helpers
- GitHub Actions workflow running `pnpm check` and a high-severity audit
- Two-identity Convex authorization tests covering cross-user read/write denial
- Sentry monitoring, Vercel Analytics, and Vercel Speed Insights
- Strict Clerk nonce CSP and common response security headers
- Dashboard route matching in `proxy.ts` plus an RSC `auth.protect()` fallback
- Playwright Chromium smoke tests for public, auth, redirect, health, and 404
- Node.js 24 and pnpm 11 repository pins
- `ClerkProvider dynamic` so the strict nonce CSP works in production
- Shared public env helpers so a missing Convex URL does not crash public routes

### Changed

- Migrated the frontend from TanStack Start/Vite to Next.js App Router
- Migrated authentication to `@clerk/nextjs` and Next.js `proxy.ts`
- Migrated all public environment keys from `VITE_*` to `NEXT_PUBLIC_*`
- Replaced aube commands and lockfile with pnpm scripts and `pnpm-lock.yaml`
- Replaced the static dashboard mock with a real Convex-backed vertical slice
- Updated stable dependencies and aligned TypeScript/ESLint with supported peers
- Reworked setup scripts and documentation for Clerk, Convex, Vercel, and Sentry

### Removed

- TanStack Start, Vite, Vinxi, TanStack Router/Table, and aube integration
- DnD Kit, Recharts, Vaul, Tabler icons, React Is, and mock dashboard code
- Unused shadcn components and demo assets

## [1.0.0] - 2025-11-10

### Added

- Initial starter-kit release

[Unreleased]:
  https://github.com/robertguss/web-app-starter-kit/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/robertguss/web-app-starter-kit/releases/tag/v1.0.0
