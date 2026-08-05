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
#   # or
#   bash setup.sh
#
# Requirements:
#   - Node.js 18 or later
#   - bun (https://bun.sh)
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

# Check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# =============================================================================
# Prerequisites Check
# =============================================================================

check_prerequisites() {
    print_step "Checking prerequisites..."

    local all_ok=true

    # Check Node.js
    if command_exists node; then
        node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge 18 ]; then
            print_success "Node.js $(node -v) found"
        else
            print_error "Node.js 18+ required. Current version: $(node -v)"
            print_info "Download from: https://nodejs.org/"
            all_ok=false
        fi
    else
        print_error "Node.js not found"
        print_info "Download from: https://nodejs.org/"
        all_ok=false
    fi

    # Check bun
    if command_exists bun; then
        print_success "bun $(bun -v) found"
    else
        print_error "bun not found"
        print_info "Install from: https://bun.sh"
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

    # Exit if critical prerequisites are missing
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

    if [ -d "node_modules" ] && [ -f "bun.lock" ]; then
        print_info "node_modules exists, checking if up to date..."
    fi

    if bun install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        print_info "Try running: bun install --force"
        exit 1
    fi
}

# =============================================================================
# Convex Setup (Guided)
# =============================================================================

setup_convex() {
    print_step "Setting up Convex..."

    # Check if already set up
    if [ -f ".env.local" ] && grep -qE "^(VITE_CONVEX_URL|NEXT_PUBLIC_CONVEX_URL)=" .env.local; then
        print_warning ".env.local already exists with Convex URL"
        read -p "  Do you want to skip Convex initialization? (y/N): " skip_convex
        if [[ "$skip_convex" =~ ^[Yy]$ ]]; then
            print_info "Skipping Convex initialization..."
            return 0
        fi
    fi

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  ${BOLD}CONVEX SETUP - Interactive Step Required${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "  A browser window will open for Convex authentication."
    echo "  Please:"
    echo ""
    echo "    1. Log in or create a Convex account (it's free!)"
    echo "    2. Create a new project (or select an existing one)"
    echo "    3. Wait for the terminal to show 'Convex functions ready!'"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    read -p "  Press Enter to start Convex setup..."
    echo ""

    # Run convex dev until it succeeds (creates .env.local)
    print_info "Starting Convex initialization..."
    echo ""

    if npx convex dev --until-success; then
        echo ""
        print_success "Convex initialized successfully!"
    else
        echo ""
        print_error "Convex initialization failed"
        print_info "Try running: npx convex dev"
        exit 1
    fi

    # Verify .env.local was created
    if [ ! -f ".env.local" ]; then
        print_error ".env.local was not created. Convex setup may have failed."
        print_info "Try running: npx convex dev"
        exit 1
    fi

    if ! grep -q "NEXT_PUBLIC_CONVEX_URL" .env.local; then
        print_error "NEXT_PUBLIC_CONVEX_URL not found in .env.local"
        print_info "Convex setup may have failed. Try running: npx convex dev"
        exit 1
    fi

    # Convex writes NEXT_PUBLIC_CONVEX_URL; the TanStack Start frontend uses VITE_CONVEX_URL.
    if ! grep -q "VITE_CONVEX_URL" .env.local; then
        CONVEX_URL=$(grep "NEXT_PUBLIC_CONVEX_URL" .env.local | cut -d'=' -f2)
        {
            echo ""
            echo "VITE_CONVEX_URL=${CONVEX_URL}"
        } >> .env.local
        print_success "Added VITE_CONVEX_URL to .env.local"
    fi

    print_success "Convex setup complete!"
}

# =============================================================================
# Configure Environment
# =============================================================================

configure_environment() {
    print_step "Configuring Clerk environment..."

    CONVEX_URL=$(grep -E "^(VITE_CONVEX_URL|NEXT_PUBLIC_CONVEX_URL)=" .env.local | cut -d'=' -f2 | head -n1)

    if [ -z "$CONVEX_URL" ]; then
        print_error "Could not find VITE_CONVEX_URL or NEXT_PUBLIC_CONVEX_URL in .env.local"
        exit 1
    fi

    DEPLOYMENT_NAME=$(echo "$CONVEX_URL" | sed 's|https://||' | sed 's|\.convex\.cloud||')
    print_info "Detected Convex deployment: $DEPLOYMENT_NAME"

    # Clerk route defaults for this kit
    if ! grep -q "VITE_CLERK_SIGN_IN_URL" .env.local; then
        {
            echo ""
            echo "VITE_CLERK_SIGN_IN_URL=/login"
            echo "VITE_CLERK_SIGN_UP_URL=/signup"
            echo "VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard"
            echo "VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard"
        } >> .env.local
        print_success "Added Clerk route defaults to .env.local"
    else
        print_warning "Clerk route URLs already set in .env.local"
    fi

    if grep -q "VITE_CLERK_PUBLISHABLE_KEY=pk_" .env.local 2>/dev/null; then
        print_success "Clerk publishable key found in .env.local"
    else
        print_warning "Add Clerk keys to .env.local before developing"
        print_info "1. Create an app:  https://dashboard.clerk.com/apps/new"
        print_info "2. API keys:       https://dashboard.clerk.com/last-active?path=api-keys"
        print_info "3. Enable Convex:  https://dashboard.clerk.com/apps/setup/convex"
        print_info "4. Set issuer:     bunx convex env set CLERK_JWT_ISSUER_DOMAIN <Frontend API URL>"
        print_info "See docs/AUTHENTICATION.md for the full Clerk UI walkthrough"
    fi

    if npx convex env list 2>/dev/null | grep -q "CLERK_JWT_ISSUER_DOMAIN"; then
        print_success "CLERK_JWT_ISSUER_DOMAIN already set in Convex"
    else
        print_warning "CLERK_JWT_ISSUER_DOMAIN is not set in Convex yet"
        print_info "Enable Convex at https://dashboard.clerk.com/apps/setup/convex, then run:"
        print_info "  bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev"
    fi

    print_success "Environment configured (complete Clerk keys + JWT issuer to finish auth)!"
}

# =============================================================================
# Start Dev Server
# =============================================================================

start_dev_server() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ${BOLD}Setup Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "  Your development environment is ready!"
    echo ""
    echo "  ${BOLD}Starting development servers...${NC}"
    echo ""
    echo "    Frontend:         http://localhost:3000"
    echo "    Convex Dashboard: npx convex dashboard"
    echo ""
    echo "  ${BOLD}Next steps:${NC}"
    echo "    1. Finish Clerk setup (keys in .env.local + CLERK_JWT_ISSUER_DOMAIN)"
    echo "    2. Open http://localhost:3000 and sign up at /signup"
    echo "    3. Confirm the dashboard loads while signed in"
    echo "    4. Start building!"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Start the dev server
    exec bun run dev
}

# =============================================================================
# Main
# =============================================================================

main() {
    print_banner
    check_prerequisites
    install_dependencies
    setup_convex
    configure_environment
    start_dev_server
}

# Run main function
main "$@"
