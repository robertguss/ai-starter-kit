import { v } from "convex/values";
import { query } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      subject: v.string(),
      name: v.string(),
      email: v.string(),
      image: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return {
      subject: identity.subject,
      name: identity.name ?? identity.nickname ?? identity.email ?? "User",
      email: identity.email ?? "",
      image: identity.pictureUrl,
    };
  },
});
