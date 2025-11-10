# Quick Start Guide

Get the AI Starter Kit running on your machine in **5 minutes**. This guide will walk you through the fastest path to a working application.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
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
- **openssl** for generating secrets (comes pre-installed on macOS/Linux)

---

## Installation Steps

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

### Step 4: Set Environment Variables

Open a **new terminal** window (keep the Convex dev server running in the first one) and run:

```bash
# Generate and set a secure auth secret
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)

# Set your local development URL
npx convex env set SITE_URL http://localhost:3000
```

**What these do:**
- `BETTER_AUTH_SECRET`: Encryption key for session tokens and hashes
- `SITE_URL`: Base URL for authentication callbacks and redirects

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
   - Navigate to `/signup` or click "Sign Up"
   - Enter an email and password (no email verification required)
   - Submit the form

3. **Log in:**
   - Navigate to `/login` or click "Log In"
   - Use the credentials you just created
   - You should be redirected to `/dashboard`

4. **Verify Convex connection:**
   - Open the Convex Dashboard: [https://dashboard.convex.dev](https://dashboard.convex.dev)
   - Or run: `npx convex dashboard`
   - You should see your project and the tables created by Better Auth

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

- **Convex Functions**: `convex/myFunctions.ts`
  - Example queries, mutations, and actions
  - See how to interact with the database

- **Auth Components**: `components/login-form.tsx` and `components/signup-form.tsx`
  - Form handling and validation
  - Better Auth integration

- **Protected Routes**: `middleware.ts`
  - See how route protection works

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

Edit `convex/myFunctions.ts` and add:

```typescript
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

const greeting = useQuery(api.myFunctions.sayHello, { name: "World" });
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
- Verify environment variables are set:
  ```bash
  npx convex env list
  ```
- You should see `BETTER_AUTH_SECRET` and `SITE_URL`
- Make sure `SITE_URL` matches your development URL (usually `http://localhost:3000`)

### Problem: Port 3000 already in use

**Solution:**
- Stop other processes on port 3000, or
- Run Next.js on a different port:
  ```bash
  pnpm run dev:frontend -- -p 3001
  ```
- Update `SITE_URL` accordingly:
  ```bash
  npx convex env set SITE_URL http://localhost:3001
  ```

### Problem: Tests fail with "Cannot find _generated"

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
- [ ] Convex initialized (`npx convex dev`)
- [ ] Environment variables set (BETTER_AUTH_SECRET, SITE_URL)
- [ ] Dev server running (`pnpm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can sign up and log in
- [ ] Can access dashboard

---

**Next:** [Detailed Setup Guide →](./SETUP.md)
