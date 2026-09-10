import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateOrderRequest, Order } from '@/contracts'
import { http } from '@/lib/http'

export const orderKeys = {
  detail: (id: string) => ['orders', id] as const,
}

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<Order>(`/orders/${id}`, { signal })
      return data
    },
    // Poll while the order is still settling.
    refetchInterval: (query) =>
      query.state.data && query.state.data.status === 'pending' ? 1500 : false,
  })

/**
 * Create an order. `idempotencyKey` must stay stable across retries of the same
 * attempt (so a timeout + retry recovers the same order) but change when the
 * priced cart changes — callers derive it from a session nonce + the quoteHash.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      body,
      idempotencyKey,
    }: {
      body: CreateOrderRequest
      idempotencyKey: string
    }) => {
      const { data } = await http.post<Order>('/orders', body, {
        headers: { 'Idempotency-Key': idempotencyKey },
        timeout: 8000,
      })
      return data
    },
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order)
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'cart' })
    },
  })
}
