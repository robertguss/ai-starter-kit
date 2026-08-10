#!/usr/bin/env bash
#
# Idempotent Clerk auth setup for this TanStack Start + Convex starter kit.
#
# This kit already ships Clerk wiring (providers, middleware, /login, /signup).
# Do NOT run `clerk init` here; it would fight those files. This script:
#   1. Ensures Clerk route defaults in .env.local
#   2. Links or creates a Clerk app and pulls keys (or adopts existing keys)
#   3. Creates the Convex JWT template named "convex" when missing
#   4. Sets CLERK_JWT_ISSUER_DOMAIN on the Convex deployment
#
# Usage:
#   ./scripts/setup-clerk-auth.sh
#   ./scripts/setup-clerk-auth.sh --app-name "My App"
#   ./scripts/setup-clerk-auth.sh --app app_xxxxxxxx
#   ./scripts/setup-clerk-auth.sh --skip-convex-env
#
# Prefer an authenticated Clerk CLI session (`clerk auth login`). Keys already
# present in the environment or .env.local are reused without creating an app.
#
# Requires: Node.js 20.9+, network access. Optional: aube (aubx), global `clerk`.
#

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

APP_ID=""
APP_NAME=""
SKIP_CONVEX_ENV=false
ENV_FILE=".env.local"
TMP_DIR=""

print_step() { echo ""; echo -e "${BLUE}▶${NC} ${BOLD}$1${NC}"; }
print_success() { echo -e "  ${GREEN}✓${NC} $1"; }
print_warning() { echo -e "  ${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "  ${RED}✗${NC} $1"; }
print_info() { echo -e "  ${CYAN}ℹ${NC} $1"; }

cleanup() {
  if [ -n "${TMP_DIR:-}" ] && [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT

usage() {
  cat <<'EOF'
Usage: ./scripts/setup-clerk-auth.sh [options]

Options:
  --app <id>           Link this Clerk application id (agent-friendly)
  --app-name <name>    Name for clerk apps create when no app is linked
  --env-file <path>    Env file to write (default: .env.local)
  --skip-convex-env    Skip aubx/npx convex env set CLERK_JWT_ISSUER_DOMAIN
  -h, --help           Show this help

Environment:
  CLERK_SECRET_KEY                 Reuse an existing secret key (sk_test_... / sk_live_...)
  VITE_CLERK_PUBLISHABLE_KEY       Optional publishable key to write alongside the secret
  CLERK_PLATFORM_API_KEY           Headless Clerk Platform API auth (advanced)
  CLERK_MODE=agent                 Force non-interactive Clerk CLI behavior
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --app)
      APP_ID="${2:-}"
      shift 2
      ;;
    --app-name)
      APP_NAME="${2:-}"
      shift 2
      ;;
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --skip-convex-env)
      SKIP_CONVEX_ENV=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      usage
      exit 2
      ;;
  esac
done

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Resolve a Clerk CLI invocation. Prefer aube's aubx in this kit, then global
# clerk, then the lockfile-aligned runner.
resolve_clerk_prefix() {
  if command_exists aubx; then
    echo "aubx clerk@latest"
  elif command_exists clerk; then
    echo "clerk"
  elif command_exists pnpm; then
    echo "pnpm dlx clerk@latest"
  else
    echo "npx -y clerk@latest"
  fi
}

CLERK_PREFIX="$(resolve_clerk_prefix)"

run_clerk() {
  # shellcheck disable=SC2086
  CLERK_MODE="${CLERK_MODE:-agent}" $CLERK_PREFIX "$@"
}

run_convex() {
  if command_exists aubx; then
    aubx convex "$@"
  elif command_exists npx; then
    npx convex "$@"
  else
    print_error "Neither aubx nor npx is available to run Convex CLI"
    return 1
  fi
}

ensure_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
    print_info "Created $ENV_FILE"
  fi
}

env_has_real_key() {
  local key="$1"
  local value
  value="$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | head -n1 | cut -d= -f2- || true)"
  case "$value" in
    ""|*...*|pk_test_\.\.\.|sk_test_\.\.\.|your-*|YOUR-*)
      return 1
      ;;
    pk_*|sk_*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

upsert_env() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"
  if grep -qE "^${key}=" "$ENV_FILE" 2>/dev/null; then
    awk -v k="$key" -v v="$value" '
      BEGIN { done = 0 }
      index($0, k "=") == 1 && !done { print k "=" v; done = 1; next }
      { print }
      END { if (!done) print k "=" v }
    ' "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  else
    rm -f "$tmp"
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

ensure_route_defaults() {
  local changed=false
  if ! grep -qE "^VITE_CLERK_SIGN_IN_URL=" "$ENV_FILE"; then
    upsert_env "VITE_CLERK_SIGN_IN_URL" "/login"
    changed=true
  fi
  if ! grep -qE "^VITE_CLERK_SIGN_UP_URL=" "$ENV_FILE"; then
    upsert_env "VITE_CLERK_SIGN_UP_URL" "/signup"
    changed=true
  fi
  if ! grep -qE "^VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=" "$ENV_FILE"; then
    upsert_env "VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL" "/dashboard"
    changed=true
  fi
  if ! grep -qE "^VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=" "$ENV_FILE"; then
    upsert_env "VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL" "/dashboard"
    changed=true
  fi
  if [ "$changed" = true ]; then
    print_success "Added Clerk route defaults to $ENV_FILE"
  else
    print_success "Clerk route defaults already present"
  fi
}

normalize_clerk_env_keys() {
  # Some runners still emit Next-style names; this kit is Vite.
  if ! env_has_real_key "VITE_CLERK_PUBLISHABLE_KEY" \
    && grep -qE "^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_" "$ENV_FILE" 2>/dev/null; then
    local pub
    pub="$(grep -E "^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=" "$ENV_FILE" | head -n1 | cut -d= -f2-)"
    upsert_env "VITE_CLERK_PUBLISHABLE_KEY" "$pub"
    print_success "Mapped NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY → VITE_CLERK_PUBLISHABLE_KEY"
  fi
}

adopt_keys_from_environment() {
  if [ -n "${CLERK_SECRET_KEY:-}" ] && ! env_has_real_key "CLERK_SECRET_KEY"; then
    upsert_env "CLERK_SECRET_KEY" "$CLERK_SECRET_KEY"
    print_success "Wrote CLERK_SECRET_KEY from the environment"
  fi
  if [ -n "${VITE_CLERK_PUBLISHABLE_KEY:-}" ] && ! env_has_real_key "VITE_CLERK_PUBLISHABLE_KEY"; then
    upsert_env "VITE_CLERK_PUBLISHABLE_KEY" "$VITE_CLERK_PUBLISHABLE_KEY"
    print_success "Wrote VITE_CLERK_PUBLISHABLE_KEY from the environment"
  fi
}

clerk_logged_in() {
  if run_clerk whoami --json >/dev/null 2>&1; then
    return 0
  fi
  if run_clerk whoami >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

linked_app_id_from_whoami() {
  local json
  if ! json="$(run_clerk whoami --json 2>/dev/null)"; then
    return 0
  fi
  printf '%s' "$json" | node -e '
    let d = "";
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => {
      try {
        const j = JSON.parse(d);
        const id =
          j.application_id ||
          j.applicationId ||
          j.app_id ||
          j.appId ||
          (j.application && (j.application.id || j.application.application_id)) ||
          "";
        process.stdout.write(String(id || ""));
      } catch {
        process.stdout.write("");
      }
    });
  '
}

ensure_clerk_app_and_keys() {
  if env_has_real_key "VITE_CLERK_PUBLISHABLE_KEY" && env_has_real_key "CLERK_SECRET_KEY"; then
    print_success "Clerk keys already present in $ENV_FILE"
    return 0
  fi

  adopt_keys_from_environment
  if env_has_real_key "VITE_CLERK_PUBLISHABLE_KEY" && env_has_real_key "CLERK_SECRET_KEY"; then
    print_success "Clerk keys adopted from the environment"
    return 0
  fi

  print_info "Using Clerk CLI via: $CLERK_PREFIX"

  if ! clerk_logged_in; then
    print_error "Clerk CLI is not authenticated"
    print_info "In a browser-capable terminal run:"
    print_info "  $CLERK_PREFIX auth login"
    print_info "Then re-run: ./scripts/setup-clerk-auth.sh"
    print_info "Or export CLERK_SECRET_KEY (+ VITE_CLERK_PUBLISHABLE_KEY) and re-run."
    exit 2
  fi
  print_success "Clerk CLI session is authenticated"

  if [ -z "$APP_ID" ]; then
    APP_ID="$(linked_app_id_from_whoami || true)"
  fi

  if [ -z "$APP_ID" ]; then
    if [ -z "$APP_NAME" ]; then
      APP_NAME="$(basename "$ROOT_DIR")"
    fi
    print_info "Creating Clerk application: $APP_NAME"
    TMP_DIR="$(mktemp -d)"
    local create_json="$TMP_DIR/clerk_app.json"
    if ! run_clerk apps create "$APP_NAME" --json > "$create_json"; then
      print_error "clerk apps create failed"
      exit 1
    fi
    APP_ID="$(node -e '
      const fs = require("fs");
      const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const id = j.application_id || j.applicationId || j.id || "";
      process.stdout.write(String(id));
    ' "$create_json")"
    if [ -z "$APP_ID" ]; then
      print_error "Could not parse application id from clerk apps create"
      print_info "Pass --app app_xxx explicitly after: $CLERK_PREFIX apps list --json"
      exit 1
    fi
    print_success "Created Clerk app $APP_ID"
  else
    print_success "Using Clerk app $APP_ID"
  fi

  print_info "Linking project to $APP_ID"
  run_clerk link --app "$APP_ID"
  print_success "Project linked"

  print_info "Pulling Clerk keys into $ENV_FILE"
  run_clerk env pull --file "$ENV_FILE"
  normalize_clerk_env_keys

  if ! env_has_real_key "VITE_CLERK_PUBLISHABLE_KEY" || ! env_has_real_key "CLERK_SECRET_KEY"; then
    print_error "Clerk keys still missing after env pull"
    print_info "Check $ENV_FILE and re-run: $CLERK_PREFIX env pull --file $ENV_FILE"
    exit 1
  fi
  print_success "Clerk keys written to $ENV_FILE"
}

secret_key_from_env_file() {
  grep -E "^CLERK_SECRET_KEY=" "$ENV_FILE" | head -n1 | cut -d= -f2-
}

ensure_convex_jwt_template() {
  print_step "Ensuring Convex JWT template"

  TMP_DIR="${TMP_DIR:-$(mktemp -d)}"
  local list_json="$TMP_DIR/jwt_templates.json"
  local create_body="$TMP_DIR/convex_jwt_template.json"

  if run_clerk api /jwt_templates > "$list_json" 2>/dev/null; then
    if node -e '
      const fs = require("fs");
      const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const rows = Array.isArray(j) ? j : j.data || [];
      const exists = rows.some((t) => t && t.name === "convex");
      process.exit(exists ? 0 : 1);
    ' "$list_json"; then
      print_success 'JWT template "convex" already exists'
      return 0
    fi
  else
    # Fall back to secret-key auth when CLI session cannot call BAPI.
    local secret
    secret="$(secret_key_from_env_file)"
    if [ -z "$secret" ]; then
      print_error "Unable to list JWT templates (CLI API failed and no CLERK_SECRET_KEY)"
      exit 1
    fi
    if curl -fsS "https://api.clerk.com/v1/jwt_templates" \
      -H "Authorization: Bearer ${secret}" > "$list_json"; then
      if node -e '
        const fs = require("fs");
        const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
        const rows = Array.isArray(j) ? j : j.data || [];
        const exists = rows.some((t) => t && t.name === "convex");
        process.exit(exists ? 0 : 1);
      ' "$list_json"; then
        print_success 'JWT template "convex" already exists'
        return 0
      fi
    fi
  fi

  cat > "$create_body" <<'EOF'
{
  "name": "convex",
  "claims": {
    "aud": "convex",
    "name": "{{user.full_name}}",
    "nickname": "{{user.username}}",
    "picture": "{{user.image_url}}",
    "given_name": "{{user.first_name}}",
    "family_name": "{{user.last_name}}",
    "email": "{{user.primary_email_address}}",
    "phone_number": "{{user.primary_phone_number}}",
    "email_verified": "{{user.email_verified}}",
    "phone_number_verified": "{{user.phone_number_verified}}",
    "updated_at": "{{user.updated_at}}"
  },
  "lifetime": 3600
}
EOF

  if run_clerk api /jwt_templates --file "$create_body" --yes >/dev/null 2>&1; then
    print_success 'Created JWT template "convex"'
    return 0
  fi

  local secret
  secret="$(secret_key_from_env_file)"
  if [ -n "$secret" ] && curl -fsS -X POST "https://api.clerk.com/v1/jwt_templates" \
    -H "Authorization: Bearer ${secret}" \
    -H "Content-Type: application/json" \
    --data @"$create_body" >/dev/null; then
    print_success 'Created JWT template "convex" via secret key'
    return 0
  fi

  print_error 'Failed to create JWT template "convex"'
  print_info "Enable Convex at https://dashboard.clerk.com/apps/setup/convex as a fallback"
  exit 1
}

frontend_api_url_from_env_file() {
  local value
  value="$(grep -E "^CLERK_FRONTEND_API_URL=" "$ENV_FILE" 2>/dev/null | head -n1 | cut -d= -f2- || true)"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  # clerk env pull writes https://<slug>.clerk.accounts.dev (or a custom FAPI host).
  if printf '%s' "$value" | grep -Eq '^https://[^[:space:]]+'; then
    printf '%s' "$value"
  fi
}

fetch_frontend_api_url() {
  # Prefer value already pulled into .env.local (clerk env pull writes this).
  local from_env
  from_env="$(frontend_api_url_from_env_file || true)"
  if [ -n "$from_env" ]; then
    printf '%s' "$from_env"
    return 0
  fi

  TMP_DIR="${TMP_DIR:-$(mktemp -d)}"
  local domains_json="$TMP_DIR/domains.json"

  if run_clerk api /domains > "$domains_json" 2>/dev/null; then
    :
  else
    local secret
    secret="$(secret_key_from_env_file)"
    if [ -z "$secret" ]; then
      return 1
    fi
    curl -fsS "https://api.clerk.com/v1/domains" \
      -H "Authorization: Bearer ${secret}" > "$domains_json" || return 1
  fi

  # Top-level `return` is illegal in `node -e` (Node treats it as a script, not a
  # function body). Use if/else so Node 20+ / 24 do not throw SyntaxError.
  node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const rows = Array.isArray(j) ? j : j.data || [];
    const primary = rows.find((d) => d && (d.is_primary || d.primary)) || rows[0];
    const url =
      (primary && (primary.frontend_api_url || primary.frontendApiUrl)) ||
      "";
    if (!url && primary && primary.name) {
      process.stdout.write("https://" + primary.name);
    } else {
      process.stdout.write(String(url || ""));
    }
  ' "$domains_json"
}

set_convex_issuer() {
  if [ "$SKIP_CONVEX_ENV" = true ]; then
    print_warning "Skipping Convex env set (--skip-convex-env)"
    return 0
  fi

  print_step "Setting CLERK_JWT_ISSUER_DOMAIN on Convex"

  local fapi
  fapi="$(fetch_frontend_api_url || true)"
  if [ -z "$fapi" ]; then
    print_error "Could not resolve Clerk Frontend API URL"
    print_info "Copy it from https://dashboard.clerk.com/apps/setup/convex then run:"
    print_info "  aubx convex env set CLERK_JWT_ISSUER_DOMAIN <Frontend API URL>"
    exit 1
  fi
  print_info "Frontend API URL: $fapi"

  if run_convex env list 2>/dev/null | grep -qE "^CLERK_JWT_ISSUER_DOMAIN="; then
    local current
    current="$(run_convex env list 2>/dev/null | grep -E "^CLERK_JWT_ISSUER_DOMAIN=" | head -n1 | cut -d= -f2- || true)"
    if [ "$current" = "$fapi" ]; then
      print_success "CLERK_JWT_ISSUER_DOMAIN already set"
      return 0
    fi
  fi

  if run_convex env set CLERK_JWT_ISSUER_DOMAIN "$fapi"; then
    print_success "Set CLERK_JWT_ISSUER_DOMAIN=$fapi"
  else
    print_error "Failed to set CLERK_JWT_ISSUER_DOMAIN"
    print_info "Ensure Convex is linked (aubx convex dev --until-success), then re-run this script"
    exit 1
  fi
}

print_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ${BOLD}Clerk auth setup complete${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "  Keys:     $ENV_FILE (VITE_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)"
  echo "  Routes:   /login, /signup → /dashboard"
  echo "  JWT:      template name \"convex\" (aud=convex)"
  if [ "$SKIP_CONVEX_ENV" = false ]; then
    echo "  Convex:   CLERK_JWT_ISSUER_DOMAIN set"
  fi
  echo ""
  echo "  Next:"
  echo "    1. aubr dev"
  echo "    2. Open http://localhost:3000/signup"
  echo "    3. Sign out fully and sign back in once after enabling the JWT template"
  echo ""
}

main() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  ${BOLD}Clerk CLI auth setup${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if ! command_exists node; then
    print_error "Node.js is required"
    exit 1
  fi

  print_step "Preparing $ENV_FILE"
  ensure_env_file
  ensure_route_defaults

  print_step "Resolving Clerk application and keys"
  ensure_clerk_app_and_keys
  normalize_clerk_env_keys

  ensure_convex_jwt_template
  set_convex_issuer
  print_summary
}

main "$@"
