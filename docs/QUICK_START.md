# Quick Start Guide

Get the AI Starter Kit running on your machine in **5 minutes**. This guide will walk you through the fastest path to a working application.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Automated Setup (Recommended)](#automated-setup-recommended)
- [Manual Installation Steps](#manual-installation-steps)
- [Verification](#verification)
- [What's Next?](#whats-next)
- [Troubleshooting Quick Setup](#troubleshooting-quick-setup)

---

## Prerequisites

Before you begin, make sure you have the following installed:

### Required

- ✅ **Node.js** 18.x or later ([Download here](https://nodejs.org/))

  ```bash
  node --version  # Should be 18.x or higher
  ```

- ✅ **pnpm** (recommended) or npm

  ```bash
  # Install pnpm globally if you don't have it
  npm install -g pnpm

  # Verify installation
  pnpm --version
  ```

### Optional but Helpful

- **Git** for version control
- **VS Code** or your preferred code editor
- A free [Clerk](https://clerk.com) account for authentication

---

## Automated Setup (Recommended)

The easiest way to get started is with our automated setup script. It handles everything for you!

```bash
# Clone the repository
git clone https://github.com/robertguss/ai-starter-kit.git
cd ai-starter-kit

# Run the setup script
./setup.sh
```

**What the setup script does:**

1. ✅ Checks prerequisites (Node.js 18+, pnpm)
2. ✅ Installs pnpm automatically if missing
3. ✅ Installs all dependencies
4. ✅ Guides you through Convex authentication (browser login)
5. ✅ Configures all environment variables automatically
6. ✅ Starts the development servers

> **Windows Users**: Run `bash setup.sh` in Git Bash or WSL.

After the script completes, your dev server will be running at [http://localhost:3000](http://localhost:3000)!

---

## Manual Installation Steps

If you prefer to set things up manually, or if the automated setup doesn't work for your environment, follow these steps:

### Step 1: Clone the Repository

```bash
git clone https://github.com/robertguss/ai-starter-kit.git
cd ai-starter-kit
```

Or if you've already downloaded it:

```bash
cd ai-starter-kit
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This will install all required packages (~2-3 minutes depending on your internet speed).

### Step 3: Initialize Convex

Run the following command to set up your Convex backend:

```bash
npx convex dev
```

**What happens next:**

1. You'll be prompted to **log in or create a Convex account** (free)
   - Opens a browser window for authentication
   - Sign up with GitHub, Google, or email

2. Choose to **create a new project** or link an existing one
   - For first-time users, select "Create a new project"
   - Give it a name (e.g., "ai-starter-kit-dev")

3. Convex will:
   - Create a `.env.local` file with `NEXT_PUBLIC_CONVEX_URL`
   - Start the Convex development server
   - Begin watching for changes in your `convex/` directory

**Leave this terminal running!** The Convex dev server needs to stay active.

### Step 4: Finish Clerk in the Dashboard (UI)

The kit already includes Clerk code. You still configure Clerk once in the UI.

1. **Create an app** at https://dashboard.clerk.com/apps/new  
   (account first if needed: https://dashboard.clerk.com/sign-up)

2. **Copy API keys** from  
   https://dashboard.clerk.com/last-active?path=api-keys  
   into `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
   - `CLERK_SECRET_KEY=sk_test_...`
   - Plus the kit route defaults from `.env.example` (`/login`, `/signup`,
     fallback `/dashboard`)

3. **Turn on Convex** at  
   https://dashboard.clerk.com/apps/setup/convex  
   Activate the integration and copy the **Frontend API URL**.

4. **Set the issuer on Convex**:

```bash
bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://verb-noun-00.clerk.accounts.dev
```

`CLERK_JWT_ISSUER_DOMAIN` is the issuer Convex uses to validate Clerk JWTs.
Without this step, Clerk login can work while Convex stays unauthenticated.

5. Allow `http://localhost:3000` (and `/login`, `/signup`, `/dashboard`) in
   Clerk path / redirect settings if prompted.

Full UI walkthrough: [docs/AUTHENTICATION.md](./AUTHENTICATION.md).

### Step 5: Start the Development Server

In your second terminal (or a third if you prefer), run:

```bash
pnpm run dev
```

This starts both:

- **Next.js frontend** on `http://localhost:3000`
- **Convex backend** (if not already running)

---

## Verification

### ✅ Check That Everything Works

1. **Open your browser** to [http://localhost:3000](http://localhost:3000)
   - You should see the landing page

2. **Create an account:**
   - Navigate to `/signup` (Clerk `<SignUp />`)
   - Complete the Clerk sign-up flow
   - You should land on `/dashboard`

3. **Log in:**
   - Navigate to `/login` (Clerk `<SignIn />`)
   - Sign in with the same account
   - You should be redirected to `/dashboard`

4. **Verify Convex auth:**
   - Open the Convex Dashboard: [https://dashboard.convex.dev](https://dashboard.convex.dev)
   - Or run: `bunx convex dashboard`
   - Confirm `CLERK_JWT_ISSUER_DOMAIN` is set and `getCurrentUser` returns a user

5. **Run tests** (optional but recommended):

   ```bash
   # First, generate Convex types
   npx convex codegen

   # Run tests
   pnpm run test:once
   ```

### 🎉 Success!

If you can sign up, log in, and see the dashboard, you're all set!

---

## What's Next?

Now that you have the starter kit running, here are some suggested next steps:

### 1. Explore the Dashboard

- Check out the sample charts and data
- Navigate through the sidebar menu
- Try the dark mode toggle

### 2. Review Example Code

- **Auth UI**: `app/login/[[...sign-in]]/page.tsx` and `app/signup/[[...sign-up]]/page.tsx`
  - Clerk `<SignIn />` and `<SignUp />`

- **Protected Routes**: `proxy.ts` and `app/dashboard/layout.tsx`
  - `clerkMiddleware` plus `auth.protect()`

### 3. Read Detailed Documentation

- [Setup Guide](./SETUP.md) - Detailed configuration options
- [Architecture Overview](./ARCHITECTURE.md) - System design and patterns
- [Development Guide](./DEVELOPMENT.md) - How to add features
- [Database Guide](./DATABASE.md) - Schema and data modeling

### 4. Make Your First Change

Try adding a new page:

```bash
# Create a new page
mkdir -p app/hello
echo 'export default function Hello() { return <h1>Hello, World!</h1> }' > app/hello/page.tsx

# Visit http://localhost:3000/hello
```

### 5. Add a New Convex Function

Create a new file `convex/greetings.ts`:

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";

export const sayHello = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return `Hello, ${args.name}!`;
  },
});
```

Then in your React components, call it with:

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const greeting = useQuery(api.greetings.sayHello, { name: "World" });
```

---

## Troubleshooting Quick Setup

### Problem: `npx convex dev` fails

**Solution:**

- Make sure you're connected to the internet
- Check that port 3210 isn't already in use
- Try: `npx convex dev --admin-key <key>` if you have credentials

### Problem: `NEXT_PUBLIC_CONVEX_URL` not found

**Solution:**

- Make sure `.env.local` exists in the project root
- Run `npx convex dev` again - it auto-generates this file
- Restart your Next.js dev server after the file is created

### Problem: "Unauthorized" or auth errors

**Solution:**

- Verify Convex has the issuer:
  ```bash
  bunx convex env list
  ```
- You should see `CLERK_JWT_ISSUER_DOMAIN`
- Confirm Clerk keys exist in `.env.local`
- Sign out fully and sign back in after enabling the Convex JWT template

### Problem: Convex says no auth provider matched the token

**Cause:** The Clerk Convex JWT template is missing, or the issuer domain is wrong.

**Solution:**

1. Activate Convex at https://dashboard.clerk.com/apps/setup/convex
2. Set `CLERK_JWT_ISSUER_DOMAIN` to the Frontend API URL shown there
3. Restart `bunx convex dev`
4. Sign out completely and sign back in

### Problem: Port 3000 already in use

**Solution:**

- Stop other processes on port 3000, or
- Run Next.js on a different port:
  ```bash
  pnpm run dev:frontend -- -p 3001
  ```

### Problem: Tests fail with "Cannot find \_generated"

**Solution:**

- Run Convex codegen first:
  ```bash
  npx convex codegen
  ```
- This generates TypeScript types needed for tests

### Problem: `pnpm install` fails

**Solution:**

- Try clearing the cache:
  ```bash
  pnpm store prune
  pnpm install --force
  ```
- Or use npm instead:
  ```bash
  npm install
  ```

### Still Having Issues?

- Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) for more solutions
- Open an issue on [GitHub](https://github.com/robertguss/ai-starter-kit/issues)
- Review the [Convex documentation](https://docs.convex.dev)

---

## Summary Checklist

- [ ] Node.js 18+ installed
- [ ] pnpm installed
- [ ] Project cloned
- [ ] Dependencies installed (`pnpm install`)
- [ ] Convex initialized (`bunx convex dev`)
- [ ] Clerk keys set in `.env.local`
- [ ] `CLERK_JWT_ISSUER_DOMAIN` set via `bunx convex env set`
- [ ] Dev server running (`pnpm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can sign up and log in
- [ ] Can access dashboard

---

**Next:** [Detailed Setup Guide →](./SETUP.md)
