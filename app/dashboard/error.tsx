"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="border-destructive/40 bg-destructive/5 rounded-lg border p-8 text-center">
      <h2 className="text-xl font-semibold">Projects could not be loaded</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        The error was reported. Check your connection and try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
