import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import type { User } from '@/contracts'
import { onUnauthorized } from '@/lib/http'

import { authKeys, sessionQuery } from './api'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth(): AuthState {
  const { data, isLoading } = useQuery(sessionQuery)
  const queryClient = useQueryClient()

  // Session expiry during navigation: a 401 anywhere clears the session and
  // private caches (CLAUDE.md rule 4). The socket is torn down by RealtimeProvider
  // when the session goes null. (This hook runs both inside and outside the
  // router tree — e.g. RealtimeProvider wraps RouterProvider — so it must not
  // depend on router hooks; the redirect-to-login part lives in
  // useSessionExpiryRedirect below, mounted once inside the router tree.)
  useEffect(() => {
    return onUnauthorized(() => {
      queryClient.setQueryData(authKeys.session, null)
      queryClient.removeQueries({ predicate: (q) => isPrivateKey(q.queryKey) })
    })
  }, [queryClient])

  return {
    user: data?.user ?? null,
    isAuthenticated: Boolean(data?.user),
    isLoading,
  }
}

const PRIVATE_PREFIXES = ['favorites', 'cart', 'orders', 'profile', 'wallets']
function isPrivateKey(key: readonly unknown[]): boolean {
  return typeof key[0] === 'string' && PRIVATE_PREFIXES.includes(key[0])
}

const PRIVATE_ROUTES = ['/perfil', '/carteiras', '/pagamento', '/favoritos', '/pedido']
function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

/**
 * If a 401 arrives while sitting on a private route (including mid-checkout),
 * bounce to /login with a return path so the user resumes where they left off
 * instead of sitting on a page whose private data just vanished from cache.
 * Must be mounted once inside the router tree (RootLayout) — unlike useAuth,
 * this one needs router context.
 */
export function useSessionExpiryRedirect(): void {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    return onUnauthorized(() => {
      if (isPrivateRoute(pathname)) {
        navigate({ to: '/login', search: { redirect: pathname }, replace: true })
      }
    })
  }, [navigate, pathname])
}
