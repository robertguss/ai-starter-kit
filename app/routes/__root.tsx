/// <reference types="vite/client" />
import { ClerkProvider } from '@clerk/tanstack-react-start'
import { ThemeProvider } from 'next-themes'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import * as React from 'react'
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { ConvexClientProvider } from '../ConvexClientProvider'
import appCss from '../globals.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'AI Starter Kit' },
      {
        name: 'description',
        content:
          'A modern, production-ready starter kit for building full-stack applications with TanStack Start, Convex, Clerk, TypeScript, and shadcn/ui.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl={
        import.meta.env.VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? '/dashboard'
      }
      signUpFallbackRedirectUrl={
        import.meta.env.VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? '/dashboard'
      }
    >
      <ConvexClientProvider>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ConvexClientProvider>
    </ClerkProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {import.meta.env.DEV ? (
          <TanStackRouterDevtools position="bottom-right" />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 px-8 py-24 text-center sm:items-start sm:text-left">
        <p className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
          404
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Page not found
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            That URL does not match any route in this app. Head home and try
            again from there.
          </p>
        </div>
        <Link to="/">
          <Button size="lg">Back to home</Button>
        </Link>
      </main>
    </div>
  )
}
