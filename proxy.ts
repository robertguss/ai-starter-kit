import { clerkMiddleware } from "@clerk/nextjs/server";

function commaSeparated(value: string | undefined): string[] | undefined {
  const values = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values?.length ? values : undefined;
}

function convexConnections(): string[] {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return [];

  const origin = new URL(convexUrl).origin;
  return [origin, origin.replace(/^http/, "ws")];
}

export default clerkMiddleware({
  authorizedParties: commaSeparated(process.env.CLERK_AUTHORIZED_PARTIES),
  contentSecurityPolicy: {
    strict: true,
    directives: {
      "connect-src": [
        ...convexConnections(),
        "https://*.ingest.sentry.io",
        "https://*.ingest.us.sentry.io",
      ],
    },
  },
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
