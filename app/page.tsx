"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { isSignedIn, user } = useUser();

  const displayName =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || "there";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {isSignedIn
              ? `Welcome back, ${displayName}!`
              : "Welcome to Next.js with Convex + Clerk"}
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {isSignedIn
              ? "Your authentication is set up and working. Visit your dashboard to see your personalized content."
              : "Get started by creating an account or signing in to access your personalized dashboard."}
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          {isSignedIn ? (
            <>
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
              <SignOutButton redirectUrl="/">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign Out
                </Button>
              </SignOutButton>
            </>
          ) : (
            <>
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign Up
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
