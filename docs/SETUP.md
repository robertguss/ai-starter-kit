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

- **Package Manager**: pnpm 8.x+ (faster than npm)
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

### Step 3: Install pnpm

```bash
# Using npm (comes with Node.js)
npm install -g pnpm

# Or using corepack (built into Node 16.13+)
corepack enable
corepack prepare pnpm@latest --activate

# Verify installation
pnpm --version
```

### Step 4: Install Project Dependencies

```bash
pnpm install
```

This installs all dependencies defined in `package.json`. The process typically takes 2-5 minutes depending on your internet speed.

**What gets installed:**

- Next.js 16 and React 19
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

2. **Next.js Environment Variables** (stored in `.env.local`)
   - Used by frontend
   - Only `NEXT_PUBLIC_*` variables are exposed to the browser

### Create .env.local

When you run `bunx convex dev`, Convex creates `.env.local` with:

```bash
# Convex deployment URL (auto-generated)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-name.convex.cloud
```

Add Clerk keys and route URLs. Copy from `.env.example` or the Clerk Dashboard.

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

### Set Convex Environment Variables

Set the Clerk JWT issuer on Convex (Frontend API URL from
https://dashboard.clerk.com/apps/setup/convex):

```bash
bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://verb-noun-00.clerk.accounts.dev
```

### Verify Environment Variables

```bash
# List Convex environment variables
bunx convex env list

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
`convex/auth.config.ts`.

### One-time Clerk Dashboard steps

1. Create an app at https://dashboard.clerk.com/apps/new
2. Enable Convex at https://dashboard.clerk.com/apps/setup/convex
3. Copy publishable and secret keys into `.env.local`
4. Set `CLERK_JWT_ISSUER_DOMAIN` on Convex to the Frontend API URL shown there
5. Sign out fully and sign back in after the JWT template is active

### What the kit wires up

- `ClerkProvider` in `app/layout.tsx`
- `ConvexProviderWithClerk` in `app/ConvexClientProvider.tsx`
- `proxy.ts` with `clerkMiddleware` for early `/dashboard` redirects
- `app/dashboard/layout.tsx` with `auth.protect()`
- Clerk `<SignIn />` at `/login` and `<SignUp />` at `/signup`
- Clerk MCP in `.mcp.json`

### Environment variables

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL

# Convex (bunx convex env set)
CLERK_JWT_ISSUER_DOMAIN
```

See [Authentication Guide](./AUTHENTICATION.md) for the full flow.

---

## Development Workflow

### Start Development Servers

You need **two terminals**:

**Terminal 1: Convex Backend**

```bash
npx convex dev
```

**Terminal 2: Next.js Frontend**

```bash
pnpm run dev:frontend
```

**Or use the combined script** (runs both in parallel):

```bash
pnpm run dev
```

### Development URLs

- **Frontend**: http://localhost:3000
- **Convex Dashboard**: https://dashboard.convex.dev
- **Convex Dev Logs**: Check Terminal 1

### Hot Reload Behavior

**Frontend (Next.js):**

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

#### 1. Check Node.js and pnpm

```bash
node --version    # Should be 18.x or higher
pnpm --version    # Should be 8.x or higher
```

#### 2. Verify Dependencies Installed

```bash
ls node_modules   # Should see many packages
pnpm list --depth=0
```

#### 3. Check Convex Connection

```bash
bunx convex env list   # Should show CLERK_JWT_ISSUER_DOMAIN
```

#### 4. Verify .env.local

```bash
cat .env.local
# Expected:
# NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
# CLERK_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
# NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
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
pnpm run test:once

# All tests should pass
```

#### 8. Check Convex Dashboard

```bash
bunx convex dashboard
```

Confirm `useConvexAuth()` is authenticated and `getCurrentUser` is non-null
after a full sign-out and sign-in.

---

## Optional Configuration

### Enable Strict Mode

For production-ready code, enable React strict mode in `app/layout.tsx`:

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
pnpm add -D husky
npx husky init
echo "pnpm run lint && pnpm run test:once" > .husky/pre-commit
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

- **Port conflicts**: Use `PORT=3001 pnpm run dev:frontend`
- **Stale dependencies**: Run `pnpm install --force`
- **Convex auth errors**: Verify environment variables with `npx convex env list`
- **TypeScript errors**: Run `npx convex codegen`

---

**Previous:** [← Quick Start](./QUICK_START.md) | **Next:** [Architecture →](./ARCHITECTURE.md)
