import { ConvexError } from "convex/values";
import { z } from "zod";

export const PROJECT_NAME_MAX = 100;
export const PROJECT_DESCRIPTION_MAX = 2_000;

export const projectInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required.")
    .max(
      PROJECT_NAME_MAX,
      `Project name must be ${PROJECT_NAME_MAX} characters or fewer.`,
    ),
  description: z
    .string()
    .trim()
    .max(
      PROJECT_DESCRIPTION_MAX,
      "Project description must be 2,000 characters or fewer.",
    ),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectInputField = keyof ProjectInput;

export function parseProjectInput(input: {
  name: string;
  description: string;
}): ProjectInput {
  const result = projectInputSchema.safeParse(input);

  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path[0];

    throw new ConvexError({
      code: "INVALID_INPUT",
      message: issue?.message ?? "Invalid project input.",
      field: field === "description" ? "description" : "name",
    });
  }

  return result.data;
}
