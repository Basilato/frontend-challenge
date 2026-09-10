import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import type { User } from '@/contracts'
import { onUnauthorized } from '@/lib/http'
import { connectSocket, disconnectSocket } from '@/lib/socket'

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
  // private caches (CLAUDE.md rule 4).
  useEffect(() => {
    return onUnauthorized(() => {
      queryClient.setQueryData(authKeys.session, null)
      queryClient.removeQueries({ predicate: (q) => isPrivateKey(q.queryKey) })
      disconnectSocket()
    })
  }, [queryClient])

  // Keep the realtime connection bound to the current identity.
  useEffect(() => {
    if (data?.user) {
      connectSocket({ userId: data.user.id })
      return () => disconnectSocket()
    }
    disconnectSocket()
  }, [data?.user])

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
