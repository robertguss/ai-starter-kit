# Convex Best Practices

Additional guidelines beyond the basics covered in CLAUDE.md. These focus on
security, performance, code quality, tooling, and architecture patterns specific
to Convex development.

## Security

### Auth Enforcement with Custom Functions

Use **custom functions** from `convex-helpers` to enforce authentication
consistently across all functions. This is Convex's alternative to Row Level
Security (RLS).

```typescript
// convex/lib/customFunctions.ts
import {
  customQuery,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return { ctx: { ...ctx, identity }, args };
  },
});

export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return { ctx: { ...ctx, identity }, args };
  },
});
```

**Bad** - repeating auth in every function:

```typescript
export const getTasks = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    // ... same boilerplate everywhere
  },
});
```

**Good** - use custom function wrappers:

```typescript
export const getTasks = authedQuery({
  handler: async (ctx) => {
    // ctx.user automatically available and typed
    return await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .collect();
  },
});
```

### Scheduler Safety

Only schedule `internal.*` functions, never `api.*` functions. Scheduled
functions bypass client auth checks, so public API functions would run without
authentication.

**Bad**:

```typescript
await ctx.scheduler.runAfter(0, api.tasks.process, { taskId });
```

**Good**:

```typescript
await ctx.scheduler.runAfter(0, internal.tasks.process, { taskId });
```

This applies to `ctx.scheduler.runAfter`, `ctx.scheduler.runAt`, and
`ctx.runMutation`/`ctx.runAction` within actions.

## Performance

### No `Date.now()` in Queries

Never use `Date.now()` or `new Date()` inside query functions. Queries must be
deterministic for Convex's caching and reactive subscription system to work
correctly.

**Bad** - breaks reactivity:

```typescript
export const getActiveTasks = query({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("tasks")
      .filter((q) => q.gt(q.field("dueAt"), now))
      .collect();
  },
});
```

**Good** - pass time as argument:

```typescript
export const getActiveTasks = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_dueAt", (q) => q.gt("dueAt", args.now))
      .collect();
  },
});
```

**Also good** - use a status field instead of time comparison:

```typescript
export const getActiveTasks = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});
```

### Pagination for Large Datasets

Never use `.collect()` on unbounded queries. Use Convex's cursor-based
pagination for large or growing datasets.

**Bad** - loads all rows into memory:

```typescript
export const getAllPosts = query({
  handler: async (ctx) => {
    return await ctx.db.query("posts").collect();
  },
});
```

**Good** - paginated:

```typescript
export const listPosts = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(v.object({/* ... */})),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

For advanced pagination patterns, see `docs/CONVEX_HELPERS.md` for `getPage`,
`paginator`, and `stream` utilities.

## Code Quality

### Always Await Promises

Every promise in Convex functions must be awaited. Un-awaited promises may cause
silent data loss or inconsistent state.

**Bad**:

```typescript
export const updateUser = mutation({
  handler: async (ctx, args) => {
    ctx.db.patch(args.userId, { name: args.name }); // Missing await!
    ctx.scheduler.runAfter(0, internal.emails.send, { userId: args.userId }); // Missing await!
  },
});
```

**Good**:

```typescript
export const updateUser = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { name: args.name });
    await ctx.scheduler.runAfter(0, internal.emails.send, {
      userId: args.userId,
    });
  },
});
```

Enable the `no-floating-promises` ESLint rule to catch these automatically.

### Function Organization

Keep `query`, `mutation`, and `action` wrappers thin. Extract business logic
into plain TypeScript functions for testability and reuse.

**Bad** - all logic in the wrapper:

```typescript
export const createProject = mutation({
  args: { name: v.string(), teamId: v.id("teams") },
  handler: async (ctx, args) => {
    // 50 lines of validation, permission checks, business logic...
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    // ... more logic
    const projectId = await ctx.db.insert("projects", {/* ... */});
    // ... even more logic
    return projectId;
  },
});
```

**Good** - thin wrapper with extracted logic:

```typescript
// Plain TypeScript function - testable, reusable
async function validateProjectCreation(
  ctx: MutationCtx,
  userId: Id<"users">,
  teamId: Id<"teams">,
) {
  const team = await ctx.db.get(teamId);
  if (!team) throw new Error("Team not found");
  // ... validation logic
  return team;
}

export const createProject = authedMutation({
  args: { name: v.string(), teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await validateProjectCreation(ctx, ctx.user._id, args.teamId);
    return await ctx.db.insert("projects", {
      name: args.name,
      teamId: args.teamId,
      ownerId: ctx.user._id,
    });
  },
});
```

### Error Handling

**Throw** for exceptional cases (bugs, auth failures, invariant violations).
**Return null** for expected absences (user not found, optional data).

**Bad** - throwing for expected cases:

```typescript
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found"); // Crashes the client!
    return user;
  },
});
```

**Good** - return null for expected absences:

```typescript
export const getUserProfile = query({
  args: { userId: v.id("users") },
  returns: v.union(v.object({/* ... */}), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId); // Returns null if not found
  },
});
```

**Good** - throw for real errors:

```typescript
export const deleteTask = authedMutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.ownerId !== ctx.user._id) throw new Error("Unauthorized");
    await ctx.db.delete(args.taskId);
  },
});
```

## Tooling

### ESLint with Convex Plugin

Use `@convex-dev/eslint-plugin` to catch Convex-specific issues automatically.

```bash
aube add -D @convex-dev/eslint-plugin
```

Add to your ESLint config:

```javascript
// eslint.config.mjs
import convexPlugin from "@convex-dev/eslint-plugin";

export default [
  // ... other configs
  ...convexPlugin.configs.recommended,
];
```

Key rules enforced:

- `@convex-dev/require-argument-validators` - ensures all public functions have
  `args` and `returns`
- `no-floating-promises` - catches un-awaited promises
- Additional Convex-specific checks

## Architecture

### Components for Encapsulation

Use Convex components to encapsulate self-contained features. Components are
mini-backends with their own schema, functions, and data.

Use the **sibling component pattern** to share data between your main app and a
component:

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";

const app = defineApp();
export default app;
```

This kit uses Clerk JWTs via `convex/auth.config.ts`, not an auth Convex
component. Official components for other features include rate limiter, agent,
embeddings, and more. See `/convex-components-guide` for details.

## Development

### Agent Mode (Cloud Coding Agents Only)

If using a cloud-based coding agent (Jules, Devin, Cursor Cloud), set up agent
mode to avoid conflicts with your dev deployment:

```bash
# In agent's environment only
CONVEX_AGENT_MODE=anonymous
```

This creates an isolated anonymous deployment. **Do not use this for local
development** - it's only for cloud agents that can't share your dev deployment.

For local AI coding (Claude Code, local Cursor), just use `aubx convex dev` as
normal.
