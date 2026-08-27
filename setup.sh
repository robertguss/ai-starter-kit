#!/usr/bin/env bash
# Set up Web App Starter Kit after cloning.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

YES=false
SKIP_CONVEX=false
SKIP_CLERK=false
NO_DEV=false
CLERK_ARGS=()

usage() {
  cat <<'EOF'
Usage: ./setup.sh [options]

Options:
  -y, --yes              Run without confirmation prompts
  --skip-convex          Skip Convex project linking
  --skip-clerk           Skip Clerk app and JWT setup
  --no-dev               Do not start development servers
  --clerk-app <id>       Link an existing Clerk application
  --clerk-app-name <n>   Name a newly created Clerk application
  -h, --help             Show this help

Example:
  ./setup.sh --yes --no-dev --clerk-app app_xxx
EOF
}

need_value() {
  if [ -z "${2:-}" ]; then
    echo "Missing value for $1" >&2
    exit 2
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    -y|--yes)
      YES=true
      shift
      ;;
    --skip-convex)
      SKIP_CONVEX=true
      shift
      ;;
    --skip-clerk)
      SKIP_CLERK=true
      shift
      ;;
    --no-dev)
      NO_DEV=true
      shift
      ;;
    --clerk-app)
      need_value "$1" "${2:-}"
      CLERK_ARGS+=(--app "$2")
      shift 2
      ;;
    --clerk-app-name)
      need_value "$1" "${2:-}"
      CLERK_ARGS+=(--app-name "$2")
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ "${SETUP_NONINTERACTIVE:-}" = "1" ] || [ "${CI:-}" = "true" ] || [ ! -t 0 ]; then
  YES=true
fi

step() { printf '\n\033[0;34m▶\033[0m \033[1m%s\033[0m\n' "$1"; }
success() { printf '  \033[0;32m✓\033[0m %s\n' "$1"; }
info() { printf '  \033[0;36mℹ\033[0m %s\n' "$1"; }

step "Checking Node.js and pnpm"
command -v node >/dev/null 2>&1 || {
  echo "Node.js 24 is required: https://nodejs.org/" >&2
  exit 1
}
node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) process.exit(1)' || {
  echo "Node.js 24.x is required; found $(node --version)." >&2
  exit 1
}
success "Node.js $(node --version)"

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@11 --activate
  else
    npm install --global pnpm@11
  fi
fi
pnpm_version="$(pnpm --version)"
if [ "${pnpm_version%%.*}" != "11" ]; then
  echo "pnpm 11.x is required; found $pnpm_version." >&2
  exit 1
fi
success "pnpm $(pnpm --version)"

step "Installing dependencies"
pnpm install --frozen-lockfile
success "Dependencies installed"

migrate_legacy_convex_url() {
  [ -f .env.local ] || return 0
  if ! grep -q '^NEXT_PUBLIC_CONVEX_URL=' .env.local \
    && grep -q '^VITE_CONVEX_URL=' .env.local; then
    local value
    value="$(grep '^VITE_CONVEX_URL=' .env.local | head -n1 | cut -d= -f2-)"
    printf '\nNEXT_PUBLIC_CONVEX_URL=%s\n' "$value" >> .env.local
    success "Migrated the existing Convex URL to NEXT_PUBLIC_CONVEX_URL"
  fi
}

migrate_legacy_convex_url

step "Linking Convex"
if [ "$SKIP_CONVEX" = true ]; then
  info "Skipped Convex (--skip-convex)"
elif [ -f .env.local ] && grep -q '^NEXT_PUBLIC_CONVEX_URL=' .env.local && [ "$YES" = true ]; then
  success "Reusing the linked Convex deployment"
else
  if [ "$YES" = false ]; then
    read -r -p "Convex may open a browser for authentication. Continue? [Y/n] " reply
    if [[ "$reply" =~ ^[Nn]$ ]]; then
      echo "Convex setup is required. Re-run with --skip-convex to defer it." >&2
      exit 1
    fi
  fi
  pnpm exec convex dev --until-success
  migrate_legacy_convex_url
  grep -q '^NEXT_PUBLIC_CONVEX_URL=' .env.local || {
    echo "Convex did not write NEXT_PUBLIC_CONVEX_URL to .env.local." >&2
    exit 1
  }
  success "Convex linked"
fi

step "Configuring Clerk"
if [ "$SKIP_CLERK" = true ]; then
  info "Skipped Clerk (--skip-clerk); run pnpm setup:clerk later"
else
  if [ "$YES" = false ]; then
    read -r -p "Configure Clerk and the Convex JWT template now? [Y/n] " reply
    if [[ "$reply" =~ ^[Nn]$ ]]; then
      info "Skipped Clerk; run pnpm setup:clerk later"
      SKIP_CLERK=true
    fi
  fi
  if [ "$SKIP_CLERK" = false ]; then
    ./scripts/setup-clerk-auth.sh "${CLERK_ARGS[@]}"
  fi
fi

printf '\n\033[0;32m\033[1mSetup complete.\033[0m\n'
echo "Run pnpm dev, then open http://localhost:3000/sign-up."
echo "Sign out and back in after the Convex JWT template is first enabled."

if [ "$NO_DEV" = false ]; then
  exec pnpm dev
fi
