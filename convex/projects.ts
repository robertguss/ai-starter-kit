import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

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

async function requireOwnerId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "You must be signed in to manage projects.",
    });
  }

  return identity.tokenIdentifier;
}

function validateProjectInput(input: { name: string; description: string }) {
  const name = input.name.trim();
  const description = input.description.trim();

  if (name.length === 0) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message: "Project name is required.",
      field: "name",
    });
  }

  if (name.length > 100) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message: "Project name must be 100 characters or fewer.",
      field: "name",
    });
  }

  if (description.length > 2_000) {
    throw new ConvexError({
      code: "INVALID_INPUT",
      message: "Project description must be 2,000 characters or fewer.",
      field: "description",
    });
  }

  return { name, description };
}

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

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(projectValidator),
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);

    if (args.paginationOpts.numItems < 1 || args.paginationOpts.numItems > 50) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Page size must be between 1 and 50.",
      });
    }

    return await ctx.db
      .query("projects")
      .withIndex("by_ownerId_and_updatedAt", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  returns: projectValidator,
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    return await requireOwnedProject(ctx, ownerId, args.projectId);
  },
});

export const create = mutation({
  args: projectInputValidator.fields,
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    const input = validateProjectInput(args);

    return await ctx.db.insert("projects", {
      ownerId,
      ...input,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    ...projectInputValidator.fields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    await requireOwnedProject(ctx, ownerId, args.projectId);
    const input = validateProjectInput(args);

    await ctx.db.patch("projects", args.projectId, {
      ...input,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireOwnerId(ctx);
    await requireOwnedProject(ctx, ownerId, args.projectId);
    await ctx.db.delete("projects", args.projectId);
    return null;
  },
});
