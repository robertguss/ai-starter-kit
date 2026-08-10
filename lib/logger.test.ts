import { describe, expect, it } from "vitest";
import { createLogEvent, formatLogEvent } from "./logger";

describe("logger", () => {
  it("creates structured log events", () => {
    const event = createLogEvent(
      "info",
      "health check",
      { path: "/api/health", ok: true },
      "2026-08-10T00:00:00.000Z",
    );

    expect(event).toEqual({
      level: "info",
      message: "health check",
      fields: { path: "/api/health", ok: true },
      timestamp: "2026-08-10T00:00:00.000Z",
    });
  });

  it("serializes events as single-line JSON", () => {
    const event = createLogEvent(
      "error",
      "request failed",
      { status: 500 },
      "2026-08-10T00:00:00.000Z",
    );

    expect(formatLogEvent(event)).toBe(
      JSON.stringify({
        level: "error",
        message: "request failed",
        timestamp: "2026-08-10T00:00:00.000Z",
        status: 500,
      }),
    );
  });
});
