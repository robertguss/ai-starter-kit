#!/usr/bin/env bash
#
# AI Starter Kit - Automated Setup Script
#
# This script automates the entire setup process after cloning the repository.
# It handles prerequisites, Convex initialization, environment configuration,
# and starts the development server.
#
# Usage:
#   ./setup.sh
#   ./setup.sh --yes --no-dev
#   ./setup.sh --skip-convex --skip-clerk --no-dev
#   SETUP_NONINTERACTIVE=1 ./setup.sh --no-dev
#
# Requirements:
#   - Node.js 20.9 or later (@clerk/tanstack-react-start)
#   - aube (https://aube.jdx.dev)
#   - Internet connection (for Convex cloud services)
#
# Works on: macOS, Linux, Windows (Git Bash/WSL)
#

set -e  # Exit on error

# =============================================================================
# Colors and Formatting
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

YES=false
SKIP_CONVEX=false
SKIP_CLERK=false
NO_DEV=false
CLERK_SETUP_ARGS=()

# =============================================================================
# Helper Functions
# =============================================================================

print_banner() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  ${BOLD}AI Starter Kit - Automated Setup${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${BLUE}▶${NC} ${BOLD}$1${NC}"
}

print_success() {
    echo -e "  ${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "  ${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "  ${RED}✗${NC} $1"
}

print_info() {
    echo -e "  ${CYAN}ℹ${NC} $1"
}

command_exists() {
    command -v "$1" &> /dev/null
}

is_noninteractive() {
    if [ "$YES" = true ]; then
        return 0
    fi
    if [ "${SETUP_NONINTERACTIVE:-}" = "1" ] || [ "${CI:-}" = "true" ] || [ "${AGENT:-}" = "true" ] || [ "${CLERK_MODE:-}" = "agent" ]; then
        return 0
    fi
    if [ ! -t 0 ]; then
        return 0
    fi
    return 1
}

usage() {
    cat <<'EOF'
Usage: ./setup.sh [options]

Options:
  -y, --yes              Non-interactive mode (no prompts; auto-continue)
  --skip-convex          Skip Convex initialization
  --skip-clerk           Skip Clerk CLI setup
  --no-dev               Finish after setup without starting `aubr dev`
  --clerk-app <id>       Pass --app to scripts/setup-clerk-auth.sh
  --clerk-app-name <n>   Pass --app-name to scripts/setup-clerk-auth.sh
  -h, --help             Show this help

Environment:
  SETUP_NONINTERACTIVE=1 Force non-interactive mode
  CI=true / AGENT=true   Also treated as non-interactive
  CLERK_MODE=agent       Also treated as non-interactive

Agent-friendly example:
  ./setup.sh --yes --no-dev --clerk-app app_xxx
EOF
}

parse_args() {
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
                CLERK_SETUP_ARGS+=(--app "${2:-}")
                shift 2
                ;;
            --clerk-app-name)
                CLERK_SETUP_ARGS+=(--app-name "${2:-}")
                shift 2
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

    if is_noninteractive; then
        YES=true
    fi
}

prompt_or_default() {
    # usage: prompt_or_default "Prompt text" default_value
    local prompt_text="$1"
    local default_value="$2"
    local reply=""

    if [ "$YES" = true ]; then
        echo "$default_value"
        return 0
    fi

    read -r -p "$prompt_text" reply || true
    if [ -z "$reply" ]; then
        echo "$default_value"
    else
        echo "$reply"
    fi
}

# =============================================================================
# Prerequisites Check
# =============================================================================

check_prerequisites() {
    print_step "Checking prerequisites..."

    local all_ok=true

    # Check Node.js (Clerk TanStack Start requires >= 20.9)
    if command_exists node; then
        node_major=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        node_minor=$(node -v | cut -d'v' -f2 | cut -d'.' -f2)
        if [ "$node_major" -gt 20 ] || { [ "$node_major" -eq 20 ] && [ "$node_minor" -ge 9 ]; }; then
            print_success "Node.js $(node -v) found"
        else
            print_error "Node.js 20.9+ required. Current version: $(node -v)"
            print_info "Download from: https://nodejs.org/"
            all_ok=false
        fi
    else
        print_error "Node.js not found"
        print_info "Download from: https://nodejs.org/"
        all_ok=false
    fi

    # Check aube
    if command_exists aube; then
        print_success "aube $(aube --version | head -n 1) found"
    else
        print_error "aube not found"
        print_info "Install from: https://aube.jdx.dev"
        all_ok=false
    fi

    # Check openssl (optional, with fallback)
    if command_exists openssl; then
        print_success "openssl found"
        USE_NODE_CRYPTO=false
    else
        print_warning "openssl not found - will use Node.js crypto instead"
        USE_NODE_CRYPTO=true
    fi

    if [ "$all_ok" = false ]; then
        echo ""
        print_error "Prerequisites check failed. Please install the missing requirements and try again."
        exit 1
    fi

    print_success "All prerequisites satisfied!"
}

# =============================================================================
# Install Dependencies
# =============================================================================

install_dependencies() {
    print_step "Installing dependencies..."

    if [ -d "node_modules" ] && [ -f "aube-lock.yaml" ]; then
        print_info "node_modules exists, checking if up to date..."
    fi

    if aube install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        print_info "Try running: aube install --force"
        exit 1
    fi
}

# =============================================================================
# Convex Setup (Guided)
# =============================================================================

ensure_vite_convex_url() {
    if [ ! -f ".env.local" ]; then
        print_error ".env.local was not created. Convex setup may have failed."
        print_info "Try running: aubx convex dev"
        exit 1
    fi

    if ! grep -q "^VITE_CONVEX_URL=" .env.local; then
        if grep -q "^NEXT_PUBLIC_CONVEX_URL=" .env.local; then
            CONVEX_URL=$(grep "^NEXT_PUBLIC_CONVEX_URL=" .env.local | cut -d'=' -f2)
            {
                echo ""
                echo "VITE_CONVEX_URL=${CONVEX_URL}"
            } >> .env.local
            print_success "Added VITE_CONVEX_URL to .env.local (from NEXT_PUBLIC_CONVEX_URL)"
        else
            print_error "VITE_CONVEX_URL not found in .env.local"
            print_info "Convex setup may have failed. Try running: aubx convex dev"
            exit 1
        fi
    fi
}

setup_convex() {
    print_step "Setting up Convex..."

    if [ "$SKIP_CONVEX" = true ]; then
        print_info "Skipping Convex initialization (--skip-convex)"
        return 0
    fi

    if [ -f ".env.local" ] && grep -qE "^VITE_CONVEX_URL=" .env.local; then
        print_warning ".env.local already exists with Convex URL"
        if [ "$YES" = true ]; then
            print_info "Non-interactive mode: reusing existing Convex URL"
            return 0
        fi

        skip_convex=$(prompt_or_default "  Do you want to skip Convex initialization? (y/N): " "N")
        if [[ "$skip_convex" =~ ^[Yy]$ ]]; then
            print_info "Skipping Convex initialization..."
            return 0
        fi
    fi

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  ${BOLD}CONVEX SETUP${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "  A browser window may open for Convex authentication."
    echo "  Please:"
    echo ""
    echo "    1. Log in or create a Convex account (it's free!)"
    echo "    2. Create a new project (or select an existing one)"
    echo "    3. Wait for the terminal to show 'Convex functions ready!'"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ "$YES" = false ]; then
        prompt_or_default "  Press Enter to start Convex setup..." "" >/dev/null
    else
        print_info "Non-interactive mode: starting Convex setup"
    fi
    echo ""

    print_info "Starting Convex initialization..."
    echo ""

    if aubx convex dev --until-success; then
        echo ""
        print_success "Convex initialized successfully!"
    else
        echo ""
        print_error "Convex initialization failed"
        print_info "Try running: aubx convex dev"
        exit 1
    fi

    ensure_vite_convex_url
    print_success "Convex setup complete!"
}

# =============================================================================
# Configure Environment
# =============================================================================

configure_environment() {
    print_step "Configuring Clerk auth (Clerk CLI)..."

    if [ "$SKIP_CLERK" = true ]; then
        print_info "Skipping Clerk CLI setup (--skip-clerk)"
        print_info "Run later: ./scripts/setup-clerk-auth.sh"
        return 0
    fi

    if [ ! -f ".env.local" ] || ! grep -qE "^VITE_CONVEX_URL=" .env.local; then
        print_warning "VITE_CONVEX_URL missing; Clerk setup may not be able to set Convex env"
    else
        CONVEX_URL=$(grep -E "^VITE_CONVEX_URL=" .env.local | cut -d'=' -f2 | head -n1)
        DEPLOYMENT_NAME=$(echo "$CONVEX_URL" | sed 's|https://||' | sed 's|\.convex\.cloud||')
        print_info "Detected Convex deployment: $DEPLOYMENT_NAME"
    fi

    if [ ! -x "./scripts/setup-clerk-auth.sh" ]; then
        print_warning "scripts/setup-clerk-auth.sh is missing or not executable"
        print_info "See docs/AUTHENTICATION.md for Clerk setup"
        return 0
    fi

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  ${BOLD}CLERK SETUP - CLI (recommended)${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "  This step uses the Clerk CLI to create/link an app, pull keys,"
    echo "  create the Convex JWT template, and set CLERK_JWT_ISSUER_DOMAIN."
    echo ""
    echo "  If you are not logged in yet, run this once in another terminal:"
    echo "    aubx clerk@latest auth login"
    echo ""

    if [ "$YES" = true ]; then
        print_info "Non-interactive mode: running Clerk CLI setup"
        clerk_choice=""
    else
        clerk_choice=$(prompt_or_default "  Press Enter to continue Clerk CLI setup (or type s to skip): " "")
    fi

    if [[ "$clerk_choice" =~ ^[Ss]$ ]]; then
        print_warning "Skipped Clerk CLI setup"
        print_info "Run later: ./scripts/setup-clerk-auth.sh"
        print_info "Manual fallback: docs/AUTHENTICATION.md"
        return 0
    fi

    set +e
    ./scripts/setup-clerk-auth.sh "${CLERK_SETUP_ARGS[@]}"
    status=$?
    set -e

    if [ "$status" -eq 0 ]; then
        print_success "Clerk CLI auth setup finished"
    else
        print_warning "Clerk CLI setup did not finish (exit $status)"
        print_info "Fix login or keys, then re-run: ./scripts/setup-clerk-auth.sh"
        print_info "Manual fallback: docs/AUTHENTICATION.md"
        if [ "$YES" = true ]; then
            print_info "Non-interactive mode: continuing despite Clerk setup failure"
        fi
    fi
}

# =============================================================================
# Finish
# =============================================================================

print_completion() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ${BOLD}Setup Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "  Your development environment is ready!"
    echo ""
    echo "    Frontend:         http://localhost:3000"
    echo "    Health check:     http://localhost:3000/api/health"
    echo "    Convex Dashboard: aubx convex dashboard"
    echo ""
    echo -e "  ${BOLD}Next steps:${NC}"
    echo "    1. If Clerk setup was skipped: ./scripts/setup-clerk-auth.sh"
    echo "    2. Open http://localhost:3000 and sign up at /signup"
    echo "    3. Confirm the dashboard loads while signed in"
    echo "    4. Start building!"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

start_dev_server() {
    print_completion
    echo -e "  ${BOLD}Starting development servers...${NC}"
    echo ""
    exec aubr dev
}
# =============================================================================
# Main
# =============================================================================

main() {
    parse_args "$@"
    print_banner

    if [ "$YES" = true ]; then
        print_info "Running in non-interactive mode"
    fi

    check_prerequisites
    install_dependencies
    setup_convex
    configure_environment

    if [ "$NO_DEV" = true ]; then
        print_completion
        print_info "Skipping dev server (--no-dev). Start later with: aubr dev"
        return 0
    fi

    start_dev_server
}

main "$@"
