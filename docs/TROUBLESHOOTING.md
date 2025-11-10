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

### "Cannot find module convex/_generated"

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
npx convex env list

# Should see:
# BETTER_AUTH_SECRET
# SITE_URL
```

### Database schema errors

**Solution:**
```bash
# Regenerate after schema changes
npx convex codegen

# Restart Convex dev
```

---

## Authentication Issues

### Can't sign up or log in

**Checklist:**
- [ ] `BETTER_AUTH_SECRET` is set
- [ ] `SITE_URL` matches your dev URL
- [ ] Convex dev is running
- [ ] No browser console errors

**Solution:**
```bash
# Verify environment variables
npx convex env list

# Restart Convex dev
npx convex dev
```

### Redirected to login after signing up

**Solution:**
Check `SITE_URL` matches exactly:
```bash
npx convex env set SITE_URL http://localhost:3000
# NOT https, NOT trailing slash
```

### "Session expired" errors

**Solution:**
- Clear browser cookies
- Check session duration in `convex/auth.config.ts`
- Re-login

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

# Update SITE_URL
npx convex env set SITE_URL http://localhost:3001
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

### "Cannot find _generated" in tests

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
# Verify production env vars
npx convex env list --prod

# Update SITE_URL to production domain
npx convex env set SITE_URL https://yourdomain.com --prod
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

**Cause:** Wrong SITE_URL configuration

**Solution:**
```bash
npx convex env set SITE_URL http://localhost:3000
```

---

## Getting More Help

- Check [Convex Documentation](https://docs.convex.dev)
- Check [Better Auth Documentation](https://better-auth.com)
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
