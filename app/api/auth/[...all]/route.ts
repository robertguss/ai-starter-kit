import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

const { handler } = convexBetterAuthNextJs({
  convexUrl:
    process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.site",
  convexSiteUrl:
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
    "https://placeholder.convex.site",
});

export const { GET, POST } = handler;
