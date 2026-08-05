/// <reference types="vite/client" />
import { ClerkProvider } from '@clerk/tanstack-react-start'
import { ThemeProvider } from 'next-themes'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import * as React from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

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
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
