# Convex Development Guidelines

These rules apply when working with files in the `convex/` directory. Follow
them strictly when writing Convex functions, schemas, and related code.

## Argument Validation

All public `query`, `mutation`, and `action` functions MUST define validators
for both arguments and return types. This protects against malicious input and
provides type safety.

### Pattern

Always use the `args` and `returns` fields:

```typescript
export const createTask = mutation({
  args: {
    text: v.string(),
    userId: v.id("users"),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      text: args.text,
      userId: args.userId,
      priority: args.priority ?? "medium",
      completed: false,
    });
  },
});
```

### Internal Functions

Internal functions (from `internal.*`) can skip validators if they're only
called by trusted backend code, but it's still recommended.

### Enforcement

Enable the `@convex-dev/require-argument-validators` ESLint rule to enforce this
automatically.

## Async Handling

Always await all promises in Convex functions. Not awaiting promises (e.g.,
`await ctx.scheduler.runAfter`, `await ctx.db.patch`, `await ctx.db.insert`) may
cause unexpected behavior.

### Examples

**Bad:**

```typescript
export const updateUser = mutation({
  handler: async (ctx, args) => {
    ctx.db.patch(args.userId, { name: args.name }); // Missing await
  },
});
```

**Good:**

```typescript
export const updateUser = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { name: args.name });
  },
});
```

Enable the `no-floating-promises` ESLint rule to catch these errors.

## Authentication & Authorization

Every public function that accesses user data MUST verify authentication using
`ctx.auth.getUserIdentity()`.

### Pattern

```typescript
export const getMyTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await getUserByIdentity(ctx, identity);
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
```

### Access Control Best Practices

1. **Use unguessable IDs**: Always use Convex IDs or UUIDs for access checks,
   never spoofable data like email addresses
2. **Check ownership**: Verify the authenticated user owns or has permission to
   access the resource
3. **Never trust client**: Client can send any ID—always verify server-side

### Example: Secure Update

```typescript
export const updateTask = mutation({
  args: { taskId: v.id("tasks"), text: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const user = await getUserByIdentity(ctx, identity);
    if (task.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.taskId, { text: args.text });
  },
});
```

## Custom Functions for Data Protection

**Convex's approach to data protection:** Instead of Row Level Security (RLS)
like PostgreSQL, use **custom functions** to wrap all queries and mutations with
automatic auth and access control.

### Why Custom Functions, Not RLS?

**Traditional databases (PostgreSQL):**

- Use Row Level Security policies
- SQL-based access rules
- Runs at database layer
- Complex policy syntax

**Convex approach:**

- Use custom function wrappers
- TypeScript-based access logic
- Runs at application layer
- Full type safety and flexibility

### The Pattern

Instead of writing auth checks in every function:

#### Bad: Repeating Auth Everywhere

```typescript
export const getTasks = query({
  handler: async (ctx) => {
    // Repeated in every function!
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await getUser(ctx, identity);

    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
```

#### Good: Custom Function Wrapper

```typescript
// convex/lib/authFunctions.ts
import {
  customQuery,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";
import { getCurrentUser } from "./auth";

// Authenticated query - user automatically in ctx
export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return { ctx: { ...ctx, user }, args };
  },
});

// Authenticated mutation - user automatically in ctx
export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return { ctx: { ...ctx, user }, args };
  },
});

// Now use everywhere:
export const getTasks = authedQuery({
  handler: async (ctx) => {
    // ctx.user automatically available and typed!
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();
  },
});
```

### Common Data Protection Patterns

#### 1. Basic Authentication

```typescript
export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    return { ctx: { ...ctx, user }, args };
  },
});
```

#### 2. Role-Based Access Control (RBAC)

```typescript
export const adminQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (user.role !== "admin") {
      throw new Error("Admin access required");
    }

    return { ctx: { ...ctx, user }, args };
  },
});

// Usage
export const getAllUsers = adminQuery({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
```

#### 3. Multi-Tenant Access Control

```typescript
export const tenantQuery = customQuery(query, {
  args: { organizationId: v.id("organizations") },
  input: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", user._id),
      )
      .unique();

    if (!membership) {
      throw new Error("Not a member of this organization");
    }

    return {
      ctx: {
        ...ctx,
        user,
        organizationId: args.organizationId,
        role: membership.role,
      },
      args,
    };
  },
});
```

#### 4. Resource Ownership

```typescript
export const ownerQuery = customQuery(query, {
  args: { resourceId: v.id("resources") },
  input: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const resource = await ctx.db.get(args.resourceId);
    if (!resource) throw new Error("Resource not found");

    if (resource.ownerId !== user._id) {
      throw new Error("You don't own this resource");
    }

    return {
      ctx: { ...ctx, user, resource },
      args,
    };
  },
});
```

#### 5. Read/Write Separation

```typescript
// Read operations - more permissive
export const viewerQuery = customQuery(query, {
  args: { teamId: v.id("teams") },
  input: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .unique();

    if (!member) throw new Error("Not a team member");

    return { ctx: { ...ctx, user, teamId: args.teamId }, args };
  },
});

// Write operations - require specific role
export const editorMutation = customMutation(mutation, {
  args: { teamId: v.id("teams") },
  input: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .unique();

    if (!member || (member.role !== "editor" && member.role !== "admin")) {
      throw new Error("Editor access required");
    }

    return { ctx: { ...ctx, user, teamId: args.teamId }, args };
  },
});
```

#### 6. Public vs Private Data

```typescript
// Public query - no auth required
export const publicQuery = query;

// Private query - requires auth
export const privateQuery = authedQuery;

// Example: Blog posts
export const listPublicPosts = publicQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
  },
});

export const listMyDrafts = privateQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", ctx.user._id))
      .filter((q) => q.eq(q.field("published"), false))
      .collect();
  },
});
```

### File Organization

**Recommended structure:**

```
convex/
├── lib/
│   ├── auth.ts              # getCurrentUser helper
│   └── customFunctions.ts   # All custom wrappers
├── users.ts                 # Public functions
├── tasks.ts                 # Use authedQuery/authedMutation
├── admin.ts                 # Use adminQuery/adminMutation
└── organizations.ts         # Use tenantQuery/tenantMutation
```

### Benefits vs RLS

| Aspect      | Custom Functions (Convex) | Row Level Security (PostgreSQL) |
| ----------- | ------------------------- | ------------------------------- |
| Language    | TypeScript                | SQL                             |
| Type Safety | Full                      | Limited                         |
| Complexity  | Medium                    | High                            |
| Flexibility | Very High                 | Medium                          |
| Testing     | Easy (unit tests)         | Hard (DB-level)                 |
| Debugging   | Standard debugging        | DB logs                         |
| Reusability | High (compose wrappers)   | Medium                          |

### Key Takeaways

1. **Custom functions ARE Convex's RLS** — This is the recommended pattern
2. **Define once, use everywhere** — Create wrappers for your access patterns
3. **Compose wrappers** — Build complex access control by layering
4. **Type-safe** — Full TypeScript support, unlike SQL policies
5. **Testable** — Easy to unit test your auth logic

## Error Handling

Proper error handling makes your app reliable and debuggable. Follow these
patterns for Convex functions.

### When to Throw vs Return Null

#### Throw Errors: Exceptional Cases

Throw when something unexpected happens or requirements aren't met:

```typescript
export const updateTask = mutation({
  args: { taskId: v.id("tasks"), title: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await getCurrentUser(ctx);
    const task = await ctx.db.get(args.taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.userId !== user._id) {
      throw new Error("Unauthorized: You don't own this task");
    }

    await ctx.db.patch(args.taskId, { title: args.title });
  },
});
```

#### Return Null: Expected Cases

Return null when absence is a normal, expected possibility:

```typescript
export const getTask = query({
  args: { taskId: v.id("tasks") },
  returns: v.union(
    v.object({
      _id: v.id("tasks"),
      title: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args): Promise<Doc<"tasks"> | null> => {
    return await ctx.db.get(args.taskId);
  },
});
```

### Error Message Best Practices

**Good Error Messages:**

```typescript
throw new Error("Email already registered");
throw new Error("Invalid file type. Only PNG and JPG allowed");
throw new Error("Task limit reached (10 per user)");
throw new Error("Unauthorized: Admin access required");
```

**Bad Error Messages:**

```typescript
throw new Error("Error");
throw new Error("Failed");
throw new Error("Invalid input");
throw new Error("Something went wrong");
```

### Error Types Pattern

Create structured errors for better handling:

```typescript
// convex/lib/errors.ts
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(field: string, issue: string) {
    super(`${field}: ${issue}`);
    this.name = "ValidationError";
  }
}
```

### Client-Side Error Handling

#### Mutation Error Handling

```typescript
const createTask = useMutation(api.tasks.create);

const handleCreate = async () => {
  try {
    await createTask({ title: "New task" });
    toast.success("Task created!");
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("Failed to create task");
    }
  }
};
```

### Action Error Handling

Actions can fail in different ways:

```typescript
"use node";

export const sendEmail = action({
  args: { to: v.string(), subject: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: args.to,
          from: "noreply@example.com",
          subject: args.subject,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("SendGrid error:", error);
        throw new Error("Failed to send email");
      }

      return { success: true };
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new Error("Unable to send email. Please try again later.");
    }
  },
});
```

### Retry Pattern

For transient failures:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError!;
}
```

## Function Organization

Most business logic should live in plain TypeScript functions. Keep `query`,
`mutation`, and `action` wrappers thin—they should primarily handle arguments
and call shared logic.

### Pattern

**Bad:**

```typescript
export const createPost = mutation({
  args: { title: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    // ... 50 more lines of logic ...
  },
});
```

**Good:**

```typescript
// convex/lib/auth.ts
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) throw new Error("User not found");
  return user;
}

// convex/posts.ts
export const createPost = mutation({
  args: { title: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await createPostInternal(ctx, user._id, args);
  },
});

async function createPostInternal(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: { title: string; content: string },
) {
  return await ctx.db.insert("posts", {
    userId,
    title: args.title,
    content: args.content,
    createdAt: Date.now(),
  });
}
```

### Benefits

1. **Testable**: Plain functions can be unit tested
2. **Reusable**: Share logic between mutations/actions
3. **Readable**: Easier to understand the flow
4. **Type-safe**: Better TypeScript inference

## Avoid Date.now() in Queries

Never use `Date.now()` or `new Date()` inside query functions. It prevents
proper caching and breaks reactive subscriptions.

### Why

Queries should be deterministic. Using `Date.now()` means the query returns
different results every millisecond, defeating Convex's reactivity system.

### Bad Pattern

```typescript
export const getActiveTasks = query({
  handler: async (ctx) => {
    const now = Date.now(); // Don't do this
    return await ctx.db
      .query("tasks")
      .filter((q) => q.lt(q.field("dueDate"), now))
      .collect();
  },
});
```

### Good Solutions

#### Option 1: Pass Time as Argument

```typescript
export const getActiveTasks = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .filter((q) => q.lt(q.field("dueDate"), args.now))
      .collect();
  },
});

// Client passes current time
const tasks = useQuery(api.tasks.getActiveTasks, { now: Date.now() });
```

#### Option 2: Use Status Fields with Scheduled Functions

```typescript
// Update status periodically with a cron job
export const updateTaskStatuses = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.lt(q.field("dueDate"), now))
      .collect();

    for (const task of expiredTasks) {
      await ctx.db.patch(task._id, { status: "expired" });
    }
  },
});

// Query is simple and efficient
export const getActiveTasks = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});
```

#### Option 3: Use Coarser Time Granularity

```typescript
export const getToday = query({
  args: { today: v.string() }, // "2024-01-15"
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_date", (q) => q.eq("date", args.today))
      .collect();
  },
});
```

## Query Optimization

Avoid using `.filter()` on database queries. Instead, use indexed queries with
`.withIndex()` or filter in TypeScript after collecting results.

### Why

Using `.filter()` on queries performs a full table scan, which becomes slow as
your data grows. Indexes provide fast lookups.

### Examples

**Bad:**

```typescript
const user = await ctx.db
  .query("users")
  .filter((q) => q.eq(q.field("email"), email))
  .first();
```

**Good:**

```typescript
// In schema.ts
export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
  }).index("by_email", ["email"]),
});

// In your function
const user = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", email))
  .first();
```

### For Small Result Sets

If you must filter by a field that doesn't warrant an index:

```typescript
const allUsers = await ctx.db.query("users").collect();
const filtered = allUsers.filter((user) => user.age > 18);
```

## Scheduler and Action Safety

Always schedule `internal` functions with `ctx.scheduler`, `ctx.runAfter`,
`ctx.runAt`, and `ctx.run*` methods. Never schedule public `api` functions.

### Why

Scheduled functions bypass authentication and argument validation that public
APIs expect to receive from clients.

### Pattern

**Bad:**

```typescript
import { api } from "./_generated/api";

export const processPayment = action({
  handler: async (ctx, args) => {
    // Don't schedule api functions
    await ctx.scheduler.runAfter(0, api.users.chargeUser, {
      userId: args.userId,
      amount: args.amount,
    });
  },
});
```

**Good:**

```typescript
import { internal } from "./_generated/api";

export const chargeUserInternal = internalMutation({
  args: { userId: v.id("users"), amount: v.number() },
  handler: async (ctx, args) => {
    // ... charging logic ...
  },
});

export const processPayment = action({
  handler: async (ctx, args) => {
    // Schedule internal functions
    await ctx.scheduler.runAfter(0, internal.users.chargeUserInternal, {
      userId: args.userId,
      amount: args.amount,
    });
  },
});
```

### Internal Functions

Use `internalQuery`, `internalMutation`, and `internalAction` for functions that
should only be called from backend code:

```typescript
export const internalHelper = internalMutation({
  args: {/* ... */},
  handler: async (ctx, args) => {
    // No auth check needed - only callable from backend
  },
});
```

## Schema Design

Design schemas to be **document-relational**: relatively flat documents with
relationships via IDs, not deeply nested structures.

### Key Principles

1. **Keep documents flat**: Avoid deeply nested arrays of objects
2. **Use relationships**: Link documents via IDs across tables
3. **Add indexes early**: Index foreign keys (userId, teamId) from the start
4. **Limit array sizes**: Arrays are capped at 8,192 items—only use when there's
   a natural limit

### Bad: Deep Nesting

```typescript
export default defineSchema({
  users: defineTable({
    name: v.string(),
    posts: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        comments: v.array(
          v.object({
            text: v.string(),
            author: v.string(),
          }),
        ),
      }),
    ),
  }),
});
```

### Good: Relational Design

```typescript
export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
  }).index("by_email", ["email"]),

  posts: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"]),

  comments: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    text: v.string(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),
});
```

### When Arrays Are OK

Arrays work well for:

- Small, bounded collections (e.g., roles, tags)
- Data that's always loaded together
- Natural limits (e.g., max 5 favorites)

```typescript
users: defineTable({
  name: v.string(),
  roles: v.array(v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer"))),
  favoriteColors: v.array(v.string()), // Small list
}),
```

### Index Your Relationships

Always add indexes for foreign key lookups:

```typescript
.index("by_user", ["userId"])
.index("by_team", ["teamId"])
.index("by_parent", ["parentId"])
```

## Use Components for Encapsulation

When building features in Convex, prefer **components** over monolithic code.
Components are self-contained mini-backends that encapsulate functionality.

### What Are Components?

Components are:

- **Sandboxed** - Can't access your main app's tables unless explicitly passed
- **Self-contained** - Include their own schema, functions, and data
- **Reusable** - Can be used across multiple projects
- **Composable** - Multiple components work as siblings
- **npm-installable** - Install from npm or use locally

### When to Use Components

**Use Components For:**

- Authentication/authorization
- File storage
- Rate limiting
- Analytics/tracking
- Notifications
- Search functionality
- Workflow orchestration
- AI agents
- Third-party integrations (Stripe, SendGrid, etc.)

**Don't Use Components For:**

- Core domain models that are tightly coupled
- One-off functionality specific to your app
- Simple utility functions (use convex-helpers instead)

### With Components (Encapsulated)

```typescript
// convex.config.ts
import { defineApp } from "convex/server";
import storage from "@convex-dev/storage";
import ratelimit from "@convex-dev/ratelimiter";
import audit from "./audit/convex.config";

export default defineApp({
  components: {
    storage,
    ratelimit,
    audit,
  },
});

// convex/files.ts - clean and focused
import { components } from "./_generated/api";

export const uploadFile = mutation({
  handler: async (ctx, args) => {
    await components.ratelimit.check(ctx, { key: ctx.user._id });
    const fileId = await components.storage.store(ctx, args.file);
    await components.audit.log(ctx, { action: "upload", fileId });
    return fileId;
  },
});
```

### Component Communication

- **Parent to Component**: Main app calls component functions directly
- **Component to Parent (via passed data)**: Pass IDs/data as arguments
- **Components cannot access parent tables directly**
- **Sibling components cannot call each other directly** — must go through
  parent

### Official Components

Browse the [Component Directory](https://www.convex.dev/components):

- Clerk + Convex JWT auth (see `convex/auth.config.ts`)
- `@convex-dev/ratelimiter` - Rate limiting
- `@convex-dev/agent` - AI agent workflows
- `@convex-dev/aggregate` - Aggregations
- `@convex-dev/action-cache` - Action caching
- `@convex-dev/sharded-counter` - Distributed counters
- `@convex-dev/migrations` - Data migrations

### Quick Decision Tree

```
Need to add a feature?
├─ Is it self-contained? → YES → Use component
├─ Will you reuse it? → YES → Use component
├─ Third-party integration? → YES → Use component
└─ Complex feature with own data model? → YES → Use component
   └─ Otherwise → Main app is fine
```

## Use convex dev for Development

**Important:** Always use `npx convex dev` during development. Never use
`npx convex deploy` unless you're deploying to production.

### npx convex dev (Development)

- Runs a local development server
- Watches for file changes
- Auto-reloads functions and schema
- Uses a development deployment
- Safe to experiment and test

### npx convex deploy (Production Only!)

- Deploys to your production environment
- Used by CI/CD pipelines
- Should NOT be used during development
- Affects live users

### Correct Workflow

```bash
# Development
npx convex dev

# Production (only after thorough testing)
npm run test
npm run build
npx convex deploy
```

## Use "use node" for Node.js APIs in Actions

When you need Node.js APIs (fetch, crypto, Buffer, etc.) in Convex, you must use
**actions** with the `"use node"` directive.

### The Rule

**Files with `"use node"` can ONLY contain:**

- `action` functions
- `internalAction` functions
- Helper functions called by actions
- **NEVER** `query` or `mutation` functions

**Files without `"use node"` can contain:**

- `query` functions
- `mutation` functions
- `internalQuery` and `internalMutation` functions
- Cannot use Node.js-specific APIs

### When to Use "use node"

- External API calls
- AI/LLM integrations
- Node.js crypto
- Third-party SDKs (Stripe, OpenAI, etc.)

### File Organization

**Wrong: Mixing in Same File**

```typescript
"use node";

import { action, mutation } from "./_generated/server";

// ERROR: Cannot have mutations in "use node" file
export const create = mutation({ ... });
export const fetchData = action({ ... });
```

**Correct: Separate Files**

`convex/tasks.ts` (no "use node"):

```typescript
import { query, mutation } from "./_generated/server";

export const list = query({ ... });
export const create = mutation({ ... });
```

`convex/tasksActions.ts` (with "use node"):

```typescript
"use node";

import { action } from "./_generated/server";

export const generateTaskSuggestions = action({ ... });
```

### Common Pattern: Action to Mutation

Since actions can't directly modify the database in "use node" files:

```typescript
// convex/externalActions.ts
"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const syncFromExternalAPI = action({
  handler: async (ctx) => {
    const response = await fetch("https://api.example.com/data");
    const data = await response.json();

    await ctx.runMutation(internal.data.storeExternal, { data });
  },
});

// convex/data.ts (no "use node")
import { internalMutation } from "./_generated/server";

export const storeExternal = internalMutation({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.insert("externalData", args.data);
  },
});
```

### Quick Reference

| Need             | Use        | Directive    | Can Write      |
| ---------------- | ---------- | ------------ | -------------- |
| Database queries | `query`    | No directive | queries only   |
| Database writes  | `mutation` | No directive | mutations only |
| External API     | `action`   | `"use node"` | actions only   |
| Node.js APIs     | `action`   | `"use node"` | actions only   |
| Third-party SDKs | `action`   | `"use node"` | actions only   |

## Use Pagination for Large Datasets

Never use `.collect()` on large or unbounded queries. Use Convex's cursor-based
pagination instead.

### The Problem with .collect()

```typescript
// Bad: Loads ALL tasks - slow and breaks with large data
export const getAllTasks = query({
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});
```

### Good: Pagination

```typescript
export const getTasks = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

### When to Paginate

**Always Paginate:**

- User-generated content (posts, comments, messages)
- Activity feeds and timelines
- Search results
- Any list that could grow unbounded
- Lists with > 100 items

**Maybe Don't Paginate:**

- Small, bounded lists (user's 3 favorite colors)
- Configuration options (< 20 items)
- Tags or categories (if truly limited)

**Rule of thumb:** If it could grow to 100+ items, paginate!

### Frontend: usePaginatedQuery

```typescript
import { usePaginatedQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function TaskList() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.tasks.listTasks,
    {},
    { initialNumItems: 20 }
  );

  return (
    <div>
      {results?.map(task => (
        <TaskItem key={task._id} task={task} />
      ))}

      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(20)}>Load More</button>
      )}

      {status === "LoadingMore" && <div>Loading...</div>}
    </div>
  );
}
```

### Performance Tips

1. **Use Indexes** with paginated queries
2. **Reasonable Page Sizes**: 10-50 items per page
3. **Use `.order()`** for consistent pagination

## TypeScript Strict Mode & No Any

Convex provides **end-to-end type safety** from your database schema to your
client code. Don't throw it away by using `any`!

### Enable Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Never Use `any`

**Bad:**

```typescript
export const processData = mutation({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    const result: any = await doSomething(args.data);
    return result;
  },
});
```

**Good:**

```typescript
export const processData = mutation({
  args: {
    data: v.object({
      name: v.string(),
      age: v.number(),
      tags: v.array(v.string()),
    }),
  },
  returns: v.object({
    id: v.id("users"),
    processed: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.insert("users", {
      name: args.data.name,
      age: args.data.age,
    });
    return { id: user, processed: true };
  },
});
```

### Use Generated Types

```typescript
import { Doc, Id } from "./_generated/dataModel";

export const getTask = query({
  args: { taskId: v.id("tasks") },
  returns: v.union(
    v.object({
      _id: v.id("tasks"),
      title: v.string(),
      completed: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args): Promise<Doc<"tasks"> | null> => {
    return await ctx.db.get(args.taskId);
  },
});
```

### When You Might Need `unknown`

If you truly don't know the type, use `unknown` (not `any`). But prefer proper
validation with typed validators.

### ESLint Rule

```javascript
rules: {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-member-access": "error",
  "@typescript-eslint/no-unsafe-call": "error",
  "@typescript-eslint/no-unsafe-return": "error",
}
```

## Always Use ESLint with Convex

Every Convex project should use ESLint with the official
`@convex-dev/eslint-plugin` to catch common mistakes and enforce best practices.

### Why ESLint for Convex?

ESLint catches issues that TypeScript can't:

- Missing `await` on promises (floating promises)
- Missing argument validators
- Missing return validators
- Using `.filter()` instead of indexes
- Missing table names in database operations
- Using `.collect()` without pagination

### Quick Setup

```bash
npm install --save-dev @convex-dev/eslint-plugin
```

```javascript
// eslint.config.mjs
import convexPlugin from "@convex-dev/eslint-plugin";

export default [
  ...convexPlugin.configs.recommended,
  {
    rules: {
      // Your custom rules
    },
  },
];
```

### Essential Convex ESLint Rules

1. **No Floating Promises** (`no-floating-promises`) - Catches missing `await`
2. **Require Argument Validators** (`require-argument-validators`) - Catches
   missing `args`
3. **Explicit Table IDs** (`explicit-table-ids`) - Catches missing table names
4. **No Query Collect** (`no-query-collect`) - Warns about unbounded
   `.collect()`
5. **Prefer Indexes** (`prefer-indexes`) - Warns about `.filter()` usage

### Disabling Rules (When Necessary)

```typescript
// Disable for one line
// eslint-disable-next-line @convex-dev/no-query-collect
const all = await ctx.db.query("tasks").collect();
```

Only disable rules when you have a good reason. Most Convex ESLint rules exist
to prevent real bugs!
