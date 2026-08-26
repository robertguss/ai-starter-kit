import { UserButton } from "@clerk/nextjs";
import { BoxesIcon } from "lucide-react";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";

export function AppHeader() {
  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <BoxesIcon className="size-5" aria-hidden="true" />
          <span>Web App Starter Kit</span>
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
