import type { Metadata } from "next";

import { ProjectManager } from "@/components/projects/project-manager";

export const metadata: Metadata = {
  title: "Projects",
};

export default function DashboardPage() {
  return (
    <section aria-labelledby="projects-heading">
      <div className="mb-8 max-w-2xl">
        <h1
          id="projects-heading"
          className="text-3xl font-semibold tracking-tight"
        >
          Projects
        </h1>
        <p className="text-muted-foreground mt-2">
          A real-time, owner-scoped CRUD example backed by Convex.
        </p>
      </div>
      <ProjectManager />
    </section>
  );
}
