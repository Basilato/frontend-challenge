import { fallback } from '@tanstack/zod-adapter'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

import { AuthModal } from '@/features/auth/AuthModal'
import { sessionQuery } from '@/features/auth/api'

const searchSchema = z.object({
  redirect: fallback(z.string().optional(), undefined),
})

export const Route = createFileRoute('/cadastro')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session) throw redirect({ to: search.redirect ?? '/' })
  },
  component: CadastroRoute,
})

function CadastroRoute() {
  const { redirect: to } = Route.useSearch()
  return <AuthModal mode="register" redirect={to} />
}
