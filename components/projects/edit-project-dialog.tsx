"use client";

import { useMutation } from "convex/react";
import { PencilIcon } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

import { handleProjectMutationError } from "./mutation-error";
import {
  parseProjectForm,
  ProjectForm,
  type ProjectFormErrors,
} from "./project-form";

export function EditProjectDialog({ project }: { project: Doc<"projects"> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const formId = useId();
  const updateProject = useMutation(api.projects.update);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setName(project.name);
      setDescription(project.description);
      setErrors({});
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseProjectForm(name, description);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setIsSaving(true);
    try {
      await updateProject({ projectId: project._id, ...result.data });
      toast.success("Project updated.");
      setOpen(false);
    } catch (error) {
      const mapped = handleProjectMutationError(error, "project.update");
      if (mapped.field) {
        setErrors({ [mapped.field]: mapped.message });
      } else {
        toast.error(mapped.message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${project.name}`}
        >
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Update the project details below.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          formId={formId}
          name={name}
          description={description}
          errors={errors}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onSubmit={handleSubmit}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form={formId} disabled={isSaving}>
            {isSaving && <Spinner />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
