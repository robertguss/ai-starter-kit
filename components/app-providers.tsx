"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
}

const convex = new ConvexReactClient(convexUrl);

export function AppProviders({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
      <Toaster richColors closeButton />
    </ThemeProvider>
  );
}
