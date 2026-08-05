import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

describe("auth.getCurrentUser", () => {
  it("returns null when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.auth.getCurrentUser, {});
    expect(result).toBeNull();
  });

  it("returns identity claims without inventing values", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({
      subject: "user_clerk_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      pictureUrl: "https://example.com/ada.png",
    });

    const result = await asUser.query(api.auth.getCurrentUser, {});
    expect(result).toEqual({
      subject: "user_clerk_123",
      name: "Ada Lovelace",
      email: "ada@example.com",
      image: "https://example.com/ada.png",
    });
  });

  it("omits missing optional claims", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({
      subject: "user_clerk_456",
    });

    const result = await asUser.query(api.auth.getCurrentUser, {});
    expect(result).toEqual({
      subject: "user_clerk_456",
      name: undefined,
      email: undefined,
      image: undefined,
    });
  });
});
