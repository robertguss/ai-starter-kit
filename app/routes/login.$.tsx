import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { safeAppRedirect } from '../lib/redirect'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login/$')({
  validateSearch: loginSearchSchema,
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  const forceRedirectUrl = safeAppRedirect(redirect)

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <SignIn
        path="/login"
        routing="path"
        signUpUrl="/signup"
        forceRedirectUrl={forceRedirectUrl}
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  )
}
