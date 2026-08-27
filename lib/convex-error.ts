import { ConvexError } from "convex/values";

export type ProjectInputField = "name" | "description";

export type ProjectMutationError = {
  code?: string;
  field?: ProjectInputField;
  message: string;
};

const GENERIC_MUTATION_MESSAGE = "Something went wrong. Please try again.";

function isProjectInputField(value: unknown): value is ProjectInputField {
  return value === "name" || value === "description";
}

function fromUnknownData(data: unknown): ProjectMutationError | undefined {
  if (typeof data !== "object" || data === null || !("message" in data)) {
    return undefined;
  }

  const message = data.message;
  if (typeof message !== "string" || message.length === 0) {
    return undefined;
  }

  return {
    message,
    code:
      "code" in data && typeof data.code === "string" ? data.code : undefined,
    field:
      "field" in data && isProjectInputField(data.field)
        ? data.field
        : undefined,
  };
}

export function getProjectMutationError(error: unknown): ProjectMutationError {
  if (error instanceof ConvexError) {
    return fromUnknownData(error.data) ?? { message: GENERIC_MUTATION_MESSAGE };
  }

  if (typeof error === "object" && error !== null && "data" in error) {
    const parsed = fromUnknownData(error.data);
    if (parsed) return parsed;
  }

  return { message: GENERIC_MUTATION_MESSAGE };
}
