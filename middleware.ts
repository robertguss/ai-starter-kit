import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect the /dashboard route
  if (pathname.startsWith("/dashboard")) {
    try {
      // Validate session by calling the Better Auth get-session endpoint
      const baseUrl = request.nextUrl.origin;
      const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, {
        method: "GET",
        headers: {
          // Forward the cookie header to maintain session context
          cookie: request.headers.get("cookie") || "",
        },
      });

      // Check if the session validation succeeded
      if (!sessionResponse.ok) {
        // Invalid or expired session, redirect to login
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }

      // Parse the response to validate the session data
      const sessionData = await sessionResponse.json();

      // Check if session data is valid and contains a user
      if (!sessionData || !sessionData.user) {
        // No valid user session, redirect to login
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }

      // Valid session, allow the request to proceed
      return NextResponse.next();
    } catch (error) {
      console.error("Middleware session validation error:", error);
      // On error (network, parsing, etc.), redirect to login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
