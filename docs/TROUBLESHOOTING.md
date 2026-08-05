# Troubleshooting Guide

Common issues and solutions for the AI Starter Kit.

---

## Installation Issues

### `pnpm install` fails

**Solution:**

```bash
# Clear cache
pnpm store prune

# Try again
pnpm install --force

# Or use npm
npm install
```

### Node version errors

**Solution:**

```bash
# Check version
node --version  # Should be 18.x+

# Install correct version
nvm install 20
nvm use 20
```

---

## Convex Issues

### "Cannot find module convex/\_generated"

**Solution:**

```bash
# Run Convex dev first
npx convex dev

# Then generate types
npx convex codegen
```

### Convex dev fails to start

**Solution:**

1. Check internet connection
2. Verify you're logged in: `npx convex dev`
3. Check port 3210 isn't in use
4. Try: `npx convex dev --once` to test connection

### "Unauthorized" errors in Convex functions

**Solution:**

```bash
# Verify environment variables
bunx convex env list

# Should see:
# CLERK_JWT_ISSUER_DOMAIN
```

Also confirm Clerk keys exist in `.env.local`.

### Database schema errors

**Solution:**

```bash
# Regenerate after schema changes
npx convex codegen

# Restart Convex dev
```

---

## Authentication Issues

### Convex says no auth provider matched the token

**Symptoms:**

- `useConvexAuth()` stays unauthenticated after Clerk sign-in
- `getCurrentUser` returns null while Clerk shows a signed-in user

**Cause:** The Convex JWT template is inactive, or `CLERK_JWT_ISSUER_DOMAIN` is wrong.

**Solution:**

1. Activate Convex at https://dashboard.clerk.com/apps/setup/convex
2. Set the Frontend API URL on Convex:
   ```bash
   bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://verb-noun-00.clerk.accounts.dev
   ```
3. Restart `bunx convex dev`
4. Sign out completely and sign back in

### Can't sign up or log in

**Checklist:**

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are in `.env.local`
- [ ] `CLERK_JWT_ISSUER_DOMAIN` is set on Convex
- [ ] Sign-in and sign-up URLs are `/login` and `/signup`
- [ ] Convex dev is running
- [ ] No browser console errors

**Solution:**

```bash
# Verify Convex issuer
bunx convex env list

# Restart Convex dev
bunx convex dev
```

### Redirected to login after signing up

**Solution:**

1. Confirm Clerk keys in `.env.local`
2. Confirm fallback redirect URLs point at `/dashboard`
3. Confirm `app/dashboard/layout.tsx` calls `auth.protect()`
4. Sign out fully and sign back in after enabling the JWT template

### Clerk session works but Convex identity is null

**Solution:**

- Clear browser cookies
- Confirm `applicationID: "convex"` in `convex/auth.config.ts`
- Sign out and sign in again so the Convex JWT template is on the token

---

## Build & Development Issues

### `pnpm run dev` fails

**Solution:**

```bash
# Run services separately to debug
pnpm run dev:backend   # Terminal 1
pnpm run dev:frontend  # Terminal 2
```

### Port 3000 already in use

**Solution:**

```bash
# Use different port
pnpm run dev:frontend -- -p 3001
```

### Hot reload not working

**Solution:**

1. Restart dev server
2. Clear `.next` cache: `rm -rf .next`
3. Check file changes are saving

### TypeScript errors in IDE

**Solution:**

```bash
# Regenerate types
npx convex codegen

# Restart TypeScript server in VS Code:
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

## Testing Issues

### "Cannot find \_generated" in tests

**Solution:**

```bash
npx convex codegen
pnpm run test
```

### Tests fail with "modules not found"

**Solution:**
Check `convex/test.setup.ts` exists and contains:

```typescript
import { modules } from "convex-test/test.setup.js";
export { modules };
```

### Tests timeout

**Solution:**

- Increase Vitest timeout in `vitest.config.ts`
- Check Convex functions aren't calling external APIs
- Simplify test to isolate issue

---

## Production Issues

### Build fails on Vercel

**Solution:**

1. Check build logs for specific error
2. Try building locally: `pnpm run build`
3. Ensure all dependencies are in `dependencies` (not `devDependencies`)
4. Check `NEXT_PUBLIC_CONVEX_URL` is set in Vercel

### Authentication doesn't work in production

**Solution:**

```bash
# Verify production Convex issuer
bunx convex env list --prod
# Should show CLERK_JWT_ISSUER_DOMAIN

# Confirm production Clerk keys are set in Vercel
```

### Data not syncing in production

**Solution:**

1. Check Convex dashboard logs: `npx convex dashboard --prod`
2. Verify Convex deployment: `npx convex deploy`
3. Check browser console for errors
4. Verify `NEXT_PUBLIC_CONVEX_URL` matches production URL

---

## Performance Issues

### Slow queries

**Solution:**
Add indexes in `convex/schema.ts`:

```typescript
.index("by_userId", ["userId"])
```

### Large bundle size

**Solution:**

1. Use dynamic imports for large components
2. Check for duplicate dependencies
3. Analyze bundle: `pnpm run build && npx @next/bundle-analyzer`

---

## Common Error Messages

### "ConvexError: Function not found"

**Cause:** Function name typo or not exported

**Solution:** Check function name matches in `api.myModule.functionName`

### "Validator Error: Expected X, got Y"

**Cause:** Argument type mismatch

**Solution:** Check validator definitions match your data types

### "CORS error"

**Cause:** Frontend calling a Convex URL that does not match `.env.local`

**Solution:**

```bash
# Confirm NEXT_PUBLIC_CONVEX_URL in .env.local matches your deployment
# Restart the Next.js and Convex dev servers
```

---

## Getting More Help

- Check [Convex Documentation](https://docs.convex.dev)
- Check [Clerk Documentation](https://clerk.com/docs)
- See [Authentication Guide](./AUTHENTICATION.md)
- Open an issue: [GitHub Issues](https://github.com/robertguss/ai-starter-kit/issues)
- Review existing issues for similar problems

---

## Debug Checklist

When something isn't working:

1. [ ] Check browser console for errors
2. [ ] Check terminal for error logs
3. [ ] Verify environment variables
4. [ ] Restart dev servers
5. [ ] Clear cache (`.next`, browser cache)
6. [ ] Run `npx convex codegen`
7. [ ] Check Convex dashboard for logs

---

**Previous:** [← Authentication](./AUTHENTICATION.md) | **Next:** [IDE Tools →](./IDE_TOOLS.md)
