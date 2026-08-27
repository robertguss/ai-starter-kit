"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { getPublicConvexUrl } from "@/lib/env";

function ConvexProviders({
  convexUrl,
  children,
}: Readonly<{ convexUrl: string; children: React.ReactNode }>) {
  const [convex] = useState(() => new ConvexReactClient(convexUrl));

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export function AppProviders({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const convexUrl = getPublicConvexUrl();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {convexUrl ? (
        <ConvexProviders convexUrl={convexUrl}>{children}</ConvexProviders>
      ) : (
        children
      )}
      <Toaster richColors closeButton />
    </ThemeProvider>
  );
}
