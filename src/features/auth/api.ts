import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import type { LoginRequest, RegisterRequest, Session } from '@/contracts'
import { http, setSessionToken } from '@/lib/http'

type SessionResponse = Session & { token: string }

export const authKeys = {
  session: ['auth', 'session'] as const,
}

export const sessionQuery = queryOptions({
  queryKey: authKeys.session,
  queryFn: async ({ signal }) => {
    try {
      const { data } = await http.get<Session>('/auth/session', { signal })
      return data
    } catch {
      return null
    }
  },
  staleTime: 60_000,
  retry: false,
})

export async function login(body: LoginRequest): Promise<Session> {
  const { data } = await http.post<SessionResponse>('/auth/login', body)
  setSessionToken(data.token)
  return data
}

export async function register(body: RegisterRequest): Promise<Session> {
  const { data } = await http.post<SessionResponse>('/auth/register', body)
  setSessionToken(data.token)
  return data
}

export async function logout(): Promise<void> {
  try {
    await http.post('/auth/logout')
  } finally {
    setSessionToken(null)
  }
}

function useAuthMutation<TBody>(fn: (body: TBody) => Promise<Session>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (session) => {
      queryClient.setQueryData(authKeys.session, session)
      // private data belongs to the new identity — drop guest-scoped caches
      queryClient.invalidateQueries({
        predicate: (q) => ['cart', 'favorites', 'orders', 'wallets', 'profile'].includes(q.queryKey[0] as string),
      })
    },
  })
}

export function useLogin() {
  return useAuthMutation<LoginRequest>(login)
}

export function useRegister() {
  return useAuthMutation<RegisterRequest>(register)
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.session, null)
      queryClient.removeQueries({
        predicate: (q) =>
          ['cart', 'favorites', 'orders', 'wallets', 'profile'].includes(q.queryKey[0] as string),
      })
    },
  })
}
