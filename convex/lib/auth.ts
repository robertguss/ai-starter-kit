import { ConvexError } from "convex/values";

import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function requireIdentity(
  ctx: QueryCtx | MutationCtx,
): Promise<{ tokenIdentifier: string }> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "You must be signed in to manage projects.",
    });
  }

  return identity;
}
