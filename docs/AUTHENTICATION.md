# Authentication Guide

Complete guide to authentication in the AI Starter Kit using Better Auth + Convex.

---

## Overview

This starter uses **Better Auth** with native Convex integration for:
- Email/password authentication
- Session management
- Protected routes
- User account management

---

## How It Works

### Architecture

```
User → Login Form → Better Auth HTTP Endpoint
         ↓
     Validates credentials
         ↓
     Creates session in Convex
         ↓
     Sets secure cookie
         ↓
     Redirects to dashboard
```

### Configuration Files

- `convex/auth.config.ts` - Better Auth settings
- `convex/auth.ts` - Auth helper functions
- `convex/http.ts` - HTTP routes for auth
- `lib/auth-client.ts` - Frontend auth client
- `middleware.ts` - Route protection

---

## Using Authentication

### Sign Up

```typescript
import { authClient } from "@/lib/auth-client";

await authClient.signUp.email({
  email: "user@example.com",
  password: "securepassword",
  name: "John Doe", // optional
});
```

### Sign In

```typescript
await authClient.signIn.email({
  email: "user@example.com",
  password: "securepassword",
});
```

### Sign Out

```typescript
await authClient.signOut();
```

### Get Current Session

```typescript
const session = await authClient.getSession();
if (session) {
  console.log(session.user.email);
}
```

---

## Protected Routes

### Middleware Protection

All `/dashboard/*` routes are automatically protected by `middleware.ts`:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Check session
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect("/login?redirect=" + pathname);
    }
  }
}
```

### Protect Convex Functions

```typescript
import { authComponent } from "./auth";

export const myProtectedQuery = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // User is authenticated
    return { userId: user.id };
  },
});
```

---

## Customization

### Change Session Duration

Edit `convex/auth.config.ts`:

```typescript
export const authConfig = {
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days (in seconds)
  },
};
```

### Enable Email Verification

```typescript
export const authConfig = {
  requireEmailVerification: true,
  // Configure email sending...
};
```

### Add OAuth Providers

Coming soon! See [ROADMAP.md](../ROADMAP.md)

---

## Database Tables

Better Auth creates these tables automatically:

- **authUser** - User accounts
- **authAccount** - Login methods (email, OAuth)
- **authSession** - Active sessions
- **authVerification** - Email verification tokens

**Do not manually modify these tables!**

---

## Security Best Practices

- ✅ Passwords are hashed with bcrypt
- ✅ Sessions are encrypted
- ✅ CSRF protection enabled
- ✅ Secure cookies (httpOnly, sameSite)
- ✅ Environment variables for secrets

---

**Previous:** [← Database](./DATABASE.md) | **Next:** [Troubleshooting →](./TROUBLESHOOTING.md)
