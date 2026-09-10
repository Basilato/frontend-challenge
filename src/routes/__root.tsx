import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { RootLayout } from '@/components/layout/RootLayout'

export interface RouterContext {
  queryClient: QueryClient
}

const DevTools =
  import.meta.env.DEV
    ? lazy(async () => {
        const [{ TanStackRouterDevtools }, { ReactQueryDevtools }] = await Promise.all([
          import('@tanstack/react-router-devtools'),
          import('@tanstack/react-query-devtools'),
        ])
        return {
          default: () => (
            <>
              <TanStackRouterDevtools position="bottom-right" />
              <ReactQueryDevtools buttonPosition="bottom-left" />
            </>
          ),
        }
      })
    : () => null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <RootLayout>
      <Outlet />
      <Suspense>
        <DevTools />
      </Suspense>
    </RootLayout>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-text-accent">Página não encontrada</h1>
      <p className="mt-2 text-text-secondary">O endereço acessado não existe ou foi movido.</p>
    </div>
  ),
})
