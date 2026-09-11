import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  // when the session goes null.
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
