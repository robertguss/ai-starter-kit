#!/usr/bin/env bash
# Thin wrapper so existing setup paths keep calling this file.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$ROOT_DIR/scripts/setup-clerk-auth.mjs" "$@"
