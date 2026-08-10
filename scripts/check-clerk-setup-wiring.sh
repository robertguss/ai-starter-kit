#!/usr/bin/env bash
# Prove the Clerk CLI setup lever is wired into the kit (no network, no secrets).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
fail=0

check() {
  local label="$1"
  shift
  if "$@"; then
    echo "PASS  $label"
  else
    echo "FAIL  $label"
    fail=1
  fi
}

check "setup-clerk-auth.sh exists and is executable" test -x scripts/setup-clerk-auth.sh
check "setup-clerk-auth.sh bash syntax" bash -n scripts/setup-clerk-auth.sh
check "setup-clerk-auth.sh --help exits 0" \
  bash -c './scripts/setup-clerk-auth.sh --help >/dev/null'
check "package.json has setup:clerk" grep -q '"setup:clerk"' package.json
check "setup.sh invokes setup-clerk-auth.sh" grep -q 'scripts/setup-clerk-auth.sh' setup.sh
check "AGENTS.md documents the script" grep -q 'scripts/setup-clerk-auth.sh' AGENTS.md
check "AUTHENTICATION.md prefers CLI" grep -q 'Clerk CLI' docs/AUTHENTICATION.md
check "AUTHENTICATION.md forbids clerk init in kit" grep -q 'Do not run `clerk init`' docs/AUTHENTICATION.md
check "setup-starter-kit skill points at the script" grep -q 'scripts/setup-clerk-auth.sh' .agents/skills/setup-starter-kit/SKILL.md
check ".env.example mentions the script" grep -q 'scripts/setup-clerk-auth.sh' .env.example

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "Clerk setup wiring checks failed"
  exit 1
fi

echo ""
echo "All Clerk setup wiring checks passed"
