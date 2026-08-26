"use client";

import { usePaginatedQuery } from "convex/react";
import { FolderIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";

import { CreateProjectDialog } from "./create-project-dialog";
import { ProjectCard } from "./project-card";
import { ProjectGridSkeleton } from "./project-grid-skeleton";

export function ProjectManager() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.projects.list,
    {},
    { initialNumItems: 9 },
  );

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
          <CreateProjectDialog />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        <CreateProjectDialog />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((project) => (
          <ProjectCard key={project._id} project={project} />
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
