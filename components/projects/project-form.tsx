"use client";

import type { FormEvent } from "react";
import type { ZodError } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PROJECT_DESCRIPTION_MAX,
  PROJECT_NAME_MAX,
  projectInputSchema,
  type ProjectInput,
  type ProjectInputField,
} from "@/convex/lib/projectInput";

export type ProjectFormErrors = Partial<Record<ProjectInputField, string>>;

export function parseProjectForm(
  name: string,
  description: string,
): { ok: true; data: ProjectInput } | { ok: false; errors: ProjectFormErrors } {
  const result = projectInputSchema.safeParse({ name, description });
  if (!result.success) {
    return { ok: false, errors: projectFormErrors(result.error) };
  }
  return { ok: true, data: result.data };
}

function projectFormErrors(error: ZodError): ProjectFormErrors {
  const fieldErrors: ProjectFormErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if ((field === "name" || field === "description") && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}

export function ProjectForm({
  description,
  errors,
  formId,
  name,
  onDescriptionChange,
  onNameChange,
  onSubmit,
}: {
  description: string;
  errors: ProjectFormErrors;
  formId: string;
  name: string;
  onDescriptionChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor={`${formId}-name`}>Name</Label>
        <Input
          id={`${formId}-name`}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          maxLength={PROJECT_NAME_MAX}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${formId}-name-error` : undefined}
          autoFocus
        />
        {errors.name && (
          <p id={`${formId}-name-error`} className="text-destructive text-sm">
            {errors.name}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${formId}-description`}>Description</Label>
        <Textarea
          id={`${formId}-description`}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          maxLength={PROJECT_DESCRIPTION_MAX}
          rows={5}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? `${formId}-description-error` : undefined
          }
        />
        {errors.description && (
          <p
            id={`${formId}-description-error`}
            className="text-destructive text-sm"
          >
            {errors.description}
          </p>
        )}
      </div>
    </form>
  );
}
