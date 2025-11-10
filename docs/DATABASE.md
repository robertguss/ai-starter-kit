# Database Guide

Learn about the database schema, relationships, and patterns in the AI Starter Kit.

---

## Schema Overview

The database schema is defined in `convex/schema.ts`. Convex uses a NoSQL document database with strong TypeScript typing.

### Example Tables

#### `numbers` (Example Table)

```typescript
numbers: defineTable({
  value: v.number(),
})
```

Used for demonstration in `convex/myFunctions.ts`.

### Better Auth Tables (Auto-Created)

These tables are managed by the Better Auth Convex component:

- **`authUser`** - User accounts
- **`authAccount`** - Authentication methods (email/password, OAuth)
- **`authSession`** - Active sessions
- **`authVerification`** - Email verification tokens (if enabled)

**Do not manually modify these tables!** Better Auth manages them automatically.

---

## Defining Your Schema

### Basic Table

```typescript
export default defineSchema({
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.id("authUser"),
    createdAt: v.number(),
  }),
});
```

### Adding Indexes

Indexes make queries fast:

```typescript
todos: defineTable({
  text: v.string(),
  completed: v.boolean(),
  userId: v.id("authUser"),
})
  .index("by_userId", ["userId"])
  .index("by_userId_and_completed", ["userId", "completed"])
  .searchIndex("search_text", { searchField: "text" }),
```

**Index types:**
- **Regular index** - For exact matches and range queries
- **Search index** - For full-text search

---

## Data Types

### Basic Types

```typescript
v.string()          // Text
v.number()          // Numbers (including floats)
v.boolean()         // true/false
v.null()            // null value
v.int64()           // Large integers (use instead of BigInt)
```

### Complex Types

```typescript
v.array(v.string())                    // Array of strings
v.object({ name: v.string() })         // Object with fields
v.union(v.string(), v.number())        // Either string or number
v.optional(v.string())                 // Optional field
v.id("tableName")                      // Reference to another table
```

### Example

```typescript
posts: defineTable({
  title: v.string(),
  content: v.string(),
  authorId: v.id("authUser"),
  tags: v.array(v.string()),
  metadata: v.object({
    views: v.number(),
    likes: v.number(),
  }),
  publishedAt: v.optional(v.number()),
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("archived")
  ),
}),
```

---

## Querying Patterns

### Get by ID

```typescript
const todo = await ctx.db.get(todoId);
```

### Query All

```typescript
const todos = await ctx.db.query("todos").collect();
```

### Query with Index

```typescript
const userTodos = await ctx.db
  .query("todos")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .collect();
```

### Query with Filter

```typescript
const completedTodos = await ctx.db
  .query("todos")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .filter((q) => q.eq(q.field("completed"), true))
  .collect();
```

### Limit Results

```typescript
const latestTodos = await ctx.db
  .query("todos")
  .order("desc")
  .take(10);
```

### Search

```typescript
const results = await ctx.db
  .query("todos")
  .withSearchIndex("search_text", (q) => q.search("text", searchTerm))
  .collect();
```

---

## Relationships

### One-to-Many

```typescript
// Schema
posts: defineTable({
  title: v.string(),
  authorId: v.id("authUser"),
}).index("by_authorId", ["authorId"]),

// Query
const userPosts = await ctx.db
  .query("posts")
  .withIndex("by_authorId", (q) => q.eq("authorId", userId))
  .collect();
```

### Many-to-Many

Use a join table:

```typescript
postTags: defineTable({
  postId: v.id("posts"),
  tagId: v.id("tags"),
})
  .index("by_postId", ["postId"])
  .index("by_tagId", ["tagId"]),
```

---

## Migrations

**Convex doesn't support traditional migrations.** Instead:

### Adding a Field

Make it optional:

```typescript
todos: defineTable({
  text: v.string(),
  priority: v.optional(v.string()), // New field
}),
```

Handle in code:

```typescript
const priority = todo.priority ?? "medium";
```

### Removing a Field

Just remove from schema. Old data keeps the field but TypeScript won't see it.

### Changing Field Type

1. Add new field
2. Migrate data with a mutation
3. Remove old field

```typescript
// Step 1: Add new field
todos: defineTable({
  oldStatus: v.string(),
  status: v.optional(v.union(v.literal("active"), v.literal("done"))),
}),

// Step 2: Migrate data
export const migrateStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const todos = await ctx.db.query("todos").collect();
    for (const todo of todos) {
      if (!todo.status) {
        await ctx.db.patch(todo._id, {
          status: todo.oldStatus === "completed" ? "done" : "active",
        });
      }
    }
  },
});

// Step 3: Remove oldStatus from schema
```

---

## Best Practices

### Always Use Indexes

```typescript
// ✅ Good
.withIndex("by_userId", (q) => q.eq("userId", userId))

// ❌ Bad
.filter((q) => q.eq(q.field("userId"), userId))
```

### Name Indexes Descriptively

```typescript
// ✅ Good
.index("by_userId_and_status", ["userId", "status"])

// ❌ Bad
.index("idx1", ["userId", "status"])
```

### Use Timestamps

```typescript
todos: defineTable({
  text: v.string(),
  createdAt: v.number(),   // Date.now()
  updatedAt: v.number(),   // Date.now()
}),
```

### Store User References

```typescript
todos: defineTable({
  text: v.string(),
  userId: v.id("authUser"),  // Reference to user
}),
```

---

## Troubleshooting

### "Table not found"

Run `npx convex codegen` to regenerate types.

### "Index not found"

Make sure the index is defined in schema and Convex dev is running.

### Slow queries

Add an index for the fields you're filtering/sorting on.

---

**Previous:** [← API Reference](./API.md) | **Next:** [Authentication →](./AUTHENTICATION.md)
