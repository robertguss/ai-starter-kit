# Next.js & Convex Starter Kit

## Better Auth Setup

- [Better Auth + Convex Docs](https://convex-better-auth.netlify.app/framework-guides/next#installation)

### Set environment variables

Generate a secret for encryption and generating hashes. Use the command below if you have openssl installed, or generate your own however you like.

```bash
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
```

Add your site URL to your Convex deployment.

```bash
npx convex env set SITE_URL http://localhost:3000
```

Add environment variables to the .env.local file created by npx convex dev. It will be picked up by your framework dev server.
