"use client";

import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
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

import { handleProjectMutationError } from "./mutation-error";
import {
  parseProjectForm,
  ProjectForm,
  type ProjectFormErrors,
} from "./project-form";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const formId = useId();
  const createProject = useMutation(api.projects.create);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setName("");
      setDescription("");
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
      await createProject(result.data);
      toast.success("Project created.");
      setOpen(false);
    } catch (error) {
      const mapped = handleProjectMutationError(error, "project.create");
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
        <Button>
          <PlusIcon />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>
            Add an owner-scoped project to your workspace.
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
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
