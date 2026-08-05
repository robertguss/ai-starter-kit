import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { safeAppRedirect } from '../lib/redirect'

const signupSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/signup/$')({
  validateSearch: signupSearchSchema,
  component: SignupPage,
})

function SignupPage() {
  const { redirect } = Route.useSearch()
  const forceRedirectUrl = safeAppRedirect(redirect)

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/login"
        forceRedirectUrl={forceRedirectUrl}
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  )
}
