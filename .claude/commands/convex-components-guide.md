---
description: Guide for using and creating Convex components - self-contained mini-backends that bundle schema, functions, and data
---

# Convex Components Guide

Components are self-contained mini-backends that encapsulate functionality with their own schema, functions, and data. Use them to build modular, reusable features.

## When to Use Components

- Encapsulating a feature that has its own data and logic (e.g., rate limiting, notifications)
- Using official Convex components (rate limiter, agent, embeddings, etc.)
- Sharing functionality across multiple Convex projects
- Isolating complex subsystems from your main schema

## This Project's Components

This project already uses the Better Auth Convex component:

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import betterAuth from "@anthropic-ai/better-auth-convex/convex.config";

const app = defineApp();
app.use(betterAuth);
export default app;
```

## Official Components

| Component                 | Package                                 | Purpose                           |
| ------------------------- | --------------------------------------- | --------------------------------- |
| Rate Limiter              | `@convex-dev/rate-limiter`              | Rate limiting for functions       |
| Agent                     | `@convex-dev/agent`                     | AI agent with memory and tool use |
| Embeddings                | `@convex-dev/embeddings`                | Vector embeddings for search      |
| Persistent Text Streaming | `@convex-dev/persistent-text-streaming` | Stream LLM responses              |
| Billing (Polar)           | `@convex-dev/polar`                     | Subscription billing              |

## Installing a Component

```bash
# 1. Install the package
pnpm add @convex-dev/rate-limiter

# 2. Register in convex.config.ts
```

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import betterAuth from "@anthropic-ai/better-auth-convex/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(rateLimiter);
export default app;
```

```typescript
// 3. Use in your functions
import { RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

const limiter = new RateLimiter(components.rateLimiter, {
  sendMessage: { kind: "token bucket", rate: 10, period: 60000, capacity: 10 },
});

export const sendMessage = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await limiter.limit(ctx, "sendMessage", { key: user._id });
    // ... send message
  },
});
```

## Sibling Component Pattern

Components can't directly access each other's data. Use the **sibling pattern** to share data:

```typescript
// Parent app orchestrates communication between components
export const processWithLimiting = mutation({
  handler: async (ctx) => {
    // Check rate limit (component A)
    await limiter.limit(ctx, "process", { key: userId });

    // Do work in main app
    const result = await ctx.db.insert("results", {
      /* ... */
    });

    // Notify via another component (component B)
    await notifier.send(ctx, { message: "Done" });
  },
});
```

## Creating a Custom Component

```typescript
// my-component/convex.config.ts
import { defineComponent } from "convex/server";

export default defineComponent("myComponent");
```

```typescript
// my-component/convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    data: v.string(),
  }),
});
```

```typescript
// my-component/convex/index.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(v.object({ data: v.string() })),
  handler: async (ctx) => {
    return await ctx.db.query("items").collect();
  },
});
```

## Checklist

1. Check if an official component exists before building custom
2. Register components in `convex/convex.config.ts`
3. Use the sibling pattern for inter-component communication
4. Components have isolated schemas - they can't query each other's tables
5. Run `npx convex dev` after adding components to generate types
