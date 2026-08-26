import { afterEach, describe, expect, it } from "vitest";

import {
  clerkAuthorizedParties,
  commaSeparated,
  convexConnectSources,
  getPublicConvexUrl,
} from "./env";

const originalConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const originalAuthorizedParties = process.env.CLERK_AUTHORIZED_PARTIES;

afterEach(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = originalConvexUrl;
  process.env.CLERK_AUTHORIZED_PARTIES = originalAuthorizedParties;
});

describe("commaSeparated", () => {
  it("returns undefined for empty input", () => {
    expect(commaSeparated(undefined)).toBeUndefined();
    expect(commaSeparated("")).toBeUndefined();
    expect(commaSeparated("  ,  ")).toBeUndefined();
  });

  it("splits and trims values", () => {
    expect(
      commaSeparated("http://localhost:3000, https://app.example.com"),
    ).toEqual(["http://localhost:3000", "https://app.example.com"]);
  });
});

describe("convex public env", () => {
  it("treats a missing Convex URL as unset", () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    expect(getPublicConvexUrl()).toBeUndefined();
    expect(convexConnectSources()).toEqual([]);
  });

  it("derives HTTP and WebSocket connect sources from the Convex URL", () => {
    process.env.NEXT_PUBLIC_CONVEX_URL =
      "https://example-123.convex.cloud/extra";
    expect(getPublicConvexUrl()).toBe("https://example-123.convex.cloud/extra");
    expect(convexConnectSources()).toEqual([
      "https://example-123.convex.cloud",
      "wss://example-123.convex.cloud",
    ]);
  });
});

describe("clerkAuthorizedParties", () => {
  it("reads the comma-separated origin list", () => {
    process.env.CLERK_AUTHORIZED_PARTIES =
      "http://localhost:3000,https://app.example.com";
    expect(clerkAuthorizedParties()).toEqual([
      "http://localhost:3000",
      "https://app.example.com",
    ]);
  });
});
