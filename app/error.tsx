"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

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
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-destructive text-sm font-semibold">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          We could not load this page.
        </h1>
        <p className="text-muted-foreground mt-4">
          The error was reported. Try again, and contact support if it
          continues.
        </p>
        <Button className="mt-8" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
