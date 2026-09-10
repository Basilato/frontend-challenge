import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import type { AddCartItemRequest, Cart, Quote } from '@/contracts'
import { http } from '@/lib/http'
import { useAuth } from '@/features/auth/useAuth'

export const cartKeys = {
  root: (ownerKey: string) => ['cart', ownerKey] as const,
  quote: (ownerKey: string) => ['cart', ownerKey, 'quote'] as const,
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

export const quoteQuery = (ownerKey: string, enabled: boolean) =>
  queryOptions({
    queryKey: cartKeys.quote(ownerKey),
    queryFn: async () => {
      const { data } = await http.post<Quote>('/quote', {})
      return data
    },
    enabled,
    staleTime: 10_000,
  })

export function cartItemCount(cart: Cart | undefined): number {
  return cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0
}

function useCartMutations() {
  const { user } = useAuth()
  const key = user?.id ?? 'guest'
  const queryClient = useQueryClient()
  const sync = (cart: Cart) => {
    queryClient.setQueryData(cartKeys.root(key), cart)
    queryClient.invalidateQueries({ queryKey: cartKeys.quote(key) })
  }
  return { key, queryClient, sync }
}

export function useAddToCart() {
  const { sync } = useCartMutations()
  return useMutation({
    mutationFn: async (body: AddCartItemRequest) => {
      const { data } = await http.post<Cart>('/cart/items', body)
      return data
    },
    onSuccess: sync,
  })
}

export function useUpdateCartItem() {
  const { key, queryClient, sync } = useCartMutations()
  return useMutation({
    mutationFn: async ({ editionId, quantity }: { editionId: string; quantity: number }) => {
      const { data } = await http.patch<Cart>(`/cart/items/${editionId}`, { quantity })
      return data
    },
    onMutate: async ({ editionId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.root(key) })
      const prev = queryClient.getQueryData<Cart>(cartKeys.root(key))
      if (prev) {
        queryClient.setQueryData<Cart>(cartKeys.root(key), {
          ...prev,
          items: prev.items
            .map((i) => (i.editionId === editionId ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(cartKeys.root(key), ctx.prev)
    },
    onSuccess: sync,
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartKeys.root(key) }),
  })
}

export function useRemoveCartItem() {
  const { sync } = useCartMutations()
  return useMutation({
    mutationFn: async (editionId: string) => {
      const { data } = await http.delete<Cart>(`/cart/items/${editionId}`)
      return data
    },
    onSuccess: sync,
  })
}

export function useApplyCoupon() {
  const { sync } = useCartMutations()
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await http.put<Cart>('/cart/coupon', { code })
      return data
    },
    onSuccess: sync,
  })
}

export function useRemoveCoupon() {
  const { sync } = useCartMutations()
  return useMutation({
    mutationFn: async () => {
      const { data } = await http.delete<Cart>('/cart/coupon')
      return data
    },
    onSuccess: sync,
  })
}
