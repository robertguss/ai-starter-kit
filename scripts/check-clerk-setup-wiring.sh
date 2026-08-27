#!/usr/bin/env bash
# Verify the local setup wiring without network access or secret values.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
failures=0

check() {
  local label="$1"
  shift
  if "$@"; then
    echo "PASS  $label"
  else
    echo "FAIL  $label"
    failures=1
  fi
}

check "setup.sh is executable" test -x setup.sh
check "setup.sh has valid Bash syntax" bash -n setup.sh
check "setup.sh help exits successfully" bash -c './setup.sh --help >/dev/null'
check "Clerk setup wrapper is executable" test -x scripts/setup-clerk-auth.sh
check "Clerk setup wrapper has valid Bash syntax" bash -n scripts/setup-clerk-auth.sh
check "Clerk setup script is Node" test -f scripts/setup-clerk-auth.mjs
check "Clerk setup help exits successfully" \
  bash -c './scripts/setup-clerk-auth.sh --help >/dev/null'
check "Clerk setup rejects short placeholder keys" \
  grep -q 'value.length >= 30' scripts/setup-clerk-auth.mjs
check "package.json selects pnpm" grep -q '"packageManager": "pnpm@' package.json
check "package.json exposes setup:clerk" grep -q '"setup:clerk"' package.json
check "setup.sh invokes the Clerk setup" grep -q 'scripts/setup-clerk-auth.sh' setup.sh
check "Clerk middleware initializes request auth" grep -q 'clerkMiddleware' proxy.ts
check "Clerk middleware protects the dashboard" grep -q 'createRouteMatcher' proxy.ts
check "Clerk middleware configures strict CSP" grep -q 'contentSecurityPolicy' proxy.ts
check "dashboard layout protects its resource" \
  grep -q 'await auth.protect()' app/dashboard/layout.tsx
check "root layout enables dynamic ClerkProvider" \
  grep -q 'dynamic' app/layout.tsx
check "environment example documents Next.js Clerk keys" \
  grep -q 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY' .env.example
check "starter setup skill uses the pnpm Clerk setup command" \
  grep -q 'pnpm setup:clerk' .agents/skills/setup-starter-kit/SKILL.md
check "CI workflow is present" test -f .github/workflows/ci.yml

if [ "$failures" -ne 0 ]; then
  echo ""
  echo "Setup wiring checks failed"
  exit 1
fi

echo ""
echo "All setup wiring checks passed"
