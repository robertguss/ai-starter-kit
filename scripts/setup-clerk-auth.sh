#!/usr/bin/env bash
# Idempotent Clerk + Convex auth setup for the Next.js starter kit.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_ID=""
APP_NAME=""
ENV_FILE=".env.local"
SKIP_CONVEX_ENV=false
TMP_DIR=""

usage() {
  cat <<'EOF'
Usage: ./scripts/setup-clerk-auth.sh [options]

Options:
  --app <id>           Link an existing Clerk application
  --app-name <name>    Name a newly created Clerk application
  --env-file <path>    Env file to write (default: .env.local)
  --skip-convex-env    Do not set CLERK_JWT_ISSUER_DOMAIN on Convex
  -h, --help           Show this help

Environment:
  CLERK_SECRET_KEY                    Reuse an existing Clerk secret key
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   Reuse an existing publishable key
  CLERK_PLATFORM_API_KEY              Headless Clerk Platform API auth
  CLERK_MODE=agent                    Force non-interactive Clerk CLI behavior
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
    --app)
      need_value "$1" "${2:-}"
      APP_ID="$2"
      shift 2
      ;;
    --app-name)
      need_value "$1" "${2:-}"
      APP_NAME="$2"
      shift 2
      ;;
    --env-file)
      need_value "$1" "${2:-}"
      ENV_FILE="$2"
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
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

step() { printf '\n\033[0;34m▶\033[0m \033[1m%s\033[0m\n' "$1"; }
success() { printf '  \033[0;32m✓\033[0m %s\n' "$1"; }
info() { printf '  \033[0;36mℹ\033[0m %s\n' "$1"; }
fail() { printf '  \033[0;31m✗\033[0m %s\n' "$1" >&2; exit 1; }

cleanup() {
  if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT

ensure_tmp_dir() {
  if [ -z "$TMP_DIR" ]; then
    TMP_DIR="$(mktemp -d)"
  fi
}

if command -v clerk >/dev/null 2>&1; then
  CLERK_COMMAND=(clerk)
else
  CLERK_COMMAND=(pnpm dlx clerk@latest)
fi

run_clerk() {
  CLERK_MODE="${CLERK_MODE:-agent}" "${CLERK_COMMAND[@]}" "$@"
}

run_convex() {
  pnpm exec convex "$@"
}

upsert_env() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"

  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    awk -v key="$key" -v value="$value" '
      BEGIN { replaced = 0 }
      index($0, key "=") == 1 && !replaced { print key "=" value; replaced = 1; next }
      { print }
    ' "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  else
    rm -f "$tmp"
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

env_value() {
  local value
  value="$(grep "^$1=" "$ENV_FILE" 2>/dev/null | head -n1 | cut -d= -f2- || true)"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value"
}

has_key() {
  local value
  value="$(env_value "$1")"
  case "$value" in
    pk_test_*|pk_live_*|sk_test_*|sk_live_*)
      [ "${#value}" -ge 30 ]
      ;;
    *) return 1 ;;
  esac
}

copy_legacy_key() {
  local old_key="$1"
  local new_key="$2"
  local value
  value="$(env_value "$old_key")"
  if [ -n "$value" ] && [ -z "$(env_value "$new_key")" ]; then
    upsert_env "$new_key" "$value"
    success "Migrated $old_key to $new_key"
  fi
}

prepare_env() {
  touch "$ENV_FILE"
  copy_legacy_key "VITE_CLERK_PUBLISHABLE_KEY" "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  copy_legacy_key "VITE_CONVEX_URL" "NEXT_PUBLIC_CONVEX_URL"

  upsert_env "NEXT_PUBLIC_CLERK_SIGN_IN_URL" "/sign-in"
  upsert_env "NEXT_PUBLIC_CLERK_SIGN_UP_URL" "/sign-up"
  upsert_env "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL" "/dashboard"
  upsert_env "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL" "/dashboard"
  success "Next.js Clerk route defaults are present"
}

adopt_environment_keys() {
  if [ -n "${CLERK_SECRET_KEY:-}" ] && ! has_key "CLERK_SECRET_KEY"; then
    upsert_env "CLERK_SECRET_KEY" "$CLERK_SECRET_KEY"
    success "Adopted CLERK_SECRET_KEY from the environment"
  fi

  local publishable_key="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-${VITE_CLERK_PUBLISHABLE_KEY:-}}"
  if [ -n "$publishable_key" ] && ! has_key "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"; then
    upsert_env "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "$publishable_key"
    success "Adopted the Clerk publishable key from the environment"
  fi
}

linked_app_id() {
  local json
  json="$(run_clerk whoami --json 2>/dev/null || true)"
  printf '%s' "$json" | node -e '
    let input = "";
    process.stdin.on("data", (chunk) => (input += chunk));
    process.stdin.on("end", () => {
      try {
        const value = JSON.parse(input);
        const id = value.application_id || value.applicationId || value.app_id ||
          value.appId || value.application?.id || value.application?.application_id || "";
        process.stdout.write(String(id));
      } catch {
        process.stdout.write("");
      }
    });
  '
}

ensure_app_and_keys() {
  adopt_environment_keys
  if has_key "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" && has_key "CLERK_SECRET_KEY"; then
    success "Clerk keys are already present"
    return 0
  fi

  run_clerk whoami >/dev/null 2>&1 || {
    info "Run: pnpm dlx clerk@latest auth login"
    fail "Clerk CLI is not authenticated"
  }

  if [ -z "$APP_ID" ]; then
    APP_ID="$(linked_app_id)"
  fi

  if [ -z "$APP_ID" ]; then
    [ -n "$APP_NAME" ] || APP_NAME="$(basename "$ROOT_DIR")"
    ensure_tmp_dir
    local result="$TMP_DIR/clerk-app.json"
    run_clerk apps create "$APP_NAME" --json > "$result"
    APP_ID="$(node -e '
      const fs = require("fs");
      const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      process.stdout.write(String(value.application_id || value.applicationId || value.id || ""));
    ' "$result")"
    [ -n "$APP_ID" ] || fail "Could not determine the new Clerk application ID"
  fi

  run_clerk link --app "$APP_ID"
  run_clerk env pull --file "$ENV_FILE"
  copy_legacy_key "VITE_CLERK_PUBLISHABLE_KEY" "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"

  has_key "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" && has_key "CLERK_SECRET_KEY" \
    || fail "Clerk keys are missing after env pull"
  success "Clerk application linked and keys written"
}

secret_key() {
  env_value "CLERK_SECRET_KEY"
}

ensure_jwt_template() {
  step "Ensuring the Clerk Convex JWT template"
  ensure_tmp_dir
  local templates="$TMP_DIR/jwt-templates.json"
  local body="$TMP_DIR/convex-template.json"

  if ! run_clerk api /jwt_templates > "$templates" 2>/dev/null; then
    command -v curl >/dev/null 2>&1 || fail "curl is required for the Clerk API fallback"
    curl -fsS "https://api.clerk.com/v1/jwt_templates" \
      -H "Authorization: Bearer $(secret_key)" > "$templates"
  fi

  if node -e '
    const fs = require("fs");
    const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const rows = Array.isArray(value) ? value : value.data || [];
    process.exit(rows.some((template) => template?.name === "convex") ? 0 : 1);
  ' "$templates"; then
    success 'JWT template "convex" already exists'
    return 0
  fi

  cat > "$body" <<'EOF'
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

  if run_clerk api /jwt_templates --file "$body" --yes >/dev/null 2>&1; then
    success 'Created JWT template "convex"'
  elif curl -fsS -X POST "https://api.clerk.com/v1/jwt_templates" \
    -H "Authorization: Bearer $(secret_key)" \
    -H "Content-Type: application/json" \
    --data @"$body" >/dev/null; then
    success 'Created JWT template "convex"'
  else
    fail 'Could not create the Clerk JWT template "convex"'
  fi
}

frontend_api_url() {
  local from_env
  from_env="$(env_value "CLERK_FRONTEND_API_URL")"
  if [[ "$from_env" =~ ^https://[^[:space:]]+$ ]]; then
    printf '%s' "$from_env"
    return 0
  fi

  ensure_tmp_dir
  local domains="$TMP_DIR/domains.json"
  if ! run_clerk api /domains > "$domains" 2>/dev/null; then
    curl -fsS "https://api.clerk.com/v1/domains" \
      -H "Authorization: Bearer $(secret_key)" > "$domains"
  fi

  node -e '
    const fs = require("fs");
    const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const rows = Array.isArray(value) ? value : value.data || [];
    const domain = rows.find((item) => item?.is_primary || item?.primary) || rows[0];
    const url = domain?.frontend_api_url || domain?.frontendApiUrl ||
      (domain?.name ? `https://${domain.name}` : "");
    process.stdout.write(String(url));
  ' "$domains"
}

set_convex_issuer() {
  if [ "$SKIP_CONVEX_ENV" = true ]; then
    info "Skipped the Convex issuer (--skip-convex-env)"
    return 0
  fi

  step "Setting the Clerk issuer on Convex"
  local issuer
  issuer="$(frontend_api_url)"
  [ -n "$issuer" ] || fail "Could not determine CLERK_JWT_ISSUER_DOMAIN"

  run_convex env set CLERK_JWT_ISSUER_DOMAIN "$issuer"
  success "CLERK_JWT_ISSUER_DOMAIN is configured"
}

command -v node >/dev/null 2>&1 || fail "Node.js is required"
command -v pnpm >/dev/null 2>&1 || fail "pnpm is required"

step "Preparing $ENV_FILE"
prepare_env

step "Resolving the Clerk application and keys"
ensure_app_and_keys

ensure_jwt_template
set_convex_issuer

printf '\n\033[0;32m\033[1mClerk auth setup complete.\033[0m\n'
echo "Routes: /sign-in and /sign-up → /dashboard"
echo "Sign out fully and sign back in after first enabling the JWT template."
