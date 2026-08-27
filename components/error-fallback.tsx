"use client";

import { Button } from "@/components/ui/button";

export function ErrorFallback({
  compact = false,
  description,
  reset,
  title,
}: {
  compact?: boolean;
  description: string;
  reset: () => void;
  title: string;
}) {
  if (compact) {
    return (
      <div className="border-destructive/40 bg-destructive/5 rounded-lg border p-8 text-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-destructive text-sm font-semibold">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-4">{description}</p>
        <Button className="mt-8" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
