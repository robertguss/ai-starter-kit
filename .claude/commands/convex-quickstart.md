---
description: Scaffold a new feature module in this Convex project - creates schema, functions, and frontend integration
---

# Scaffold a New Feature Module

This project already has Convex set up. Use this guide to add a new feature module with proper schema, functions, and frontend integration.

## Step 1: Define the Schema

Add your table(s) to `convex/schema.ts`:

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ... existing tables

  // Add your new table
  yourFeature: defineTable({
    userId: v.id("users"), // Foreign key
    title: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived"),
    ),
    metadata: v.optional(
      v.object({
        tags: v.array(v.string()),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_userId_and_status", ["userId", "status"]),
});
```

**Index naming**: Include all fields (e.g., `by_userId_and_status`).

## Step 2: Create Convex Functions

Create `convex/yourFeature.ts`:

```typescript
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";

// List items for authenticated user
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("yourFeature"),
      title: v.string(),
      status: v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("archived"),
      ),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    return await ctx.db
      .query("yourFeature")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Create a new item
export const create = mutation({
  args: {
    title: v.string(),
  },
  returns: v.id("yourFeature"),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    return await ctx.db.insert("yourFeature", {
      userId: user._id,
      title: args.title,
      status: "draft",
      createdAt: Date.now(),
    });
  },
});

// Update an item (with ownership check)
export const update = mutation({
  args: {
    id: v.id("yourFeature"),
    title: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Not found");
    if (item.userId !== user._id) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

// Delete an item (with ownership check)
export const remove = mutation({
  args: { id: v.id("yourFeature") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Not found");
    if (item.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
    return null;
  },
});
```

## Step 3: Use in React

```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function YourFeatureList() {
  const items = useQuery(api.yourFeature.list);
  const createItem = useMutation(api.yourFeature.create);
  const deleteItem = useMutation(api.yourFeature.remove);

  if (items === undefined) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => createItem({ title: "New Item" })}>
        Add Item
      </button>
      {items.map((item) => (
        <div key={item._id}>
          <span>{item.title}</span>
          <button onClick={() => deleteItem({ id: item._id })}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Step 4: Add Tests

Create `convex/yourFeature.test.ts`:

```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("yourFeature", () => {
  it("should create and list items", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user1", name: "Test User" });

    const id = await asUser.mutation(api.yourFeature.create, {
      title: "Test Item",
    });

    const items = await asUser.query(api.yourFeature.list, {});
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Test Item");
  });
});
```

## Step 5: Run Codegen and Tests

```bash
npx convex codegen    # Generate types for new schema
pnpm run test:once    # Run tests
```

## Checklist

1. Define table in `convex/schema.ts` with proper indexes
2. Create functions with `args` and `returns` validators
3. Add auth checks using `authComponent.getAuthUser(ctx)`
4. Verify ownership before updates/deletes
5. Use `internal.*` for any scheduled functions
6. Add tests in `convex/yourFeature.test.ts`
7. Run `npx convex codegen` after schema changes
