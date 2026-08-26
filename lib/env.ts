export function commaSeparated(
  value: string | undefined,
): string[] | undefined {
  const values = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values?.length ? values : undefined;
}

export function getPublicConvexUrl(): string | undefined {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  return convexUrl || undefined;
}

export function convexConnectSources(
  convexUrl = getPublicConvexUrl(),
): string[] {
  if (!convexUrl) return [];

  const origin = new URL(convexUrl).origin;
  return [origin, origin.replace(/^http/, "ws")];
}

export function clerkAuthorizedParties(): string[] | undefined {
  return commaSeparated(process.env.CLERK_AUTHORIZED_PARTIES);
}
