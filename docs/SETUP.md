# Detailed Setup Guide

Complete installation and configuration guide for the AI Starter Kit. This guide covers everything from prerequisites to advanced configuration options.

---

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Convex Setup](#convex-setup)
- [Clerk Configuration](#clerk-configuration)
- [Development Workflow](#development-workflow)
- [Verification](#verification)
- [Optional Configuration](#optional-configuration)

---

## System Requirements

### Minimum Requirements

- **Operating System**: macOS, Linux, or Windows 10/11
- **Node.js**: 18.x or later (20.x recommended)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for dependencies
- **Internet**: Required for Convex cloud services

### Recommended Development Tools

- **Package Manager**: aube 1.x+ (faster than npm)
- **Code Editor**: VS Code with recommended extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
- **Browser**: Chrome, Firefox, or Edge (latest version)
- **Terminal**: Modern terminal with ANSI color support

---

## Installation

### Step 1: Clone the Repository

**Option A: HTTPS (Recommended)**

```bash
git clone https://github.com/robertguss/ai-starter-kit.git
cd ai-starter-kit
```

**Option B: SSH (If you have GitHub SSH keys)**

```bash
git clone git@github.com:robertguss/ai-starter-kit.git
cd ai-starter-kit
```

**Option C: Download ZIP**

1. Go to https://github.com/robertguss/ai-starter-kit
2. Click "Code" → "Download ZIP"
3. Extract and navigate to the folder

### Step 2: Install Node.js (If Not Already Installed)

Check your Node version:

```bash
node --version
```

If you need to install or upgrade Node.js:

- **macOS**: Use [Homebrew](https://brew.sh/)

  ```bash
  brew install node@20
  ```

- **Windows**: Download from [nodejs.org](https://nodejs.org/)

- **Linux**: Use your package manager

  ```bash
  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs

  # Fedora
  sudo dnf install nodejs
  ```

### Step 3: Install aube

```bash
# Install from https://aube.jdx.dev (required for aubr / aubx scripts)
# Then verify:
aube --version
```

### Step 4: Install Project Dependencies

```bash
aube install
```

This installs all dependencies defined in `package.json`. The process typically takes 2-5 minutes depending on your internet speed.

**What gets installed:**

- TanStack Start and React 19
- Convex client and Clerk
- Tailwind CSS 4 and shadcn/ui components
- Vitest and testing utilities
- TypeScript and development tools

---

## Environment Configuration

### Understanding Environment Variables

This project uses two types of environment variables:

1. **Convex Environment Variables** (stored in Convex cloud)
   - Set via `npx convex env set KEY value`
   - Used by backend (Convex functions)
   - Secure and not exposed to the frontend

2. **Frontend Environment Variables (Vite)** (stored in `.env.local`)
   - Used by frontend
   - Only `VITE_*` variables are exposed to the browser

### Create .env.local

When you run `aubx convex dev`, Convex creates `.env.local` with:

```bash
# Convex deployment URL (auto-generated)
VITE_CONVEX_URL=https://your-deployment-name.convex.cloud
```

Prefer the Clerk CLI path (also run by `./setup.sh`):

```bash
aubx clerk@latest auth login   # once per machine, browser OAuth
./scripts/setup-clerk-auth.sh  # or: aubr setup:clerk
```

That writes Clerk keys + route URLs into `.env.local` and sets
`CLERK_JWT_ISSUER_DOMAIN` on Convex. See
[Clerk Configuration](#clerk-configuration).

Manual equivalent in `.env.local`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_SIGN_IN_URL=/login
VITE_CLERK_SIGN_UP_URL=/signup
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

### Set Convex Environment Variables

`./scripts/setup-clerk-auth.sh` sets this automatically. Manual fallback:

```bash
aubx convex env set CLERK_JWT_ISSUER_DOMAIN https://verb-noun-00.clerk.accounts.dev
```

### Verify Environment Variables

```bash
# List Convex environment variables
aubx convex env list

# Expected:
# CLERK_JWT_ISSUER_DOMAIN=https://verb-noun-00.clerk.accounts.dev
```

---

## Convex Setup

### Initialize Convex Development Mode

```bash
npx convex dev
```

**First-Time Setup Flow:**

1. **Authentication**
   - Browser window opens automatically
   - Sign up or log in with GitHub, Google, or email
   - Grant permissions to Convex CLI

2. **Project Selection**
   - Choose "Create a new project"
   - Or select an existing project if you've used Convex before

3. **Project Naming**
   - Enter a project name (e.g., "ai-starter-kit-dev")
   - This creates a new deployment

4. **Initialization**
   - Convex analyzes your schema
   - Creates tables and indexes
   - Generates TypeScript types in `convex/_generated/`

5. **Dev Server Starts**
   - Convex watches for file changes
   - Auto-reloads on updates
   - Outputs logs and errors

**Keep this terminal running!** The Convex dev server needs to stay active during development.

### Understanding Convex Files

After initialization, you'll see:

```
convex/
├── _generated/          # Auto-generated (DO NOT EDIT)
│   ├── api.d.ts         # API types for your functions
│   ├── server.d.ts      # Server-side types
│   └── ...
├── auth.config.ts       # Clerk JWT provider config
├── auth.ts              # getCurrentUser helper
├── http.ts              # HTTP router (empty by default)
└── schema.ts            # Database schema definition
```

### Open Convex Dashboard

```bash
npx convex dashboard
```

This opens the Convex web dashboard where you can:

- View and query your tables
- Monitor function execution
- Check logs and errors
- Manage environment variables
- View deployment history

---

## Clerk Configuration

Clerk owns sessions and hosted UI. Convex validates Clerk JWTs via
`convex/auth.config.ts`. The kit ships the code. Finish setup once with the
**Clerk CLI** (recommended) or the Dashboard fallback.

### Finish setup with the Clerk CLI

Do **not** run `clerk init` in a clone of this kit (providers and auth routes
already exist). Use the kit script:

```bash
aubx clerk@latest auth login
./scripts/setup-clerk-auth.sh
# or: aubr setup:clerk
```

This creates/links a Clerk app, pulls keys into `.env.local`, creates the
`convex` JWT template, and sets `CLERK_JWT_ISSUER_DOMAIN`.

Dashboard-only steps and URL cheat sheet:
[Authentication Guide](./AUTHENTICATION.md).

### What the kit wires up

- `ClerkProvider` in `app/routes/__root.tsx`
- `ConvexProviderWithClerk` in `app/ConvexClientProvider.tsx`
- `app/start.ts` with bare `clerkMiddleware()` (session wiring)
- `app/routes/_authenticated/route.tsx` with `beforeLoad` + server `auth()` (page gate)
- Clerk `<SignIn />` at `/login` and `<SignUp />` at `/signup`
- Clerk MCP in `.mcp.json`

### Environment variables

```bash
# .env.local (keys from https://dashboard.clerk.com/last-active?path=api-keys)
VITE_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
VITE_CLERK_SIGN_IN_URL=/login
VITE_CLERK_SIGN_UP_URL=/signup
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Convex (issuer from https://dashboard.clerk.com/apps/setup/convex)
# aubx convex env set CLERK_JWT_ISSUER_DOMAIN <Frontend API URL>
CLERK_JWT_ISSUER_DOMAIN
```

---

## Development Workflow

### Start Development Servers

You need **two terminals**:

**Terminal 1: Convex Backend**

```bash
npx convex dev
```

**Terminal 2: TanStack Start frontend**

```bash
aubr dev:frontend
```

**Or use the combined script** (runs both in parallel):

```bash
aubr dev
```

### Development URLs

- **Frontend**: http://localhost:3000
- **Convex Dashboard**: https://dashboard.convex.dev
- **Convex Dev Logs**: Check Terminal 1

### Hot Reload Behavior

**Frontend (TanStack Start):**

- Changes to `.tsx`, `.ts`, `.css` files trigger instant hot reload
- No page refresh needed (Fast Refresh)

**Backend (Convex):**

- Changes to `convex/*.ts` files trigger auto-deploy
- Functions are hot-swapped without restart
- Database schema changes are applied automatically

### Code Generation

Convex auto-generates TypeScript types, but you can manually trigger it:

```bash
npx convex codegen
```

**When to run this:**

- After schema changes
- Before running tests
- If TypeScript errors appear for Convex imports

---

## Verification

### Step-by-Step Verification Checklist

#### 1. Check Node.js and aube

```bash
node --version    # Should be 18.x or higher
aube --version    # Should be 8.x or higher
```

#### 2. Verify Dependencies Installed

```bash
ls node_modules   # Should see many packages
aube list --depth=0
```

#### 3. Check Convex Connection

```bash
aubx convex env list   # Should show CLERK_JWT_ISSUER_DOMAIN
```

#### 4. Verify .env.local

```bash
cat .env.local
# Expected:
# VITE_CONVEX_URL=https://your-deployment.convex.cloud
# VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
# CLERK_SECRET_KEY=sk_test_...
# VITE_CLERK_SIGN_IN_URL=/login
# VITE_CLERK_SIGN_UP_URL=/signup
```

#### 5. Test Frontend

- Open http://localhost:3000
- Should see landing page (no errors in browser console)

#### 6. Test Authentication

- Go to `/signup` (Clerk `<SignUp />`)
- Create an account
- Should redirect to `/dashboard` after signup

#### 7. Test Convex Functions

```bash
# Run tests
aubr test:once

# All tests should pass
```

#### 8. Check Convex Dashboard

```bash
aubx convex dashboard
```

Confirm `useConvexAuth()` is authenticated and `getCurrentUser` is non-null
after a full sign-out and sign-in.

---

## Optional Configuration

### Enable Strict Mode

For production-ready code, enable React strict mode in `app/routes/__root.tsx`:

```typescript
<React.StrictMode>
  <ConvexClientProvider>{children}</ConvexClientProvider>
</React.StrictMode>
```

### Configure ESLint

Adjust `.eslintrc.json` or create one:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Add Pre-commit Hooks

Install Husky for Git hooks:

```bash
aube add -D husky
npx husky init
echo "aubr lint && aubr test:once" > .husky/pre-commit
```

### Configure Tailwind CSS

Customize `tailwind.config.ts`:

```typescript
export default {
  // Your customizations
  theme: {
    extend: {
      colors: {
        // Custom colors
      },
    },
  },
};
```

### Add More shadcn/ui Components

```bash
# Browse available components
npx shadcn@latest add

# Add specific component
npx shadcn@latest add dialog
npx shadcn@latest add toast
```

---

## Next Steps

- ✅ Setup complete! Now what?
- Read the [Architecture Guide](./ARCHITECTURE.md) to understand how everything works
- Follow the [Development Guide](./DEVELOPMENT.md) to add features
- Check out the [API Reference](./API.md) for Convex functions
- Learn about [Testing](../convex/TESTING.md)

---

## Troubleshooting Setup

For common setup issues, see the [Troubleshooting Guide](./TROUBLESHOOTING.md).

**Quick fixes:**

- **Port conflicts**: Use `PORT=3001 aubr dev:frontend`
- **Stale dependencies**: Run `aube install --force`
- **Convex auth errors**: Verify environment variables with `npx convex env list`
- **TypeScript errors**: Run `npx convex codegen`

---

**Previous:** [← Quick Start](./QUICK_START.md) | **Next:** [Architecture →](./ARCHITECTURE.md)
