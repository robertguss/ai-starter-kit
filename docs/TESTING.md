# Testing Convex Functions

This project uses [Vitest](https://vitest.dev/) and [convex-test](https://github.com/get-convex/convex-test) for testing Convex functions.

## Running Tests

```bash
# Run tests in watch mode
aubr test

# Run tests once
aubr test:once

# Run tests with coverage
aubr test:coverage

# Debug tests
aubr test:debug
```

## Writing Tests

### Basic Test Structure

This project uses a `test.setup.ts` file to configure module resolution for convex-test. Import the `modules` from this file when setting up your tests:

```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("myFunction", () => {
  it("should do something", async () => {
    const t = convexTest(schema, modules);
    // Your test here
  });
});
```

**Important:** Create a fresh `convexTest` instance in each test to ensure test isolation. This gives each test a clean database state.

### Testing Queries

```typescript
it("should query data", async () => {
  const t = convexTest(schema, modules);
  const result = await t.query(api.myModule.listItems, { count: 10 });
  expect(result).toEqual([]);
});
```

### Testing Mutations

```typescript
it("should insert data", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.myModule.createItem, { name: "test" });

  // Verify with direct database query
  const items = await t.run(async (ctx) => {
    return await ctx.db.query("items").collect();
  });

  expect(items).toHaveLength(1);
  expect(items[0].name).toBe("test");
});
```

### Testing Actions

```typescript
it("should perform action", async () => {
  const t = convexTest(schema, modules);
  await t.action(api.myModule.myAction, { input: "test" });

  // Verify side effects
  const items = await t.run(async (ctx) => {
    return await ctx.db.query("items").collect();
  });

  expect(items).toHaveLength(1);
});
```

### Direct Database Access

For verification or setup, you can directly access the database:

```typescript
it("should access database directly", async () => {
  const t = convexTest(schema, modules);

  // Query the database directly
  const data = await t.run(async (ctx) => {
    return await ctx.db.query("tableName").collect();
  });

  // Insert data directly
  await t.run(async (ctx) => {
    await ctx.db.insert("tableName", { field: "value" });
  });
});
```

### Testing with Authentication

When testing functions that require authentication:

```typescript
it("should work with authenticated user", async () => {
  const t = convexTest(schema, modules);

  // Set up authenticated context
  const asUser = t.withIdentity({ subject: "user123", name: "Test User" });

  const result = await asUser.query(api.myModule.listItems, {
    count: 10,
  });

  expect(result).toEqual([]);
});
```

## Best Practices

1. **Create fresh test instances**: Always create a new `convexTest(schema, modules)` instance in each test for isolation
2. **Test edge cases**: Empty databases, limits, error conditions
3. **Verify side effects**: After mutations/actions, check the database state
4. **Keep tests focused**: Each test should verify one behavior
5. **Use descriptive names**: Test names should clearly describe what they're testing
6. **Test integration**: Include tests that verify multiple functions work together
7. **Import modules**: Always import `{ modules }` from `"./test.setup"` for proper function resolution

## Tips

- Tests run in an isolated environment with a clean database for each test
- You can directly access `ctx.db` for setup and verification
- Use `t.run()` to execute arbitrary code in the test context
- The test environment supports the same Convex features as your development environment
