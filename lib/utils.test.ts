import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins plain class names", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("drops falsy values", () => {
    expect(cn("block", false && "hidden", null, undefined, "text-sm")).toBe(
      "block text-sm",
    );
  });

  it("resolves conflicting Tailwind classes", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
