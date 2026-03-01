---
description: Create Convex functions (queries, mutations, actions) with proper validation, auth, and patterns for this project
---

# Convex Function Creator

Create Convex functions with proper validation, authentication, and error handling for this project.

## Function Types

| Type       | Purpose      | Database Access                           | External APIs |
| ---------- | ------------ | ----------------------------------------- | ------------- |
| `query`    | Read data    | Yes (`ctx.db`)                            | No            |
| `mutation` | Write data   | Yes (`ctx.db`)                            | No            |
| `action`   | Side effects | No (use `ctx.runQuery`/`ctx.runMutation`) | Yes           |

## Query Template

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";
import { authComponent } from "./auth";

export const list = query({
  args: {
    // Define input validators
  },
  returns: v.array(
    v.object({
      // Define return type
    }),
  ),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    return await ctx.db
      .query("tableName")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});
```

## Mutation Template

```typescript
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";

export const create = mutation({
  args: {
    title: v.string(),
  },
  returns: v.id("tableName"),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    return await ctx.db.insert("tableName", {
      userId: user._id,
      title: args.title,
      createdAt: Date.now(),
    });
  },
});
```

## Action Template

```typescript
"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { authComponent } from "./auth";

export const processExternal = action({
  args: {
    itemId: v.id("tableName"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Call external API
    const response = await fetch("https://api.example.com/...");
    const data = await response.json();

    // Write results via mutation
    await ctx.runMutation(internal.tableName.saveResult, {
      itemId: args.itemId,
      result: data,
    });

    return null;
  },
});
```

## Internal Function Template

Internal functions are only callable by other Convex functions (not from clients):

```typescript
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const processItem = internalMutation({
  args: { itemId: v.id("tableName"), data: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, { processedData: args.data });
    return null;
  },
});
```

## Required Components

Every function MUST have:

1. **`args` validator** - defines and validates input types
2. **`returns` validator** - defines return type
3. **Auth check** - `authComponent.getAuthUser(ctx)` for user-facing functions
4. **Ownership verification** - check the user owns the resource before mutations

## Validator Reference

```typescript
v.string(); // string
v.number(); // number (use for timestamps)
v.boolean(); // boolean
v.int64(); // 64-bit integer (NOT v.bigint())
v.null(); // null
v.id("tableName"); // Document ID
v.array(v.string()); // Array
v.object({ key: v.string() }); // Object
v.optional(v.string()); // Optional field
v.union(v.literal("a"), v.literal("b")); // Enum/union
v.record(v.string(), v.number()); // Dynamic keys
```

## Common Patterns

### Paginated Query

```typescript
import { paginationOptsValidator } from "convex/server";

export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tableName")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

### Scheduling Work

```typescript
// Always schedule internal functions, never api functions
await ctx.scheduler.runAfter(0, internal.tasks.processItem, { itemId });
await ctx.scheduler.runAt(futureTimestamp, internal.tasks.cleanup, {});
```

### Batch Operations

```typescript
import { asyncMap } from "convex-helpers";

const results = await asyncMap(ids, async (id) => {
  return await ctx.db.get(id);
});
```

## Rules

- Never use `Date.now()` in queries (breaks reactivity)
- Never use `.filter()` on `db.query()` - use `.withIndex()` instead
- Always `await` every promise (`ctx.db.patch`, `ctx.scheduler.runAfter`, etc.)
- Add `"use node";` directive to action files using Node.js APIs
- Actions cannot access `ctx.db` directly - use `ctx.runQuery()` / `ctx.runMutation()`
