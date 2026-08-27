"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { ErrorFallback } from "@/components/error-fallback";

export default function ErrorPage({
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
      title="We could not load this page."
      description="The error was reported. Try again, and contact support if it continues."
      reset={reset}
    />
  );
}
