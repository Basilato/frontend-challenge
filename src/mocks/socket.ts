import { ws } from 'msw'

import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts'

import { db, persistDb } from './db'

/**
 * Socket.IO mock via @mswjs/socket.io-binding (public beta — limitations to be
 * documented in ARCHITECTURE.md). The real socket.io-client connects here; the
 * binding encodes/decodes the Socket.IO protocol over the intercepted WS.
 *
 * NOTE: wiring is intentionally minimal for the scaffold. The event emitters
 * (`emitNftUpdated`, `emitOrderUpdated`) are the seam the checkout / realtime
 * scenarios drive; a control endpoint (or the Playwright fixture) triggers them.
 */
const link = ws.link('ws://localhost/socket.io')

type Emitter = (event: NftUpdatedEvent | OrderUpdatedEvent) => void
const emitters = new Set<Emitter>()

export const socketHandlers = [
  link.addEventListener('connection', () => {
    // The binding (toSocketIo) is attached here once the API shape is finalised
    // against the installed @mswjs/socket.io-binding version.
  }),
]

export function emitNftUpdated(nftId: string, patch: { priceEth?: string; available?: number }) {
  const nft = db.nfts.find((n) => n.id === nftId)
  if (!nft) return
  nft.version += 1
  if (patch.priceEth) nft.priceEth = patch.priceEth
  if (typeof patch.available === 'number') nft.available = patch.available
  persistDb()
  const event: NftUpdatedEvent = {
    type: 'nft.updated',
    nftId,
    version: nft.version,
    priceEth: nft.priceEth,
    available: nft.available,
  }
  emitters.forEach((e) => e(event))
}

export function emitOrderUpdated(orderId: string, status: OrderUpdatedEvent['status']) {
  const order = db.orders[orderId]
  if (!order) return
  order.version += 1
  order.status = status
  if (status === 'confirmed') {
    order.transactionRef = `0x${Math.random().toString(16).slice(2).padEnd(40, '0')}`
    order.explorerUrl = `https://example-explorer.test/tx/${order.transactionRef}`
  }
  persistDb()
  const event: OrderUpdatedEvent = {
    type: 'order.updated',
    orderId,
    version: order.version,
    status: order.status,
    transactionRef: order.transactionRef,
    explorerUrl: order.explorerUrl,
  }
  emitters.forEach((e) => e(event))
}

export function onMockSocketEmit(fn: Emitter): () => void {
  emitters.add(fn)
  return () => emitters.delete(fn)
}
