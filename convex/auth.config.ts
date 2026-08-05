import { AuthConfig } from "convex/server";

const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!domain) {
  throw new Error(
    "Missing CLERK_JWT_ISSUER_DOMAIN. Set it with: bunx convex env set CLERK_JWT_ISSUER_DOMAIN <Frontend API URL from https://dashboard.clerk.com/apps/setup/convex>",
  );
}

export default {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
