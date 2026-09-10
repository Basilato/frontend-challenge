import { queryOptions } from '@tanstack/react-query'

import type { LoginRequest, RegisterRequest, Session } from '@/contracts'
import { http } from '@/lib/http'

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
  const { data } = await http.post<Session>('/auth/login', body)
  return data
}

export async function register(body: RegisterRequest): Promise<Session> {
  const { data } = await http.post<Session>('/auth/register', body)
  return data
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}
