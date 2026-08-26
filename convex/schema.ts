import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    ownerId: v.string(),
    name: v.string(),
    description: v.string(),
    updatedAt: v.number(),
  }).index("by_ownerId_and_updatedAt", ["ownerId", "updatedAt"]),
});
