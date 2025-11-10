# Deployment Guide

Deploy the AI Starter Kit to production with Vercel (frontend) and Convex Cloud (backend).

---

## Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Convex production deployment created
- [ ] Production environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] Tested in production

---

## Deploy Backend (Convex)

### Step 1: Deploy to Convex Production

```bash
npx convex deploy
```

This:
- Creates a production Convex deployment
- Pushes your schema and functions
- Returns a production URL (e.g., `https://prod-abc123.convex.cloud`)

### Step 2: Set Production Environment Variables

```bash
# Generate a NEW secret for production
npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32) --prod

# Set your production site URL (update after deploying frontend)
npx convex env set SITE_URL https://your-domain.vercel.app --prod
```

### Step 3: Verify Production Deployment

```bash
# List production environment variables
npx convex env list --prod

# View production dashboard
npx convex dashboard --prod
```

---

## Deploy Frontend (Vercel)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**
   - Add `NEXT_PUBLIC_CONVEX_URL` = `https://prod-abc123.convex.cloud`
   - (Use the URL from `npx convex deploy`)

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get your production URL (e.g., `https://your-app.vercel.app`)

5. **Update Convex SITE_URL**
   ```bash
   npx convex env set SITE_URL https://your-app.vercel.app --prod
   ```

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Set environment variable
vercel env add NEXT_PUBLIC_CONVEX_URL production
# Enter: https://prod-abc123.convex.cloud
```

---

## Custom Domain Setup

### Add Custom Domain in Vercel

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `myapp.com`)
4. Follow DNS configuration instructions

### Update Environment Variables

```bash
# Update SITE_URL to your custom domain
npx convex env set SITE_URL https://myapp.com --prod
```

### Configure DNS

Add these records to your DNS provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## Environment Variables Reference

### Development (.env.local)

```bash
NEXT_PUBLIC_CONVEX_URL=https://dev-abc123.convex.cloud
```

### Production (Vercel)

```bash
NEXT_PUBLIC_CONVEX_URL=https://prod-abc123.convex.cloud
```

### Convex Development

```bash
npx convex env list
# BETTER_AUTH_SECRET=...
# SITE_URL=http://localhost:3000
```

### Convex Production

```bash
npx convex env list --prod
# BETTER_AUTH_SECRET=... (different from dev!)
# SITE_URL=https://your-domain.vercel.app
```

---

## Post-Deployment Testing

### Test Authentication

1. Visit your production URL
2. Sign up with a new account
3. Verify email/password login works
4. Check that protected routes redirect correctly

### Test Database

1. Create some data in production
2. Open Convex dashboard: `npx convex dashboard --prod`
3. Verify data appears in tables

### Test Functions

1. Use your app normally
2. Check Convex dashboard logs for errors
3. Monitor function execution times

---

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys on:
- **Push to main branch** → Production deployment
- **Push to other branches** → Preview deployment

### Convex Auto-Deploy (Optional)

Enable automatic Convex deployments:

```bash
# Install Convex GitHub Action
# Add to .github/workflows/convex-deploy.yml
```

```yaml
name: Deploy Convex
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g convex
      - run: npx convex deploy --cmd 'npm install' --cmd-url-env-var-name CONVEX_URL
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

---

## Monitoring & Logs

### Convex Logs

```bash
# View production logs
npx convex logs --prod

# Tail logs in real-time
npx convex logs --prod --tail
```

### Vercel Logs

- View in Vercel Dashboard → Your Project → Logs
- Or use CLI: `vercel logs`

---

## Troubleshooting Deployment

### Frontend shows "Convex client error"

**Solution:** Verify `NEXT_PUBLIC_CONVEX_URL` is set correctly in Vercel.

### Authentication not working in production

**Solution:**
1. Check `SITE_URL` matches your production domain
2. Verify `BETTER_AUTH_SECRET` is set in production
3. Clear cookies and try again

### Database queries failing

**Solution:**
1. Run `npx convex deploy` to push latest schema
2. Check Convex dashboard for function errors
3. Verify indexes are created

### Build fails on Vercel

**Solution:**
1. Check build logs in Vercel
2. Ensure `package.json` has correct dependencies
3. Try building locally: `pnpm run build`

---

## Rollback Strategy

### Rollback Frontend

In Vercel Dashboard:
1. Go to Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Rollback Backend

```bash
# Convex doesn't support rollback directly
# Redeploy from previous git commit:
git checkout <previous-commit>
npx convex deploy --prod
git checkout main
```

---

## Performance Optimization

### Enable Vercel Analytics

```bash
pnpm add @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Enable Convex Caching

Queries are automatically cached by Convex. No configuration needed!

---

## Security Checklist

- [ ] Different `BETTER_AUTH_SECRET` for dev and production
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables not in code
- [ ] No `.env.local` in git
- [ ] CSP headers configured (optional)

---

## Cost Estimation

### Convex Free Tier

- 1GB storage
- 1M function calls/month
- Good for: Small apps, MVPs

### Convex Paid Tier

- $25/month base
- Additional usage-based pricing
- Good for: Production apps

### Vercel

- **Hobby**: Free (personal projects)
- **Pro**: $20/month/user (commercial)

---

## Next Steps After Deployment

1. Set up monitoring (Sentry, LogRocket)
2. Configure custom domain
3. Enable analytics
4. Set up backup strategy
5. Plan scaling strategy

---

**Previous:** [← Development](./DEVELOPMENT.md) | **Back to README** [→](../README.md)
