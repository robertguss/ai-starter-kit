# Changelog

All notable changes are documented here following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Next.js App Router application shell, auth routes, protected dashboard, 404,
  loading states, and Sentry error boundaries
- Owner-scoped Convex projects CRUD with indexed pagination and structured
  validation errors
- Two-identity Convex authorization tests covering cross-user read/write denial
- Sentry monitoring, Vercel Analytics, and Vercel Speed Insights
- Strict Clerk nonce CSP and common response security headers
- Resource-level Clerk auth checks with an ESLint guard against unprotected
  server resources
- Playwright Chromium smoke tests for public, auth, redirect, health, and 404
- Node.js 24 and pnpm 11 repository pins

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
- GitHub Actions workflow, per project requirements

## [1.0.0] - 2025-11-10

### Added

- Initial starter-kit release

[Unreleased]:
  https://github.com/robertguss/web-app-starter-kit/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/robertguss/web-app-starter-kit/releases/tag/v1.0.0
