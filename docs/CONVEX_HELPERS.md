# Convex Helpers Reference

This project uses **convex-helpers** (v0.1.108) for utility functions and common
patterns. Always prefer these helpers over custom implementations.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Core Utilities](#core-utilities)
- [Validators](#validators)
- [Relationship Helpers](#relationship-helpers)
- [Custom Functions](#custom-functions)
- [CRUD Utilities](#crud-utilities)
- [Pagination](#pagination)
- [Query Streams](#query-streams)
- [Filter](#filter)
- [Triggers](#triggers)
- [Row-Level Security](#row-level-security)
- [CORS Support](#cors-support)
- [React Helpers](#react-helpers)
- [Decision Guide](#decision-guide)

---

## Quick Reference

| Category           | Helpers                                                                                | Import Path                              |
| ------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------- |
| Core Utilities     | `asyncMap`, `pick`, `omit`, `nullThrows`, `pruneNull`, `withoutSystemFields`           | `convex-helpers`                         |
| Validators         | `nullable`, `literals`, `partial`, `brandedString`, `typedV`, `deprecated`, `validate` | `convex-helpers/validators`              |
| Relationships      | `getOneFromOrThrow`, `getManyFrom`, `getManyViaOrThrow`                                | `convex-helpers/server/relationships`    |
| Custom Functions   | `customQuery`, `customMutation`, `customAction`, `customCtx`                           | `convex-helpers/server/customFunctions`  |
| CRUD               | `crud`                                                                                 | `convex-helpers/server/crud`             |
| Pagination         | `getPage`, `paginator`                                                                 | `convex-helpers/server/pagination`       |
| Streams            | `stream`, `mergedStream`                                                               | `convex-helpers/server/stream`           |
| Filter             | `filter`                                                                               | `convex-helpers/server/filter`           |
| Triggers           | `Triggers`                                                                             | `convex-helpers/server/triggers`         |
| Row-Level Security | `wrapDatabaseReader`, `wrapDatabaseWriter`                                             | `convex-helpers/server/rowLevelSecurity` |
| CORS               | `corsRouter`                                                                           | `convex-helpers/server/cors`             |
| React              | `makeUseQueryWithStatus`                                                               | `convex-helpers/react`                   |
| Query Cache        | `ConvexQueryCacheProvider`                                                             | `convex-helpers/react/cache`             |
| React Sessions     | `SessionProvider`, `useSessionQuery`                                                   | `convex-helpers/react/sessions`          |

---

## Core Utilities

Import from `convex-helpers`:

```typescript
import {
  asyncMap,
  pick,
  omit,
  nullThrows,
  pruneNull,
  withoutSystemFields,
} from "convex-helpers";
```

### asyncMap

Apply an async function to each element concurrently.

**When to use**: Processing arrays with async operations (fetching related data,
API calls).

```typescript
const posts = await asyncMap(userIds, async (userId) => {
  return await ctx.db
    .query("posts")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
});
```

### pick / omit

Select or exclude specific keys from objects.

**When to use**: Transforming objects before returning from queries.

```typescript
// Select only specific fields
const publicUser = pick(user, ["name", "email"]);

// Remove sensitive fields
const safeUser = omit(user, ["password", "apiKey"]);
```

### nullThrows

Throw an error if a value is null/undefined, with TypeScript type narrowing.

**When to use**: When a document should always exist.

```typescript
const user = await ctx.db.get(userId);
return nullThrows(user, `User ${userId} not found`);
// user is now typed as non-null
```

### pruneNull

Filter null/undefined elements from an array.

**When to use**: Cleaning up results after optional lookups.

```typescript
const users = await asyncMap(userIds, (id) => ctx.db.get(id));
return pruneNull(users); // Returns User[] instead of (User | null)[]
```

### withoutSystemFields

Remove `_id` and `_creationTime` from a document.

**When to use**: When cloning or preparing data for insertion.

```typescript
const template = await ctx.db.get(templateId);
const newDoc = withoutSystemFields(template);
await ctx.db.insert("documents", { ...newDoc, name: "Copy" });
```

---

## Validators

Import from `convex-helpers/validators`:

```typescript
import {
  nullable,
  literals,
  partial,
  brandedString,
  typedV,
  deprecated,
  validate,
} from "convex-helpers/validators";
```

### nullable

Make a validator accept null values.

**When to use**: Instead of `v.union(v.null(), v.string())`.

```typescript
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    bio: nullable(v.string()), // string | null
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { bio: args.bio });
  },
});
```

### literals

Create a union of literal string values.

**When to use**: Instead of multiple `v.literal()` calls for enums.

```typescript
export const createTask = mutation({
  args: {
    title: v.string(),
    status: literals("pending", "in_progress", "completed"),
    priority: literals("low", "medium", "high"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", args);
  },
});
```

### partial

Make all fields in a validator optional.

**When to use**: Patch/update operations where any field can be provided.

```typescript
const userFields = {
  name: v.string(),
  email: v.string(),
  age: v.number(),
};

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object(partial(userFields)),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, args.updates);
  },
});
```

### brandedString

Create branded string types for type safety.

**When to use**: Distinguishing between different string IDs or formats.

```typescript
const Email = brandedString("email");
const Slug = brandedString("slug");

export const createPost = mutation({
  args: {
    authorEmail: Email,
    slug: Slug,
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // TypeScript prevents mixing up email and slug
    await ctx.db.insert("posts", args);
  },
});
```

### typedV

Type-safe validator builder with better TypeScript inference.

**When to use**: When you need precise control over validator types.

```typescript
import { typedV } from "convex-helpers/validators";

const v = typedV<DataModel>();
// Now v.id("users") is typed correctly
```

### deprecated

Mark fields as deprecated with optional migration.

**When to use**: Migrating schema while maintaining backwards compatibility.

```typescript
const userFields = {
  name: v.string(),
  fullName: v.string(),
  // Old field, will be removed
  firstName: deprecated,
};
```

### validate

Runtime validation against validators.

**When to use**: Validating data at runtime (e.g., in actions with external
data).

```typescript
import { validate } from "convex-helpers/validators";

export const processWebhook = action({
  args: { payload: v.any() },
  handler: async (ctx, args) => {
    const schema = v.object({ userId: v.string(), event: v.string() });
    const validated = validate(schema, args.payload);
    // validated is now typed correctly
  },
});
```

---

## Relationship Helpers

Import from `convex-helpers/server/relationships`:

```typescript
import {
  getOneFrom,
  getOneFromOrThrow,
  getManyFrom,
  getManyVia,
  getManyViaOrThrow,
  getAll,
  getAllOrThrow,
  getOrThrow,
} from "convex-helpers/server/relationships";
```

### getOneFromOrThrow / getOneFrom

Fetch a single related document.

**When to use**: One-to-one relationships.

```typescript
// Get author for a post (throws if not found)
const author = await getOneFromOrThrow(ctx.db, "users", "by_id", post.authorId);

// Get author, returns null if not found
const author = await getOneFrom(ctx.db, "users", "by_id", post.authorId);
```

### getManyFrom

Fetch multiple documents from a one-to-many relationship.

**When to use**: Getting all related documents (e.g., all posts by user).

```typescript
// Get all posts by an author
const posts = await getManyFrom(ctx.db, "posts", "by_authorId", author._id);

// Get all comments on a post
const comments = await getManyFrom(ctx.db, "comments", "by_postId", post._id);
```

### getManyViaOrThrow / getManyVia

Fetch documents through a join table (many-to-many).

**When to use**: Many-to-many relationships with junction tables.

```typescript
// Schema: posts <-> postTags <-> tags
// Get all tags for a post through the postTags join table
const tags = await getManyViaOrThrow(
  ctx.db,
  "postTags", // Join table
  "tags", // Target table
  "tagId", // Field in join table pointing to target
  "by_postId", // Index on join table
  post._id, // Value to match
);
```

### getAll / getAllOrThrow

Fetch multiple documents by their IDs.

**When to use**: When you have an array of IDs to look up.

```typescript
// Get all users from an array of IDs
const users = await getAll(ctx.db, userIds);

// Throws if any ID is not found
const users = await getAllOrThrow(ctx.db, userIds);
```

### getOrThrow

Fetch a single document by ID, throwing if not found.

**When to use**: When a document must exist.

```typescript
const user = await getOrThrow(ctx.db, userId);
// Equivalent to: nullThrows(await ctx.db.get(userId))
```

---

## Custom Functions

Import from `convex-helpers/server/customFunctions`:

```typescript
import {
  customQuery,
  customMutation,
  customAction,
  customCtx,
} from "convex-helpers/server/customFunctions";
```

### customQuery / customMutation / customAction

Build customized versions of Convex functions with shared logic.

**When to use**: Add authentication, logging, or custom context to all
functions.

```typescript
import {
  customQuery,
  customMutation,
} from "convex-helpers/server/customFunctions";

// Create authenticated query wrapper
export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return { ctx: { ...ctx, identity }, args };
  },
});

// Create authenticated mutation wrapper
export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return { ctx: { ...ctx, identity }, args };
  },
});

// Use the custom wrappers
export const getUserProfile = authedQuery({
  args: {},
  handler: async (ctx, args) => {
    // ctx.identity.subject is the Clerk user id
    return ctx.identity.subject;
  },
});
```

For the mapped kit shape (`subject`, `name`, `email`, `image?`), call
`api.auth.getCurrentUser` from the client with `useQuery`.

### customCtx

Modify context with additional data.

**When to use**: When you need to add context but don't need to modify args.

```typescript
import { customCtx } from "convex-helpers/server/customFunctions";

const withIdentity = customCtx(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return { identity };
});

export const authedQuery = customQuery(query, withIdentity);
```

---

## CRUD Utilities

Import from `convex-helpers/server/crud`:

```typescript
import { crud } from "convex-helpers/server/crud";
```

### crud

Generate basic CRUD operations for a table.

**When to use**: Prototyping, admin panels, or internal functions.

```typescript
import { crud } from "convex-helpers/server/crud";
import { query, mutation } from "./_generated/server";

// Generate CRUD for users table
export const { create, read, update, destroy, paginate } = crud(
  "users",
  query,
  mutation,
);

// Creates these functions:
// - create: Insert a new document
// - read: Get a document by ID
// - update: Patch a document
// - destroy: Delete a document
// - paginate: Paginated list
```

**Note**: Consider adding authorization before exposing in production.

---

## Pagination

Import from `convex-helpers/server/pagination`:

```typescript
import { getPage, paginator } from "convex-helpers/server/pagination";
```

### getPage

Manual pagination with more control.

**When to use**: When you need specific page sizes or cursor handling.

```typescript
export const listPosts = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { page, continueCursor, isDone } = await getPage(
      ctx.db.query("posts").order("desc"),
      { cursor: args.cursor, numItems: args.limit ?? 20 },
    );
    return { posts: page, nextCursor: continueCursor, hasMore: !isDone };
  },
});
```

### paginator

Drop-in replacement for `.paginate()` that can be called multiple times.

**When to use**: When you need to call pagination multiple times in one query.

```typescript
import { paginator } from "convex-helpers/server/pagination";

export const listAllContent = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const pager = paginator(args.paginationOpts);

    // Can paginate multiple queries
    const posts = await pager.paginate(ctx.db.query("posts"));
    const comments = await pager.paginate(ctx.db.query("comments"));

    return { posts, comments };
  },
});
```

---

## Query Streams

Import from `convex-helpers/server/stream`:

```typescript
import { stream, mergedStream } from "convex-helpers/server/stream";
```

### stream / mergedStream

Construct composable, ordered streams for complex queries.

**When to use**: Merging results from multiple queries while maintaining order.

```typescript
import { stream, mergedStream } from "convex-helpers/server/stream";
import schema from "./schema";

export const getMergedFeed = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    // Create streams for different content types
    const postsStream = stream(ctx.db, schema).query("posts").order("desc");

    const announcementsStream = stream(ctx.db, schema)
      .query("announcements")
      .order("desc");

    // Merge by creation time
    const merged = mergedStream(
      [postsStream, announcementsStream],
      ["_creationTime"],
    );

    return await merged.paginate(args.paginationOpts);
  },
});
```

---

## Filter

Import from `convex-helpers/server/filter`:

```typescript
import { filter } from "convex-helpers/server/filter";
```

### filter

Apply arbitrary JavaScript/TypeScript filters to queries.

**When to use**: Complex filtering that can't be done with indexes alone.

```typescript
import { filter } from "convex-helpers/server/filter";

export const searchPosts = query({
  args: {
    authorId: v.optional(v.id("users")),
    minLikes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("posts");

    // Apply JavaScript filter for complex conditions
    return await filter(q, (post) => {
      if (args.authorId && post.authorId !== args.authorId) return false;
      if (args.minLikes && post.likes < args.minLikes) return false;
      return true;
    }).collect();
  },
});
```

**Note**: Use indexes when possible. Filter runs after fetching, so it's less
efficient for large datasets.

---

## Triggers

Import from `convex-helpers/server/triggers`:

```typescript
import { Triggers } from "convex-helpers/server/triggers";
```

### Triggers class

Register functions that run on data changes (insert, patch, replace, delete).

**When to use**: Computed fields, denormalization, cascading deletes, audit
logs.

```typescript
import { Triggers } from "convex-helpers/server/triggers";
import { DataModel } from "./_generated/dataModel";
import { mutation as rawMutation } from "./_generated/server";
import {
  customMutation,
  customCtx,
} from "convex-helpers/server/customFunctions";

const triggers = new Triggers<DataModel>();

// Update full name when first/last name changes
triggers.register("users", async (ctx, change) => {
  if (change.newDoc) {
    const fullName = `${change.newDoc.firstName} ${change.newDoc.lastName}`;
    if (change.newDoc.fullName !== fullName) {
      await ctx.db.patch(change.id, { fullName });
    }
  }
});

// Cascade delete: remove posts when user is deleted
triggers.register("users", async (ctx, change) => {
  if (change.operation === "delete") {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_authorId", (q) => q.eq("authorId", change.id))
      .collect();
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }
  }
});

// Wrap mutation to use triggers
export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
```

---

## Row-Level Security

Import from `convex-helpers/server/rowLevelSecurity`:

```typescript
import {
  wrapDatabaseReader,
  wrapDatabaseWriter,
  Rules,
} from "convex-helpers/server/rowLevelSecurity";
```

### wrapDatabaseReader / wrapDatabaseWriter

Add row-level security to database operations.

**When to use**: Restricting data access based on the current user.

```typescript
import {
  wrapDatabaseReader,
  wrapDatabaseWriter,
  Rules,
} from "convex-helpers/server/rowLevelSecurity";
import {
  customQuery,
  customMutation,
  customCtx,
} from "convex-helpers/server/customFunctions";
import { DataModel } from "./_generated/dataModel";

// Define access rules
const rules: Rules<DataModel, { userId: string }> = {
  posts: {
    read: async (ctx, post) => {
      // Users can only read their own posts or public posts
      return post.isPublic || post.authorId === ctx.userId;
    },
    write: async (ctx, post) => {
      // Users can only modify their own posts
      return post.authorId === ctx.userId;
    },
  },
};

// Create secured query
export const securedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await getAuthUser(ctx);
    return {
      db: wrapDatabaseReader({ userId: user._id }, ctx.db, rules),
    };
  }),
);

// Create secured mutation
export const securedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await getAuthUser(ctx);
    return {
      db: wrapDatabaseWriter({ userId: user._id }, ctx.db, rules),
    };
  }),
);
```

---

## CORS Support

Import from `convex-helpers/server/cors`:

```typescript
import { corsRouter } from "convex-helpers/server/cors";
```

### corsRouter

Add CORS headers to HTTP routes.

**When to use**: When your HTTP endpoints need to be called from other origins.

```typescript
import { corsRouter } from "convex-helpers/server/cors";
import { httpRouter } from "convex/server";

const http = httpRouter();

// Wrap with CORS support
const cors = corsRouter(http, {
  allowedOrigins: ["https://myapp.com", "http://localhost:3000"],
  allowedMethods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
});

cors.route({
  path: "/api/data",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Your handler
  }),
});

export default cors;
```

---

## React Helpers

### Enhanced useQuery

Import from `convex-helpers/react`:

```typescript
import { makeUseQueryWithStatus } from "convex-helpers/react";
```

Returns a status object instead of throwing errors.

```typescript
import { makeUseQueryWithStatus } from "convex-helpers/react";
import { useQuery as baseUseQuery } from "convex/react";

export const useQuery = makeUseQueryWithStatus(baseUseQuery);

// In component
function MyComponent() {
  const { data, error, isLoading, isSuccess, isError } = useQuery(
    api.posts.list,
    { limit: 10 }
  );

  if (isLoading) return <Spinner />;
  if (isError) return <Error message={error.message} />;
  return <PostList posts={data} />;
}
```

### Query Caching

Import from `convex-helpers/react/cache`:

```typescript
import { ConvexQueryCacheProvider, useQuery } from "convex-helpers/react/cache";
```

Preserve subscriptions after unmount for faster navigation.

```typescript
// In app root
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";

function App() {
  return (
    <ConvexProvider client={convex}>
      <ConvexQueryCacheProvider expiration={60000} maxIdleEntries={100}>
        <MyApp />
      </ConvexQueryCacheProvider>
    </ConvexProvider>
  );
}

// In components - use the cached version
import { useQuery } from "convex-helpers/react/cache";

function PostList() {
  // This subscription persists briefly after unmount
  const posts = useQuery(api.posts.list);
}
```

### Session Tracking

Import from `convex-helpers/react/sessions`:

```typescript
import {
  SessionProvider,
  useSessionQuery,
  useSessionMutation,
} from "convex-helpers/react/sessions";
```

Track anonymous users via client-side session IDs.

```typescript
// In app root
import { SessionProvider } from "convex-helpers/react/sessions";

function App() {
  return (
    <SessionProvider>
      <MyApp />
    </SessionProvider>
  );
}

// In components
import { useSessionQuery, useSessionMutation } from "convex-helpers/react/sessions";

function Cart() {
  // Session ID is automatically included
  const cart = useSessionQuery(api.cart.get);
  const addItem = useSessionMutation(api.cart.addItem);
}
```

---

## Decision Guide

Use this table to quickly find the right helper for your use case:

| Scenario                                              | Recommended Helper                    |
| ----------------------------------------------------- | ------------------------------------- |
| Fetch related documents (one-to-many)                 | `getManyFrom`                         |
| Fetch related documents (many-to-many via join table) | `getManyViaOrThrow`                   |
| Fetch single related document                         | `getOneFromOrThrow`                   |
| Add authentication to all queries                     | `customQuery` with auth check         |
| Make field nullable                                   | `nullable(v.field())`                 |
| Define enum-like values                               | `literals("a", "b", "c")`             |
| Make all fields optional for updates                  | `partial(fields)`                     |
| Complex filtering not supported by indexes            | `filter` helper                       |
| Multiple paginations in one query                     | `paginator` or `getPage`              |
| Merge multiple query results with order               | `stream` + `mergedStream`             |
| Computed/denormalized fields                          | `Triggers`                            |
| Row-level access control                              | `wrapDatabaseReader/Writer`           |
| CORS for HTTP endpoints                               | `corsRouter`                          |
| Process arrays concurrently                           | `asyncMap`                            |
| Clone document without system fields                  | `withoutSystemFields`                 |
| Throw if document is null                             | `nullThrows`                          |
| Filter null values from array                         | `pruneNull`                           |
| Rapid prototyping of CRUD                             | `crud`                                |
| Track anonymous users                                 | `SessionProvider` + `useSessionQuery` |
| Cache query subscriptions                             | `ConvexQueryCacheProvider`            |
| useQuery with status object                           | `makeUseQueryWithStatus`              |

---

[Previous: DATABASE](DATABASE.md) | [Next: API](API.md)
