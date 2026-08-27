---
name: setup-starter-kit
description: Set up a fresh clone of the Next.js + Convex + Clerk Web App Starter Kit through a running, verified development app. Use for first-time setup, missing CLERK_JWT_ISSUER_DOMAIN errors, or broken Clerk-to-Convex authentication.
---

# Set up Web App Starter Kit

## Outcome

Take an already-cloned repository from no local configuration to a running
Next.js application with Clerk sessions accepted by Convex.

This setup can create/link Clerk and Convex resources. Confirm the user wants
those external changes before running it. Never create production resources or
reuse production credentials for local development.

## Preflight

From the repository root, verify:

1. `node --version` reports Node.js 24.x.
2. `pnpm --version` reports pnpm 11.x.
3. `package.json`, `pnpm-lock.yaml`, `app/`, `convex/`, and `setup.sh` exist.
4. `.env.local` is ignored by Git.
5. Clerk and Convex browser authentication can be completed if the CLIs need it.

Do not print secret values or commit any `.env*` file.

## Preferred setup

For an interactive local terminal:

```bash
./setup.sh
```

For an agent/non-interactive run where an existing Clerk application is known:

```bash
./setup.sh --yes --no-dev --clerk-app app_xxx
```

The script performs the supported sequence:

1. `pnpm install --frozen-lockfile`
2. `pnpm exec convex dev --until-success`
3. `pnpm setup:clerk`
4. optional `pnpm dev`

Use `--skip-convex` or `--skip-clerk` only when intentionally deferring that
provider. Use `--clerk-app-name "Web App Starter Kit"` to name a new Clerk app.

Do **not** run `clerk init`; the repository already owns its providers, proxy,
auth routes, and environment conventions.

## Manual sequence

Use this when diagnosing one failed setup stage:

```bash
pnpm install --frozen-lockfile
pnpm exec convex dev --until-success
pnpm dlx clerk@latest auth login
pnpm setup:clerk
pnpm check
pnpm build
pnpm dev
```

The Clerk setup script is idempotent. It:

- writes `NEXT_PUBLIC_CLERK_*` route defaults for `/sign-in`, `/sign-up`, and
  `/dashboard`
- creates or links a Clerk application and writes its local keys
- creates the Clerk JWT template named `convex` with audience `convex`
- sets `CLERK_JWT_ISSUER_DOMAIN` on the linked Convex deployment
- migrates legacy local `VITE_*` values when they exist

If agent mode cannot select a Clerk app, list IDs with:

```bash
pnpm dlx clerk@latest apps list --json
```

Ask the user which application to use, then rerun with `--app app_xxx`. Do not
guess or create another application without approval.

## Manual Clerk dashboard fallback

Use only when the Clerk CLI cannot authenticate:

1. Create/link an app at <https://dashboard.clerk.com/apps/new>.
2. Get keys at <https://dashboard.clerk.com/last-active?path=api-keys>.
3. Configure Convex at <https://dashboard.clerk.com/apps/setup/convex>.
4. Put `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in
   `.env.local` without echoing them in terminal output.
5. Set Clerk's Frontend API URL on the linked Convex deployment:

   ```bash
   pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN <issuer-url>
   ```

The required local variable names are:

```text
NEXT_PUBLIC_CONVEX_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

## Verification

Verify names are present without printing values:

```bash
for key in \
  NEXT_PUBLIC_CONVEX_URL \
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
  CLERK_SECRET_KEY \
  NEXT_PUBLIC_CLERK_SIGN_IN_URL \
  NEXT_PUBLIC_CLERK_SIGN_UP_URL; do
  grep -q "^${key}=" .env.local || { echo "Missing ${key}"; exit 1; }
done

pnpm exec convex env list | grep -q '^CLERK_JWT_ISSUER_DOMAIN='
pnpm test:setup
pnpm typecheck
pnpm build
```

Then exercise auth end to end:

1. Start `pnpm dev`. In an Amp orb, use the repository's supervised Amp service
   configuration rather than a detached shell process.
2. Open `/sign-up`, create a development user, and verify redirect to
   `/dashboard`.
3. Create a project and verify it appears in the list.
4. Sign out and verify `/dashboard` redirects to `/sign-in`.
5. Sign back in and verify the project remains.

After first creating the `convex` JWT template, sign out completely and sign in
again so Clerk issues a session containing that template.

## Failure guide

- **`CLERK_JWT_ISSUER_DOMAIN ... was not set`**: link Convex, then rerun
  `pnpm setup:clerk` or set the Frontend API URL manually.
- **Convex reports no deployment**: run
  `pnpm exec convex dev --until-success` in an interactive terminal.
- **Clerk CLI is unauthenticated**: run
  `pnpm dlx clerk@latest auth login`; browser login requires the user.
- **Clerk cannot select an application in agent mode**: obtain explicit app
  selection and pass `--app`.
- **Dashboard loads but Convex auth is not ready**: verify the JWT template name
  and audience are both `convex`, then sign out and in again.
- **Sign-in/up redirect loop**: verify the four `NEXT_PUBLIC_CLERK_*` route
  variables use `/sign-in`, `/sign-up`, and `/dashboard`.

## Agent rules

1. Never print, log, or commit Clerk, Convex, Sentry, or Vercel secrets.
2. Never run `clerk init` in this repository.
3. Use pnpm commands only; do not recreate aube/npm/yarn lockfiles.
4. Do not silently create provider resources when app/project selection is
   ambiguous.
5. Do not claim setup is complete until both the local wiring checks and an
   authenticated Convex operation succeed.
