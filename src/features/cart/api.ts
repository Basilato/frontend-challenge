import { queryOptions } from '@tanstack/react-query'

import type { Cart } from '@/contracts'
import { http } from '@/lib/http'

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
