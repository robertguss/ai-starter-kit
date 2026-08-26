import { auth } from "@clerk/nextjs/server";

import { AppHeader } from "@/components/app-header";
import { ConvexAuthGate } from "@/components/convex-auth-gate";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await auth.protect();

  return (
    <div className="bg-muted/20 min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-8">
        <ConvexAuthGate>{children}</ConvexAuthGate>
      </main>
    </div>
  );
}
