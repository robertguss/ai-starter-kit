"use client";

import * as Sentry from "@sentry/nextjs";
import { useMutation, usePaginatedQuery, useConvexAuth } from "convex/react";
import { FolderIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(100),
  description: z.string().trim().max(2_000),
});

type Project = Doc<"projects">;
type FormErrors = Partial<Record<keyof z.infer<typeof projectSchema>, string>>;

function mutationFailed(error: unknown, operation: string) {
  Sentry.captureException(error, { tags: { operation } });
  toast.error("Something went wrong. Please try again.");
}

function ProjectDialog({ project }: { project?: Project }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const formId = useId();
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const isEditing = Boolean(project);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setErrors({});
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = projectSchema.safeParse({ name, description });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          (field === "name" || field === "description") &&
          !fieldErrors[field]
        ) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);
    try {
      if (project) {
        await updateProject({ projectId: project._id, ...result.data });
        toast.success("Project updated.");
      } else {
        await createProject(result.data);
        toast.success("Project created.");
      }
      setOpen(false);
    } catch (error) {
      mutationFailed(error, project ? "project.update" : "project.create");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${project?.name}`}
          >
            <PencilIcon />
          </Button>
        ) : (
          <Button>
            <PlusIcon />
            New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit project" : "Create a project"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the project details below."
              : "Add an owner-scoped project to your workspace."}
          </DialogDescription>
        </DialogHeader>
        <form
          id={formId}
          onSubmit={handleSubmit}
          noValidate
          className="grid gap-5"
        >
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-name`}>Name</Label>
            <Input
              id={`${formId}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? `${formId}-name-error` : undefined
              }
              autoFocus
            />
            {errors.name && (
              <p
                id={`${formId}-name-error`}
                className="text-destructive text-sm"
              >
                {errors.name}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-description`}>Description</Label>
            <Textarea
              id={`${formId}-description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2_000}
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
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form={formId} disabled={isSaving}>
            {isSaving && <Spinner />}
            {isEditing ? "Save changes" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProjectDialog({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const removeProject = useMutation(api.projects.remove);

  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDeleting(true);
    try {
      await removeProject({ projectId: project._id });
      toast.success("Project deleted.");
      setOpen(false);
    } catch (error) {
      mutationFailed(error, "project.delete");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${project.name}`}
        >
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{project.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The project will be permanently
            deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting && <Spinner />}
            Delete project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ProjectGridSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Loading projects"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-44 w-full" />
      ))}
    </div>
  );
}

export function ProjectManager() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { results, status, loadMore } = usePaginatedQuery(
    api.projects.list,
    isAuthenticated ? {} : "skip",
    { initialNumItems: 9 },
  );

  if (isAuthLoading) {
    return <ProjectGridSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderIcon />
          </EmptyMedia>
          <EmptyTitle>Convex authentication is not ready</EmptyTitle>
          <EmptyDescription>
            Sign in again after configuring the Clerk Convex JWT template.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (status === "LoadingFirstPage") {
    return <ProjectGridSkeleton />;
  }

  if (results.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderIcon />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            Create your first project to exercise the secure CRUD example.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <ProjectDialog />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        <ProjectDialog />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((project) => (
          <Card key={project._id}>
            <CardHeader>
              <CardTitle className="line-clamp-1">{project.name}</CardTitle>
              <CardDescription>
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </CardDescription>
              <CardAction className="flex gap-1">
                <ProjectDialog project={project} />
                <DeleteProjectDialog project={project} />
              </CardAction>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground line-clamp-3 text-sm leading-6">
                {project.description || "No description"}
              </p>
            </CardContent>
            <CardFooter className="text-muted-foreground text-xs">
              Created {new Date(project._creationTime).toLocaleDateString()}
            </CardFooter>
          </Card>
        ))}
      </div>
      {(status === "CanLoadMore" || status === "LoadingMore") && (
        <Button
          variant="outline"
          className="justify-self-center"
          disabled={status === "LoadingMore"}
          onClick={() => loadMore(9)}
        >
          {status === "LoadingMore" && <Spinner />}
          Load more
        </Button>
      )}
    </div>
  );
}
