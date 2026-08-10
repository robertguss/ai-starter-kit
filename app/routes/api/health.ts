import { createFileRoute } from "@tanstack/react-router";

import { createLogEvent, formatLogEvent } from "@/lib/logger";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const event = createLogEvent("info", "health check", {
          path: "/api/health",
          ok: true,
        });
        console.info(formatLogEvent(event));

        return Response.json({
          status: "ok",
          service: "ai-starter-kit",
          timestamp: event.timestamp,
        });
      },
    },
  },
});
