# API Reference

Documentation for all available Convex functions in the AI Starter Kit.

---

## Table of Contents

- [Example Functions](#example-functions)
- [Authentication Functions](#authentication-functions)
- [Function Patterns](#function-patterns)
- [Error Handling](#error-handling)

---

## Example Functions

Located in `convex/myFunctions.ts` - these demonstrate Convex patterns.

### `listNumbers`

**Type:** Query (Read-only)

**Description:** Returns a list of numbers from the database, with optional limit and viewer info.

**Arguments:**
```typescript
{
  count: number  // Maximum number of results to return
}
```

**Returns:**
```typescript
{
  numbers: Array<{ _id: Id<"numbers">, value: number }>,
  viewer: string | null  // Current user's name or null
}
```

**Example Usage:**
```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const { numbers, viewer } = useQuery(api.myFunctions.listNumbers, { count: 10 });
```

---

### `addNumber`

**Type:** Mutation (Write)

**Description:** Adds a new number to the database.

**Arguments:**
```typescript
{
  value: number  // The number to add
}
```

**Returns:**
```typescript
Id<"numbers">  // The ID of the newly created number
```

**Example Usage:**
```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const addNumber = useMutation(api.myFunctions.addNumber);
await addNumber({ value: 42 });
```

---

### `doSomethingWithNumbers`

**Type:** Action (External APIs allowed)

**Description:** Demonstrates an action that combines database operations with external logic.

**Arguments:**
```typescript
{
  first: number,   // First number
  second: string   // Second value (for demonstration)
}
```

**Returns:**
```typescript
null
```

**Example Usage:**
```typescript
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

const doSomething = useAction(api.myFunctions.doSomethingWithNumbers);
await doSomething({ first: 10, second: "test" });
```

---

## Authentication Functions

Authentication is handled by Better Auth via HTTP endpoints. These are not direct Convex functions but HTTP routes registered in `convex/http.ts`.

### Authentication Endpoints

All endpoints are prefixed with `/api/auth/`:

#### `POST /api/auth/sign-up`

Create a new user account.

**Request Body:**
```typescript
{
  email: string,
  password: string,
  name?: string
}
```

**Response:**
```typescript
{
  user: { id: string, email: string },
  session: { /* session data */ }
}
```

#### `POST /api/auth/sign-in`

Log in an existing user.

**Request Body:**
```typescript
{
  email: string,
  password: string
}
```

**Response:**
```typescript
{
  user: { id: string, email: string },
  session: { /* session data */ }
}
```

#### `GET /api/auth/get-session`

Get the current user's session.

**Response:**
```typescript
{
  user: { id: string, email: string, name?: string } | null,
  session: { /* session data */ } | null
}
```

#### `POST /api/auth/sign-out`

Log out the current user.

**Response:**
```typescript
{ success: boolean }
```

### Using Auth in Components

```typescript
import { authClient } from "@/lib/auth-client";

// Sign up
await authClient.signUp.email({
  email: "user@example.com",
  password: "password123",
});

// Sign in
await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
});

// Sign out
await authClient.signOut();

// Get session
const session = await authClient.getSession();
```

### Using Auth in Convex Functions

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
    return { message: `Hello, ${user.name}` };
  },
});
```

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
  returns: v.array(v.object({
    _id: v.id("todos"),
    text: v.string(),
    completed: v.boolean(),
  })),
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
npx convex codegen
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
  handler: async (ctx, args) => { /* ... */ },
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
// ✅ Good - validates user
export const myQuery = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthorized");
    // Continue...
  },
});
```

---

## Further Reading

- [Development Guide](./DEVELOPMENT.md) - Build features
- [Database Guide](./DATABASE.md) - Schema design
- [Testing Guide](../convex/TESTING.md) - Test your functions

---

**Previous:** [← Development](./DEVELOPMENT.md) | **Next:** [Database →](./DATABASE.md)
