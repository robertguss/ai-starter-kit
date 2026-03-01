---
description: Set up or extend authentication patterns in this Convex + Better Auth project
---

# Convex Authentication Setup

This project uses **Better Auth** with the Convex plugin for authentication. Use this guide when implementing auth flows, access control, or user management.

## Project Auth Architecture

- **Backend**: `convex/auth.ts` - `authComponent` client + `createAuth()` factory
- **Frontend**: `lib/auth-client.ts` - Better Auth React client with `convexClient()` plugin
- **Provider**: `app/ConvexClientProvider.tsx` - Wraps app with `ConvexBetterAuthProvider`
- **HTTP Routes**: `convex/http.ts` - Auth routes at `/api/auth/*`
- **Middleware**: `middleware.ts` - Protects `/dashboard` routes

## Getting the Current User

Always use `authComponent.getAuthUser(ctx)` from `convex/auth.ts`:

```typescript
import { authComponent } from "./auth";

export const myQuery = query({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    // user is now available with full type safety
    return null;
  },
});
```

## Custom Function Wrappers

For consistent auth enforcement, create custom function wrappers using `convex-helpers`:

```typescript
// convex/lib/customFunctions.ts
import {
  customQuery,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";
import { authComponent } from "../auth";

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return { ctx: { ...ctx, user }, args };
  },
});

export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return { ctx: { ...ctx, user }, args };
  },
});
```

Then use throughout:

```typescript
export const getTasks = authedQuery({
  args: {},
  returns: v.array(
    v.object({
      /* ... */
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .collect();
  },
});
```

## Access Control Patterns

### Owner-Only Access

```typescript
export const updateTask = authedMutation({
  args: { taskId: v.id("tasks"), text: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== ctx.user._id) throw new Error("Unauthorized");
    await ctx.db.patch(args.taskId, { text: args.text });
  },
});
```

### Role-Based Access

```typescript
import { customQuery } from "convex-helpers/server/customFunctions";

export const adminQuery = customQuery(authedQuery, {
  args: {},
  input: async (ctx, args) => {
    if (ctx.user.role !== "admin") throw new Error("Admin access required");
    return { ctx, args };
  },
});
```

### Team-Based Access

```typescript
export const teamQuery = customQuery(authedQuery, {
  args: { teamId: v.id("teams") },
  input: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_userId", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.user._id),
      )
      .unique();
    if (!membership) throw new Error("Not a team member");
    return {
      ctx: { ...ctx, teamId: args.teamId, role: membership.role },
      args,
    };
  },
});
```

## Public vs Private Queries

```typescript
// Public - no auth required
export const listPublicPosts = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
  },
});

// Private - requires auth
export const listMyDrafts = authedQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q) => q.eq("authorId", ctx.user._id))
      .collect();
  },
});
```

## Checklist

1. Read existing auth setup in `convex/auth.ts` and `lib/auth-client.ts`
2. Use `authComponent.getAuthUser(ctx)` for user lookup (not `ctx.auth.getUserIdentity()` directly)
3. Create custom function wrappers for repeated auth patterns
4. Verify resource ownership before reads/writes
5. Use `internal.*` (not `api.*`) for scheduled functions
6. Test auth flows with `convex-test` using `t.withIdentity()`
