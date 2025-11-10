# Development Guide

Learn how to build features, modify the database schema, and extend the AI Starter Kit.

---

## Table of Contents

- [Adding a New Page](#adding-a-new-page)
- [Creating Convex Functions](#creating-convex-functions)
- [Modifying the Database Schema](#modifying-the-database-schema)
- [Adding UI Components](#adding-ui-components)
- [Working with Forms](#working-with-forms)
- [Testing Your Code](#testing-your-code)
- [Code Organization](#code-organization)

---

## Adding a New Page

### Public Page

Create `app/about/page.tsx`:

```typescript
export default function AboutPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold">About Us</h1>
      <p>This is a public page accessible to everyone.</p>
    </div>
  );
}
```

Access at: `http://localhost:3000/about`

### Protected Page

Create `app/dashboard/settings/page.tsx`:

```typescript
import { authClient } from "@/lib/auth-client";

export default async function SettingsPage() {
  const session = await authClient.getSession();

  return (
    <div>
      <h1>Settings for {session?.user.email}</h1>
    </div>
  );
}
```

The middleware automatically protects all `/dashboard/*` routes.

---

## Creating Convex Functions

### Query (Read Data)

Add to `convex/myFunctions.ts`:

```typescript
export const getTodos = query({
  args: { userId: v.id("users") },
  returns: v.array(v.object({
    _id: v.id("todos"),
    text: v.string(),
    completed: v.boolean(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("todos")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
```

### Mutation (Write Data)

```typescript
export const addTodo = mutation({
  args: { text: v.string(), userId: v.id("users") },
  returns: v.id("todos"),
  handler: async (ctx, args) => {
    const todoId = await ctx.db.insert("todos", {
      text: args.text,
      userId: args.userId,
      completed: false,
      createdAt: Date.now(),
    });
    return todoId;
  },
});
```

### Action (External APIs)

```typescript
"use node"; // Required for Node.js built-ins

export const sendNotification = action({
  args: { email: v.string(), message: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Call external API
    await fetch("https://api.emailservice.com/send", {
      method: "POST",
      body: JSON.stringify(args),
    });

    // Log to database
    await ctx.runMutation(internal.logs.create, {
      type: "email_sent",
      email: args.email,
    });
  },
});
```

### Use in Components

```typescript
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function TodoList({ userId }: { userId: string }) {
  const todos = useQuery(api.myFunctions.getTodos, { userId });
  const addTodo = useMutation(api.myFunctions.addTodo);

  const handleAdd = async () => {
    await addTodo({ text: "New todo", userId });
  };

  return (
    <div>
      {todos?.map((todo) => <div key={todo._id}>{todo.text}</div>)}
      <button onClick={handleAdd}>Add Todo</button>
    </div>
  );
}
```

---

## Modifying the Database Schema

### Add a New Table

Edit `convex/schema.ts`:

```typescript
export default defineSchema({
  // ... existing tables

  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_completed", ["userId", "completed"]),
});
```

### Update an Existing Table

**Important:** Convex doesn't support migrations. Add optional fields:

```typescript
todos: defineTable({
  text: v.string(),
  completed: v.boolean(),
  userId: v.id("users"),
  createdAt: v.number(),
  priority: v.optional(v.string()), // New optional field
}),
```

Then handle in code:

```typescript
const priority = todo.priority ?? "medium"; // Default value
```

### Generate Types

After schema changes:

```bash
npx convex codegen
```

This updates `convex/_generated/` with new types.

---

## Adding UI Components

### Install a shadcn/ui Component

```bash
npx shadcn@latest add dialog
```

### Use the Component

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hello</DialogTitle>
        </DialogHeader>
        <p>Dialog content here</p>
      </DialogContent>
    </Dialog>
  );
}
```

### Create a Custom Component

`components/todo-card.tsx`:

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TodoCardProps {
  text: string;
  completed: boolean;
  onToggle: () => void;
}

export function TodoCard({ text, completed, onToggle }: TodoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={completed ? "line-through" : ""}>
          {text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <button onClick={onToggle}>
          {completed ? "Undo" : "Complete"}
        </button>
      </CardContent>
    </Card>
  );
}
```

---

## Working with Forms

### Basic Form with Validation

```typescript
"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TodoForm({ userId }: { userId: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const addTodo = useMutation(api.myFunctions.addTodo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      setError("Todo text is required");
      return;
    }

    try {
      await addTodo({ text, userId });
      setText("");
      setError("");
    } catch (err) {
      setError("Failed to add todo");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter todo..."
      />
      {error && <p className="text-red-500">{error}</p>}
      <Button type="submit">Add Todo</Button>
    </form>
  );
}
```

---

## Testing Your Code

### Test Convex Functions

Create `convex/todos.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { modules } from "./test.setup";
import { api } from "./_generated/api";

describe("todos", () => {
  it("should add a todo", async () => {
    const t = convexTest(schema, modules);

    const todoId = await t.mutation(api.myFunctions.addTodo, {
      text: "Test todo",
      userId: "user_123" as any,
    });

    const todos = await t.query(api.myFunctions.getTodos, {
      userId: "user_123" as any,
    });

    expect(todos).toHaveLength(1);
    expect(todos[0].text).toBe("Test todo");
  });
});
```

Run tests:

```bash
pnpm run test
```

See [Testing Guide](../convex/TESTING.md) for comprehensive patterns.

---

## Code Organization

### File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `todo-card.tsx`)
- **Pages**: `page.tsx` (Next.js convention)
- **Convex files**: `camelCase.ts` (e.g., `todoFunctions.ts`)
- **Types**: `types.ts` or inline with components

### Directory Structure Best Practices

```
app/
├── (marketing)/          # Public marketing pages
│   ├── layout.tsx
│   ├── page.tsx
│   └── about/
├── dashboard/            # Protected app area
│   ├── layout.tsx       # Shared dashboard layout
│   ├── page.tsx
│   └── todos/
│       └── page.tsx

components/
├── ui/                   # shadcn/ui (auto-generated)
├── forms/                # Form components
│   ├── todo-form.tsx
│   └── login-form.tsx
└── layouts/              # Layout components
    └── app-sidebar.tsx

convex/
├── todos.ts              # Todo functions
├── users.ts              # User functions
├── todos.test.ts         # Tests
└── schema.ts             # Database schema
```

### Import Aliases

Configured in `tsconfig.json`:

```typescript
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
```

---

## Common Patterns

### Protected Data Access

Always validate user permissions:

```typescript
export const getMyTodos = query({
  args: {},
  returns: v.array(v.object({ /* ... */ })),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthorized");

    return await ctx.db
      .query("todos")
      .withIndex("by_userId", (q) => q.eq("userId", user.id))
      .collect();
  },
});
```

### Optimistic Updates

```typescript
const addTodo = useMutation(api.todos.add).withOptimisticUpdate(
  (localStore, args) => {
    const currentTodos = localStore.getQuery(api.todos.list);
    if (currentTodos !== undefined) {
      localStore.setQuery(api.todos.list, {}, [
        ...currentTodos,
        { _id: "temp" as any, text: args.text, completed: false },
      ]);
    }
  }
);
```

### Error Handling

```typescript
try {
  await addTodo({ text });
} catch (error) {
  if (error instanceof ConvexError) {
    console.error("Convex error:", error.data);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

## Next Steps

- [API Reference](./API.md) - All available functions
- [Database Guide](./DATABASE.md) - Schema patterns
- [Testing Guide](../convex/TESTING.md) - Testing best practices
- [Deployment](./DEPLOYMENT.md) - Deploy to production

---

**Previous:** [← Architecture](./ARCHITECTURE.md) | **Next:** [API Reference →](./API.md)
