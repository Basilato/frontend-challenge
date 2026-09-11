import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import type { ReactNode } from 'react'

import type { Cart, NftUpdatedEvent, Order, OrderUpdatedEvent } from '@/contracts'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { cartKeys } from '@/features/cart/api'
import { nftKeys } from '@/features/catalog/api'
import { orderKeys } from '@/features/checkout/api'
import { useAuth } from '@/features/auth/useAuth'

/**
 * Realtime bridge. Binds a real socket.io-client to the current identity and
 * folds `nft.updated` / `order.updated` events into the Query cache, guarding
 * against duplicate and out-of-order events by version. On reconnect it
 * reconciles the active resources against REST.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? null

  // last-applied version per resource — tolerates duplicates without a cache entry
  const seen = useRef(new Map<string, number>())

  useEffect(() => {
    if (!userId) {
      disconnectSocket()
      return
    }
    seen.current.clear()
    const socket = connectSocket({ userId })

    const fresher = (key: string, version: number) => {
      const prev = seen.current.get(key) ?? -Infinity
      if (version <= prev) return false
      seen.current.set(key, version)
      return true
    }

    const onNft = (event: NftUpdatedEvent) => {
      if (event.type !== 'nft.updated') return
      const cached = queryClient.getQueryData<{ version: number }>(nftKeys.detail(event.nftId))
      if (!fresher(`nft:${event.nftId}`, event.version)) return
      if (cached && cached.version >= event.version) return

      // Refetch the affected resources from REST — the mock db already changed.
      queryClient.invalidateQueries({ queryKey: nftKeys.detail(event.nftId) })
      queryClient.invalidateQueries({ queryKey: nftKeys.all })
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'cart' })

      const cart = queryClient.getQueryData<Cart>(cartKeys.root(userId))
      if (cart?.items.some((i) => i.nftId === event.nftId)) {
        toast.message('Um item do seu carrinho mudou', {
          description: 'Preço ou disponibilidade foram atualizados. Revise o resumo.',
        })
      }
    }

    const onOrder = (event: OrderUpdatedEvent) => {
      if (event.type !== 'order.updated') return
      if (!fresher(`order:${event.orderId}`, event.version)) return
      queryClient.setQueryData<Order>(orderKeys.detail(event.orderId), (prev) =>
        prev && prev.version < event.version
          ? {
              ...prev,
              status: event.status,
              version: event.version,
              transactionRef: event.transactionRef,
              explorerUrl: event.explorerUrl,
            }
          : prev,
      )
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(event.orderId) })
    }

    const onReconnect = () => {
      // Reconcile everything currently mounted with the source of truth.
      queryClient.invalidateQueries({ queryKey: nftKeys.all })
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'cart' })
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'orders' })
    }

    socket.on('nft.updated', onNft)
    socket.on('order.updated', onOrder)
    socket.io.on('reconnect', onReconnect)

    return () => {
      socket.off('nft.updated', onNft)
      socket.off('order.updated', onOrder)
      socket.io.off('reconnect', onReconnect)
      disconnectSocket()
    }
  }, [userId, queryClient])

  return <>{children}</>
}
