import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import type { UpsertWalletRequest, Wallet } from '@/contracts'
import { http } from '@/lib/http'

export const walletKeys = {
  list: (userId: string) => ['wallets', userId] as const,
}

export const walletsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: walletKeys.list(userId ?? 'anon'),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<Wallet[]>('/wallets', { signal })
      return data
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  })

export function useUpsertWallet(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpsertWalletRequest) => {
      const { data } = await http.put<Wallet>(`/wallets/${body.role}`, body)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletKeys.list(userId) }),
  })
}
