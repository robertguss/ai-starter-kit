---
description: Design Convex database schemas with proper validation, indexes, and relationship patterns
---

# Convex Schema Builder

Design schemas for the Convex document-relational database. Schemas are defined in `convex/schema.ts`.

## Schema Basics

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tableName: defineTable({
    field: v.string(),
  }).index("by_field", ["field"]),
});
```

## Validator Reference

```typescript
// Primitives
v.string(); // string
v.number(); // number (use for timestamps, floats)
v.boolean(); // boolean
v.int64(); // 64-bit integer (NOT v.bigint())
v.null(); // null
v.bytes(); // ArrayBuffer

// Complex
v.id("tableName"); // Document ID reference
v.array(v.string()); // Array of strings
v.object({ key: v.string() }); // Typed object
v.optional(v.string()); // Optional field
v.union(v.literal("a"), v.literal("b")); // Enum / union type
v.record(v.string(), v.number()); // Dynamic keys (map)
v.any(); // Any type (avoid if possible)
```

From `convex-helpers/validators`:

```typescript
import { nullable, literals, partial } from "convex-helpers/validators";

nullable(v.string()); // v.union(v.string(), v.null())
literals("a", "b", "c"); // v.union(v.literal("a"), ...)
partial(myObjectValidator); // All fields become optional
```

## Relationship Patterns

### One-to-Many

Store the foreign key on the "many" side with an index:

```typescript
// One user has many tasks
users: defineTable({
  name: v.string(),
  email: v.string(),
}),

tasks: defineTable({
  userId: v.id("users"),      // Foreign key
  title: v.string(),
  completed: v.boolean(),
})
  .index("by_userId", ["userId"]),
```

### Many-to-Many (Junction Table)

```typescript
users: defineTable({
  name: v.string(),
}),

teams: defineTable({
  name: v.string(),
}),

// Junction table
teamMembers: defineTable({
  userId: v.id("users"),
  teamId: v.id("teams"),
  role: v.union(v.literal("member"), v.literal("admin")),
  joinedAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_teamId", ["teamId"])
  .index("by_teamId_and_userId", ["teamId", "userId"]),
```

### Self-Referential (Hierarchical)

```typescript
categories: defineTable({
  name: v.string(),
  parentId: v.optional(v.id("categories")),  // Null for root
  depth: v.number(),
})
  .index("by_parentId", ["parentId"]),
```

## Index Strategy

**Rules:**

1. Every foreign key field needs an index
2. Name indexes with all fields: `by_fieldA_and_fieldB`
3. Compound indexes cover prefix queries (e.g., `by_userId_and_status` covers queries on just `userId`)
4. Don't create redundant indexes

**Common patterns:**

```typescript
tasks: defineTable({
  userId: v.id("users"),
  status: v.union(v.literal("active"), v.literal("completed")),
  priority: v.number(),
  createdAt: v.number(),
})
  // Query tasks by user
  .index("by_userId", ["userId"])
  // Query tasks by user AND status (also covers by_userId queries)
  .index("by_userId_and_status", ["userId", "status"])
  // Query tasks by status across all users
  .index("by_status", ["status"]),
```

**Using indexes in queries:**

```typescript
// Single field
await ctx.db
  .query("tasks")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .collect();

// Compound index
await ctx.db
  .query("tasks")
  .withIndex("by_userId_and_status", (q) =>
    q.eq("userId", userId).eq("status", "active"),
  )
  .collect();

// Range query on last index field
await ctx.db
  .query("tasks")
  .withIndex("by_userId_and_status", (q) =>
    q.eq("userId", userId).gte("status", "a"),
  )
  .collect();
```

## Schema Design Rules

1. **Flat documents** - avoid deeply nested objects. Use separate tables with IDs
2. **Arrays for small, bounded data** - max 8192 items. For unbounded lists, use a separate table
3. **Timestamps as numbers** - use `v.number()` with `Date.now()`, not date strings
4. **Enums as unions** - use `v.union(v.literal(...))` pattern
5. **Optional for nullable** - use `v.optional()` for fields that may not exist
6. **No circular references** - design schema as a DAG

## Anti-Patterns

**Bad** - deeply nested:

```typescript
users: defineTable({
  posts: v.array(
    v.object({
      comments: v.array(
        v.object({
          text: v.string(),
          replies: v.array(v.object({ text: v.string() })),
        }),
      ),
    }),
  ),
});
```

**Good** - flat with relationships:

```typescript
users: defineTable({ name: v.string() }),
posts: defineTable({ userId: v.id("users"), text: v.string() })
  .index("by_userId", ["userId"]),
comments: defineTable({ postId: v.id("posts"), userId: v.id("users"), text: v.string() })
  .index("by_postId", ["postId"]),
```

## Checklist

1. Define all tables in `convex/schema.ts`
2. Add validators for every field
3. Create indexes for all foreign keys
4. Use compound indexes for common query patterns
5. Name indexes descriptively: `by_fieldA_and_fieldB`
6. Keep documents flat - use IDs for relationships
7. Use `v.int64()` not `v.bigint()`
8. Run `npx convex codegen` after changes
