import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/functions";
import { parseProjectInput } from "./lib/projectInput";

const projectValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  ownerId: v.string(),
  name: v.string(),
  description: v.string(),
  updatedAt: v.number(),
});

const projectInputValidator = v.object({
  name: v.string(),
  description: v.string(),
});

async function requireOwnedProject(
  ctx: QueryCtx | MutationCtx,
  ownerId: string,
  projectId: Doc<"projects">["_id"],
): Promise<Doc<"projects">> {
  const project = await ctx.db.get("projects", projectId);

  if (!project || project.ownerId !== ownerId) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Project not found.",
    });
  }

  return project;
}

export const list = authedQuery({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(projectValidator),
  handler: async (ctx, args) => {
    if (args.paginationOpts.numItems < 1 || args.paginationOpts.numItems > 50) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Page size must be between 1 and 50.",
      });
    }

    return await ctx.db
      .query("projects")
      .withIndex("by_ownerId_and_updatedAt", (q) =>
        q.eq("ownerId", ctx.ownerId),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const get = authedQuery({
  args: { projectId: v.id("projects") },
  returns: v.union(projectValidator, v.null()),
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);

    if (!project || project.ownerId !== ctx.ownerId) {
      return null;
    }

    return project;
  },
});

export const create = authedMutation({
  args: projectInputValidator.fields,
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const input = parseProjectInput(args);

    return await ctx.db.insert("projects", {
      ownerId: ctx.ownerId,
      ...input,
      updatedAt: Date.now(),
    });
  },
});

export const update = authedMutation({
  args: {
    projectId: v.id("projects"),
    ...projectInputValidator.fields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireOwnedProject(ctx, ctx.ownerId, args.projectId);
    const input = parseProjectInput(args);

    await ctx.db.patch("projects", args.projectId, {
      ...input,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const remove = authedMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireOwnedProject(ctx, ctx.ownerId, args.projectId);
    await ctx.db.delete("projects", args.projectId);
    return null;
  },
});
