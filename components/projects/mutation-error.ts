import * as Sentry from "@sentry/nextjs";

import { getProjectMutationError } from "@/lib/convex-error";

export function handleProjectMutationError(error: unknown, operation: string) {
  const mapped = getProjectMutationError(error);
  if (!mapped.field) {
    Sentry.captureException(error, { tags: { operation } });
  }
  return mapped;
}
