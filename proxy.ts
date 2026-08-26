import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { clerkAuthorizedParties, convexConnectSources } from "@/lib/env";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  },
  {
    authorizedParties: clerkAuthorizedParties(),
    contentSecurityPolicy: {
      strict: true,
      directives: {
        "connect-src": [
          ...convexConnectSources(),
          "https://*.ingest.sentry.io",
          "https://*.ingest.us.sentry.io",
        ],
      },
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
