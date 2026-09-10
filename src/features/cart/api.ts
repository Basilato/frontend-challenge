import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import type { AddCartItemRequest, Cart } from '@/contracts'
import { http } from '@/lib/http'
import { useAuth } from '@/features/auth/useAuth'

export const cartKeys = {
  root: (ownerKey: string) => ['cart', ownerKey] as const,
}

/** ownerKey is the user id when authenticated, otherwise 'guest'. */
export const cartQuery = (ownerKey: string) =>
  queryOptions({
    queryKey: cartKeys.root(ownerKey),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<Cart>('/cart', { signal })
      return data
    },
    staleTime: 15_000,
  })

export function cartItemCount(cart: Cart | undefined): number {
  return cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0
}

export function useAddToCart() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AddCartItemRequest) => {
      const { data } = await http.post<Cart>('/cart/items', body)
      return data
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.root(user?.id ?? 'guest'), cart)
    },
  })
}
