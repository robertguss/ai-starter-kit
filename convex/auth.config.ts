import { AuthConfig } from "convex/server";

// Placeholder keeps the first `convex dev` push working before Clerk is set up.
// Auth stays unusable until CLERK_JWT_ISSUER_DOMAIN points at a real Clerk instance.
const PLACEHOLDER_DOMAIN = "https://clerk-not-configured.invalid";

const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!domain) {
  console.warn(
    "Missing CLERK_JWT_ISSUER_DOMAIN. Authentication is disabled until you run: pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN <Frontend API URL from https://dashboard.clerk.com/apps/setup/convex>",
  );
}

export default {
  providers: [
    {
      domain: domain ?? PLACEHOLDER_DOMAIN,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
