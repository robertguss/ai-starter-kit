"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <main
          style={{
            margin: "15vh auto",
            maxWidth: 560,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1>Something went wrong</h1>
          <p>The error was reported. Please try again.</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
