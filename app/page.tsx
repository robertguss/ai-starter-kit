import { auth } from "@clerk/nextjs/server";
import { ActivityIcon, DatabaseZapIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInHref, signUpHref } from "@/lib/auth-routes";

const foundations = [
  {
    title: "Secure by default",
    description:
      "Clerk authentication, strict content security policy, and server-enforced ownership checks.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Reactive backend",
    description:
      "Type-safe Convex functions, real-time subscriptions, validated inputs, and indexed queries.",
    icon: DatabaseZapIcon,
  },
  {
    title: "Production signals",
    description:
      "Sentry error monitoring plus Vercel Analytics and Speed Insights, ready for deployment.",
    icon: ActivityIcon,
  },
] as const;

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="from-muted absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b to-transparent" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Web App Starter Kit
          </Link>
          <nav aria-label="Account" className="flex items-center gap-2">
            {userId ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href={signInHref}>Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={signUpHref}>Create account</Link>
                </Button>
              </>
            )}
          </nav>
        </header>

        <section className="flex flex-1 flex-col justify-center py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-muted-foreground mb-5 text-sm font-medium">
              Next.js · Convex · Clerk · Vercel
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Start with production-ready foundations.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8 text-pretty">
              A lean TypeScript starter with a real owner-scoped feature, secure
              authentication, observability, and deployment defaults you can
              build on.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {userId ? (
                <Button asChild size="lg">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href={signUpHref}>Get started</Link>
                </Button>
              )}
              {!userId && (
                <Button asChild size="lg" variant="outline">
                  <Link href={signInHref}>Sign in</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-20 grid gap-4 md:grid-cols-3">
            {foundations.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <Icon className="size-5" aria-hidden="true" />
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-6">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <footer className="text-muted-foreground border-t py-6 text-sm">
          Built for production apps with real users and data.
        </footer>
      </div>
    </main>
  );
}
