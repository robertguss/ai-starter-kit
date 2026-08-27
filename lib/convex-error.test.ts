import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { getProjectMutationError } from "./convex-error";

describe("getProjectMutationError", () => {
  it("maps structured ConvexError data onto field errors", () => {
    const error = new ConvexError({
      code: "INVALID_INPUT",
      field: "name",
      message: "Project name is required.",
    });

    expect(getProjectMutationError(error)).toEqual({
      code: "INVALID_INPUT",
      field: "name",
      message: "Project name is required.",
    });
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(getProjectMutationError(new Error("boom"))).toEqual({
      message: "Something went wrong. Please try again.",
    });
  });
});
