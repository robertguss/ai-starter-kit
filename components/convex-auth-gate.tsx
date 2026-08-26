"use client";

import { useConvexAuth } from "convex/react";
import { FolderIcon } from "lucide-react";

import { ProjectGridSkeleton } from "@/components/projects/project-grid-skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getPublicConvexUrl } from "@/lib/env";

export function ConvexAuthGate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!getPublicConvexUrl()) {
    return (
      <ConvexSetupEmpty
        title="Convex is not configured"
        description="Set NEXT_PUBLIC_CONVEX_URL, then reload this page."
      />
    );
  }

  return <AuthenticatedConvexGate>{children}</AuthenticatedConvexGate>;
}

function AuthenticatedConvexGate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <ProjectGridSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <ConvexSetupEmpty
        title="Convex authentication is not ready"
        description="Sign in again after configuring the Clerk Convex JWT template."
      />
    );
  }

  return children;
}

function ConvexSetupEmpty({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
