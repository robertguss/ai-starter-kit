---
name: setup-starter-kit
description: Set up a fresh clone of the TanStack Start + Convex + Clerk starter kit from dependencies to a running dev server. Handles Convex dev, Clerk app/JWT setup, .env.local, and the CLERK_JWT_ISSUER_DOMAIN Convex env var. Use when the user says "set up this starter kit", "I got the CLERK_JWT_ISSUER_DOMAIN error", "create a new project from this starter kit" (after the repo is already cloned), or similar.
---

# Set up the TanStack Start + Convex + Clerk starter kit

## Goal
Take an already-cloned starter-kit repo from a fresh state to `aubr dev` with Clerk authentication working end-to-end.

## When to use
- "Set up this starter kit"
- "I got `CLERK_JWT_ISSUER_DOMAIN is used in auth config file but its value was not set`"
- "Create a new project from this starter kit" (the user has already cloned it into a new directory)
- "How do I run this after cloning?"
- "The dashboard does not load after I sign in"

## What this does NOT do
- Clone the repo. The user must have already cloned it into a new project directory.
- Store long-lived Clerk tokens. A token supplied in the current environment is used only for that session and is not written into the skill itself.
- Create a Clerk workspace. If no token or CLI session is available, the user creates the Clerk app in the dashboard.

## Before starting
Run these checks and stop with a clear message if anything fails:
1. `node -v` must be `>= 18` (prefer 20+).
2. `aube --version | head -n 1` must work. If not, point the user to https://aube.jdx.dev.
3. `package.json`, `convex/`, `app/`, and `setup.sh` must exist in the working directory. If not, the repo is not cloned here.
4. `.env.local` and `.env` files must never be committed. They should already be in `.gitignore`.

## Step 1 — Install dependencies

```bash
aube install
```

Verify `node_modules/` and `aube-lock.yaml` are present. If installation fails, try `aube install --force` once.

## Step 2 — Start Convex dev and create `.env.local`

Run Convex dev until it succeeds. This may open a browser for Convex login.

```bash
aubx convex dev --until-success
```

This will:
- Push the initial Convex functions.
- Create or update `.env.local` with `NEXT_PUBLIC_CONVEX_URL=...`.
- Print a dashboard URL like `https://dashboard.convex.dev/d/<deployment>...`.

### If you see `setRawMode EIO`
The process lost its TTY. Try one of:

```bash
# Option A: run inside a pseudo-TTY
script -q /dev/null aubx convex dev --until-success

# Option B: use the predev script, which exits after Convex is ready and then opens the dashboard
aubr predev
```

After it succeeds, confirm `.env.local` contains `NEXT_PUBLIC_CONVEX_URL`:

```bash
grep -q "^NEXT_PUBLIC_CONVEX_URL=" .env.local && echo "Convex URL found"
```

Then add `VITE_CONVEX_URL` (the starter kit uses Vite, not Next.js):

```bash
if ! grep -q "^VITE_CONVEX_URL=" .env.local; then
  CONVEX_URL=$(grep "^NEXT_PUBLIC_CONVEX_URL=" .env.local | cut -d'=' -f2 | head -n1)
  echo "VITE_CONVEX_URL=${CONVEX_URL}" >> .env.local
fi
```

## Step 3 — Add Clerk route defaults to `.env.local`

Append these only if they are not already present:

```bash
if ! grep -q "^VITE_CLERK_SIGN_IN_URL=" .env.local; then
  cat << 'EOF' >> .env.local

VITE_CLERK_SIGN_IN_URL=/login
VITE_CLERK_SIGN_UP_URL=/signup
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
EOF
fi
```

## Step 4 — Set up Clerk (Clerk CLI first)

Prefer the kit script. It is the single automated path for humans and agents.
Do **not** run `clerk init` in this repo; Clerk providers and auth routes
already exist.

References: https://clerk.com/cli/agents.txt and `.agents/skills/clerk-cli/SKILL.md`.

### Path A — Kit script (recommended)

1. Ensure the Clerk CLI can run:

   ```bash
   aubx clerk@latest --version
   ```

2. If not authenticated, the user must run this once in a browser-capable terminal:

   ```bash
   aubx clerk@latest auth login
   aubx clerk@latest whoami
   ```

3. Run the idempotent setup script:

   ```bash
   ./scripts/setup-clerk-auth.sh
   # or: aubr setup:clerk
   ```

   Agent-friendly options:

   ```bash
   ./scripts/setup-clerk-auth.sh --app-name "Starter Kit"
   ./scripts/setup-clerk-auth.sh --app app_xxxxxxxx
   ```

   If agent mode says it cannot select an application, run
   `aubx clerk@latest apps list --json`, ask the user which `id` to use, and
   re-run with `--app`.

4. The script writes route defaults + keys to `.env.local`, creates the
   `convex` JWT template when missing, and sets `CLERK_JWT_ISSUER_DOMAIN`.

### Path B — Keys already in the environment

If `CLERK_SECRET_KEY` (and ideally `VITE_CLERK_PUBLISHABLE_KEY`) are already
exported, the same script adopts them without creating an app:

```bash
export CLERK_SECRET_KEY=sk_test_...
export VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
./scripts/setup-clerk-auth.sh
```

### Path C — Manual dashboard walkthrough

Use this only when the Clerk CLI cannot run. The user performs the Clerk steps
in the browser; the agent writes the resulting values.

1. Ask the user to open https://dashboard.clerk.com/apps/new, create a new app, and then copy the `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from https://dashboard.clerk.com/last-active?path=api-keys.

2. Wait for the user to paste the keys. Append them to `.env.local` without echoing them to the terminal. The agent should use an editor or a one-off script; avoid running `echo` commands that include the secret in the command line.

3. Ask the user to open https://dashboard.clerk.com/apps/setup/convex, activate the Convex integration, and copy the Frontend API URL (Issuer). It looks like `https://verb-noun-00.clerk.accounts.dev`.

4. Set the Convex env var with the value they pasted:

   ```bash
   aubx convex env set CLERK_JWT_ISSUER_DOMAIN <Frontend API URL>
   ```

## Step 5 — Verify the setup

1. Confirm `.env.local` contains the required values:

   ```bash
   grep -E "^(VITE_CONVEX_URL|VITE_CLERK_PUBLISHABLE_KEY|CLERK_SECRET_KEY|VITE_CLERK_SIGN_IN_URL|VITE_CLERK_SIGN_UP_URL)=" .env.local
   ```

2. Confirm the Convex env var is set:

   ```bash
   aubx convex env list | grep CLERK_JWT_ISSUER_DOMAIN
   ```

   If your agent has the Convex MCP, you can also use the `envGet` tool for `CLERK_JWT_ISSUER_DOMAIN`.

3. Run the build/type-check to catch any remaining wiring issues:

   ```bash
   aubr build
   ```

   If this fails because `CLERK_JWT_ISSUER_DOMAIN` is still the placeholder, repeat Step 4.

4. Start the dev server:

   ```bash
   aubr dev
   ```

5. Ask the user to open `http://localhost:3000`, go to `/signup`, sign up, and confirm the dashboard loads. If sign-up loops or redirects to `/login`, make sure `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` and `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` are both `/dashboard`.

6. To prove authentication is wired through Convex, ask the user to confirm that `/dashboard` is reachable while signed in and returns an error/redirect when signed out.

## Step 6 — Common errors and fixes

- `CLERK_JWT_ISSUER_DOMAIN is used in auth config file but its value was not set`
  - This is the exact error the skill exists to fix. Run `aubx convex env list`. If `CLERK_JWT_ISSUER_DOMAIN` is missing, repeat Step 4 with the Frontend API URL from https://dashboard.clerk.com/apps/setup/convex.

- `setRawMode EIO`
  - Convex dev is not attached to a TTY. Run it in an interactive terminal or with `script -q /dev/null aubx convex dev --until-success`.

- `aubx convex env set` fails with an auth error
  - You are not logged into the Convex CLI for this project. Run `aubx convex dev --until-success` again or `aubx convex login`.

- Clerk sign-up redirects back to `/login` in a loop
  - Check that `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard` and `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard` are in `.env.local`.

- Dashboard loads but `ctx.auth.getUserIdentity()` is still null
  - Sign out of Clerk completely and sign back in. The JWT template is only active for sessions created after it is enabled.

- `clerk` CLI says "Cannot select an application in agent mode"
  - Provide the `--app app_xxx` flag explicitly, or run `clerk apps list --json` and ask the user to pick an `id`.

## Rules for the agent

1. Never print `CLERK_SECRET_KEY`, `CLERK_PLATFORM_API_KEY`, or any other API token in the conversation or command output.
2. Never commit `.env.local`, `.env`, or any generated secret file. Ensure they are in `.gitignore`.
3. Prefer `aubx clerk@latest` (or the project's package runner) over inventing curl-based Clerk setup when the CLI works.
4. Never run `clerk init` in this starter kit; use `./scripts/setup-clerk-auth.sh`.
5. Run interactive commands in a TTY when possible to avoid `setRawMode EIO`.
6. Stop and ask the user whenever a browser login is required.
7. Always verify `CLERK_JWT_ISSUER_DOMAIN` is set in the Convex deployment before declaring the setup complete.
