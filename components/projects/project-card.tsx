import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Doc } from "@/convex/_generated/dataModel";

import { DeleteProjectDialog } from "./delete-project-dialog";
import { EditProjectDialog } from "./edit-project-dialog";

export function ProjectCard({ project }: { project: Doc<"projects"> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="line-clamp-1">{project.name}</CardTitle>
        <CardDescription>
          Updated {new Date(project.updatedAt).toLocaleDateString()}
        </CardDescription>
        <CardAction className="flex gap-1">
          <EditProjectDialog project={project} />
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
  );
}
