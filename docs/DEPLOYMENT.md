# Deployment Guide

This project uses the default **TanStack Start Node SSR preset** for production.
You can also add a Vercel or Cloudflare preset later by adjusting
`vite.config.ts` and the `start` script.

---

## Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Convex production deployment created
- [ ] Production environment variables set
- [ ] Frontend built and started with Node
- [ ] Custom domain configured (optional)
- [ ] Tested in production

---

## Deploy Backend (Convex)

### Step 1: Deploy to Convex Production

```bash
bunx convex deploy
```

This:

- Creates a production Convex deployment
- Pushes your schema and functions
- Returns a production URL (e.g., `https://prod-abc123.convex.cloud`)

### Step 2: Set Production Clerk Issuer

```bash
bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-domain.clerk.accounts.dev --prod
```

Get the **Frontend API URL** from your Clerk Dashboard → Configure → JWT
templates → Convex.

---

## Deploy Frontend (Node SSR)

### Step 1: Build the Application

```bash
aube install
aubr build
```

The build outputs:

- `dist/client/` - Static client assets
- `dist/server/` - SSR / server-function bundle

### Step 2: Start the Production Server

```bash
aubr start
```

This runs `srvx --prod -s ../client dist/server/server.js` and serves the app on
port `3000` by default.

### Environment Variables

Set these on your host / `.env.local` for production:

```bash
VITE_CONVEX_URL=https://prod-abc123.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_SIGN_IN_URL=/login
VITE_CLERK_SIGN_UP_URL=/signup
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

---

## Alternative Platforms

TanStack Start supports additional presets (e.g., `cloudflare-module`,
`vercel-edge`, `node-server`, etc.). To switch presets:

1. Install the preset package if needed.
2. Update `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  server: { port: 3000 },
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'app',
      server: {
        // Example: Cloudflare Workers preset
        // preset: 'cloudflare-module'
      },
    }),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: [
      {
        find: 'use-sync-external-store/shim/index.js',
        replacement: 'react',
      },
    ],
  },
})
```

3. Update the `start` script in `package.json` to match the target platform's
   server entry.

See the [TanStack Start deployment docs](https://tanstack.com/start/latest/docs/framework/react/build-and-deploy)
for details.

---

## Troubleshooting

### Build fails with `Failed to resolve ... This package is ESM only`

Make sure `"type": "module"` is set in `package.json`.

### Convex client error on the frontend

Verify `VITE_CONVEX_URL` is set to the correct deployment URL.

### Authentication not working in production

1. Verify production Clerk keys are set
2. Verify `CLERK_JWT_ISSUER_DOMAIN` is set with `--prod` on Convex
3. Confirm the Clerk Convex JWT template is active
4. Sign out and sign back in

### Server functions return 500

Check the Node server logs. Common causes:

- Missing `CLERK_SECRET_KEY`
- Incorrect `VITE_CONVEX_URL`
- `CLERK_JWT_ISSUER_DOMAIN` not set in Convex production
