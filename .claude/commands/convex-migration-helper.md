---
description: Guide for safely migrating Convex schema changes - adding fields, changing types, renaming, and batch processing
---

# Convex Migration Helper

Safe patterns for evolving your Convex schema without data loss.

## Safe vs Breaking Changes

**Safe (no migration needed)**:

- Adding a new optional field
- Adding a new table
- Adding a new index
- Removing an index

**Breaking (migration required)**:

- Adding a required field to existing table
- Changing a field's type
- Renaming a field
- Removing a field that has data

## Pattern: Adding a Required Field

Never add a required field directly. Follow this 3-step process:

### Step 1: Add as Optional

```typescript
// convex/schema.ts
tasks: defineTable({
  title: v.string(),
  priority: v.optional(
    v.union(
      // Start as optional
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
  ),
});
```

### Step 2: Backfill Existing Data

```typescript
// convex/migrations.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const backfillPriority = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("priority"), undefined))
      .take(100); // Process in batches

    for (const task of tasks) {
      await ctx.db.patch(task._id, { priority: "medium" });
    }

    if (tasks.length === 100) {
      // More to process - schedule next batch
      await ctx.scheduler.runAfter(0, internal.migrations.backfillPriority, {});
    }

    return tasks.length;
  },
});
```

### Step 3: Make Required

After all data is backfilled, change the schema:

```typescript
tasks: defineTable({
  title: v.string(),
  priority: v.union(
    // Now required
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
  ),
});
```

## Pattern: Changing a Field Type

Example: changing `status` from string to enum.

### Step 1: Add New Field

```typescript
tasks: defineTable({
  status: v.string(), // Old field
  statusEnum: v.optional(
    v.union(
      // New field
      v.literal("active"),
      v.literal("completed"),
    ),
  ),
});
```

### Step 2: Dual-Write

Update all mutations to write both fields:

```typescript
export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("active"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: args.status, // Old field
      statusEnum: args.status, // New field
    });
  },
});
```

### Step 3: Backfill

```typescript
export const migrateStatus = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("statusEnum"), undefined))
      .take(100);

    for (const task of tasks) {
      const mapped = task.status === "done" ? "completed" : "active";
      await ctx.db.patch(task._id, { statusEnum: mapped });
    }

    if (tasks.length === 100) {
      await ctx.scheduler.runAfter(0, internal.migrations.migrateStatus, {});
    }

    return tasks.length;
  },
});
```

### Step 4: Switch Reads and Remove Old Field

Once backfill is complete, update queries to read from `statusEnum`, remove the old `status` field from schema, and rename if desired.

## Pattern: Renaming a Field

Same as changing type - add new field, dual-write, backfill, switch reads, remove old.

## Batch Processing Template

For any migration that processes large amounts of data:

```typescript
export const batchMigration = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    processed: v.optional(v.number()),
  },
  returns: v.object({
    processed: v.number(),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const batchSize = 100;
    let processed = args.processed ?? 0;

    const results = await ctx.db
      .query("tableName")
      .paginate({ numItems: batchSize, cursor: args.cursor ?? null });

    for (const doc of results.page) {
      // Your migration logic here
      await ctx.db.patch(doc._id, {
        /* changes */
      });
      processed++;
    }

    if (!results.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.batchMigration, {
        cursor: results.continueCursor,
        processed,
      });
    }

    return { processed, done: results.isDone };
  },
});
```

## Testing Migrations

```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("migrations", () => {
  it("should backfill priority field", async () => {
    const t = convexTest(schema, modules);

    // Insert test data without the new field
    await t.run(async (ctx) => {
      await ctx.db.insert("tasks", { title: "Test", status: "active" });
    });

    // Run migration
    await t.mutation(internal.migrations.backfillPriority, {});

    // Verify
    const tasks = await t.run(async (ctx) => {
      return await ctx.db.query("tasks").collect();
    });

    expect(tasks[0].priority).toBe("medium");
  });
});
```

## Checklist

1. Never add required fields directly - always start optional
2. Use batch processing (100 docs per batch) for large migrations
3. Schedule next batch with `ctx.scheduler.runAfter(0, internal...)`
4. Always use `internal.*` functions for migrations
5. Test migrations with `convex-test` before running on production
6. Run `npx convex codegen` after schema changes
