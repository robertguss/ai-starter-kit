# API Reference

Public Convex helpers and identity patterns for this starter kit.

---

## Table of Contents

- [Authentication](#authentication)
- [Function Patterns](#function-patterns)
- [Error Handling](#error-handling)

---

## Authentication

Auth is handled by Clerk on the TanStack Start side. Convex validates Clerk
JWTs. There are no kit-owned `/api/auth/*` HTTP endpoints.

### Frontend

```tsx
import { SignIn, SignUp, useUser, useClerk } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const { isSignedIn } = useUser();
const { isAuthenticated } = useConvexAuth();
const user = useQuery(api.auth.getCurrentUser);
const { signOut } = useClerk();
```

### Backend identity

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const example = query({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    return null;
  },
});
```

### Shared helper

`api.auth.getCurrentUser` returns:

```typescript
{
  subject: string;
  name: string;
  email: string;
  image?: string;
} | null
```

See [AUTHENTICATION.md](./AUTHENTICATION.md) for setup and route protection.

---

## Function Patterns

### Queries (Read-Only)

```typescript
export const myQuery = query({
  args: { id: v.id("tableName") },
  returns: v.object({ name: v.string() }),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Not found");
    return doc;
  },
});
```

**Characteristics:**

- Cannot modify database
- Automatically cached and reactive
- Real-time updates to UI

### Mutations (Read/Write)

```typescript
export const myMutation = mutation({
  args: { name: v.string() },
  returns: v.id("tableName"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("tableName", {
      name: args.name,
      createdAt: Date.now(),
    });
    return id;
  },
});
```

**Characteristics:**

- ACID transactions
- Can read and write
- Cannot call external APIs

### Actions (Long-Running)

```typescript
"use node"; // Required for Node APIs

export const myAction = action({
  args: { url: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Call external API
    const response = await fetch(args.url);
    const data = await response.json();

    // Save to database via mutation
    await ctx.runMutation(internal.myModule.saveData, { data });
  },
});
```

**Characteristics:**

- Can call external APIs
- Cannot directly access database
- Use `ctx.runQuery/runMutation`

---

## Error Handling

### Throwing Errors in Functions

```typescript
import { ConvexError } from "convex/values";

export const myFunction = mutation({
  args: { value: v.number() },
  handler: async (ctx, args) => {
    if (args.value < 0) {
      throw new ConvexError("Value must be positive");
    }

    // Continue...
  },
});
```

### Catching Errors in Components

```typescript
import { ConvexError } from "convex/values";

try {
  await myMutation({ value: -1 });
} catch (error) {
  if (error instanceof ConvexError) {
    console.error("Validation error:", error.data);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

## Adding New Functions

### 1. Define in convex/

Create `convex/todos.ts`:

```typescript
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("todos"),
      text: v.string(),
      completed: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("todos").collect();
  },
});

export const create = mutation({
  args: { text: v.string() },
  returns: v.id("todos"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("todos", {
      text: args.text,
      completed: false,
      createdAt: Date.now(),
    });
  },
});
```

### 2. Update Schema

Add to `convex/schema.ts`:

```typescript
export default defineSchema({
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    createdAt: v.number(),
  }),
});
```

### 3. Generate Types

```bash
aubx convex codegen
```

### 4. Use in Components

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const todos = useQuery(api.todos.list);
const createTodo = useMutation(api.todos.create);

await createTodo({ text: "Buy milk" });
```

---

## Best Practices

### Always Use Validators

```typescript
// ✅ Good
export const myFunction = query({
  args: { id: v.id("table") },
  returns: v.object({ name: v.string() }),
  handler: async (ctx, args) => {
    /* ... */
  },
});

// ❌ Bad
export const myFunction = query(async (ctx, args: any) => {
  // No type safety!
});
```

### Use Indexes for Queries

```typescript
// ✅ Good - uses index
await ctx.db
  .query("todos")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .collect();

// ❌ Bad - full table scan
await ctx.db
  .query("todos")
  .filter((q) => q.eq(q.field("userId"), userId))
  .collect();
```

### Check Authentication

```typescript
// ✅ Good - validates Clerk identity
export const myQuery = query({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    // Continue with identity.subject
    return null;
  },
});
```

---

## Further Reading

- [Development Guide](./DEVELOPMENT.md) - Build features
- [Database Guide](./DATABASE.md) - Schema design
- [Testing Guide](../convex/TESTING.md) - Test your functions

---

**Previous:** [← Development](./DEVELOPMENT.md) | **Next:**
[Database →](./DATABASE.md)
