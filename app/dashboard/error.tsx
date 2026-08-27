"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { ErrorFallback } from "@/components/error-fallback";

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
    <ErrorFallback
      compact
      title="Projects could not be loaded"
      description="The error was reported. Check your connection and try again."
      reset={reset}
    />
  );
}
