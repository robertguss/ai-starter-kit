---
description: Quick reference for convex-helpers utilities available in this project - custom functions, relationships, validators, and more
---

# Convex Helpers Quick Reference

This project includes **convex-helpers** (v0.1.108). Always prefer these helpers over custom implementations.

For comprehensive documentation, see **`docs/CONVEX_HELPERS.md`**.

## Most Important: Custom Functions

The single most useful pattern from convex-helpers. Create auth-enforced wrappers:

```typescript
import {
  customQuery,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";
import { authComponent } from "../auth";

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return { ctx: { ...ctx, user }, args };
  },
});
```

## Relationship Helpers

Traverse database relationships without manual queries:

```typescript
import {
  getOneFromOrThrow,
  getManyFrom,
} from "convex-helpers/server/relationships";

// Get one related document (throws if not found)
const user = await getOneFromOrThrow(ctx.db, "users", "by_email", email);

// Get many related documents
const tasks = await getManyFrom(ctx.db, "tasks", "by_userId", userId);
```

## Enhanced Validators

Beyond standard `v.*`:

```typescript
import {
  nullable,
  literals,
  partial,
  brandedString,
} from "convex-helpers/validators";

// Nullable (value OR null)
nullable(v.string()); // v.union(v.string(), v.null())

// Literals shorthand
literals("admin", "user", "guest"); // v.union(v.literal("admin"), ...)

// Partial (all fields optional)
partial(myObjectValidator);

// Branded strings for type safety
const EmailAddress = brandedString("email");
```

## Utility Functions

```typescript
import {
  asyncMap,
  pick,
  omit,
  nullThrows,
  withoutSystemFields,
} from "convex-helpers";

// Map async operations
const users = await asyncMap(userIds, (id) => ctx.db.get(id));

// Pick/omit fields
const publicUser = pick(user, ["name", "email"]);
const noTimestamps = omit(user, ["_creationTime"]);

// Assert non-null
const user = nullThrows(await ctx.db.get(userId), "User not found");

// Remove _id and _creationTime
const cleanData = withoutSystemFields(document);
```

## Import Paths

| Feature          | Import Path                             |
| ---------------- | --------------------------------------- |
| Custom Functions | `convex-helpers/server/customFunctions` |
| Relationships    | `convex-helpers/server/relationships`   |
| Validators       | `convex-helpers/validators`             |
| Utilities        | `convex-helpers`                        |
| Filter Helper    | `convex-helpers/server/filter`          |
| Pagination       | `convex-helpers/server/pagination`      |
| React Hooks      | `convex-helpers/react`                  |
| Sessions         | `convex-helpers/server/sessions`        |
| Migrations       | `convex-helpers/server/migrations`      |
| Triggers         | `convex-helpers/server/triggers`        |

## When to Use What

| Need                     | Helper                                  |
| ------------------------ | --------------------------------------- |
| Auth in every function   | `customQuery` / `customMutation`        |
| Get related records      | `getOneFromOrThrow` / `getManyFrom`     |
| Complex filtering (rare) | `filter()` helper                       |
| Paginate large datasets  | `getPage` / `paginator`                 |
| Null-safe access         | `nullThrows`                            |
| Clean API responses      | `withoutSystemFields` / `pick` / `omit` |

Refer to `docs/CONVEX_HELPERS.md` for detailed examples and advanced patterns.
