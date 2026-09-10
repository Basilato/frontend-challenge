import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import type { FavoritesResponse } from '@/contracts'
import { http } from '@/lib/http'
import { useAuth } from '@/features/auth/useAuth'

export const favoritesKeys = {
  list: (userId: string) => ['favorites', userId] as const,
}

export const favoritesQuery = (userId: string | null) =>
  queryOptions({
    queryKey: favoritesKeys.list(userId ?? 'anon'),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<FavoritesResponse>('/favorites', { signal })
      return data.nftIds
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  })

/**
 * Optimistic favorite toggle with rollback (CLAUDE.md rule 8 — the project's
 * required optimistic interaction).
 */
export function useToggleFavorite() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const key = favoritesKeys.list(user?.id ?? 'anon')

  return useMutation({
    mutationFn: async ({ nftId, next }: { nftId: string; next: boolean }) => {
      if (next) await http.put(`/favorites/${nftId}`)
      else await http.delete(`/favorites/${nftId}`)
    },
    onMutate: async ({ nftId, next }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<string[]>(key) ?? []
      queryClient.setQueryData<string[]>(
        key,
        next ? [...new Set([...prev, nftId])] : prev.filter((id) => id !== nftId),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx) queryClient.setQueryData(key, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
