import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts'
import { mulEth } from '@/lib/money'

import { db, persistDb } from './db'
import { scenario } from './scenario'

/**
 * Socket.IO mock. MSW's browser worker doesn't reliably intercept WebSocket in
 * this version, so the mock installs its own `WebSocket` implementation that
 * speaks the Engine.IO v4 / Socket.IO v5 wire protocol for the app's
 * `/socket.io/` endpoint and delegates every other URL to the native class.
 *
 * The real `socket.io-client` connects to this — realtime scenarios go through
 * the actual client, not cache pokes (CLAUDE.md rule 2).
 *
 * Limitations (ARCHITECTURE.md): events + handshake + ping only. No rooms,
 * namespaces, acks or binary. Client is pinned to `transports: ['websocket']`.
 */
const rid = () => Math.random().toString(36).slice(2, 12)

interface MockClient {
  ws: MockWebSocket
  userId: string | null
}
const clients = new Set<MockClient>()

let NativeWebSocket: typeof WebSocket | null = null
let installed = false

class MockWebSocket extends EventTarget {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3

  url: string
  readyState = 0
  binaryType: 'blob' | 'arraybuffer' = 'blob'
  bufferedAmount = 0
  extensions = ''
  protocol = ''
  onopen: ((ev: Event) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null
  onclose: ((ev: CloseEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null

  #entry: MockClient | null = null
  #pingTimer: ReturnType<typeof setInterval> | undefined

  constructor(url: string | URL, protocols?: string | string[]) {
    super()
    this.url = typeof url === 'string' ? url : url.href
    if (!this.url.includes('/socket.io/')) {
      // eslint-disable-next-line no-constructor-return
      return new NativeWebSocket!(url, protocols) as unknown as MockWebSocket
    }
    queueMicrotask(() => this.#open())
  }

  #open() {
    this.readyState = 1
    this.#fire('open', new Event('open'))
    // Engine.IO OPEN handshake
    this.#deliver(
      '0' +
        JSON.stringify({
          sid: rid(),
          upgrades: [],
          pingInterval: 25000,
          pingTimeout: 20000,
          maxPayload: 1_000_000,
        }),
    )
    this.#entry = { ws: this, userId: null }
    clients.add(this.#entry)
    this.#pingTimer = setInterval(() => this.readyState === 1 && this.#deliver('2'), 25000)
  }

  #deliver(data: string) {
    // Always async so responses never fire re-entrantly inside the client's send().
    queueMicrotask(() => {
      if (this.readyState !== 1) return
      this.#fire('message', new MessageEvent('message', { data }))
    })
  }

  #fire(type: 'open' | 'message' | 'close' | 'error', event: Event) {
    ;(this as unknown as Record<string, ((e: Event) => void) | null>)['on' + type]?.(event)
    this.dispatchEvent(event)
  }

  /** Push a Socket.IO EVENT frame to this client. */
  emitEvent(event: string, ...args: unknown[]) {
    this.#deliver('42' + JSON.stringify([event, ...args]))
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    const frame = typeof data === 'string' ? data : ''
    if (frame === '3') return // client pong
    if (frame === '2') return this.#deliver('3') // client ping -> pong
    if (frame.startsWith('40')) return this.#deliver('40' + JSON.stringify({ sid: rid() }))
    if (frame.startsWith('42')) {
      try {
        const [event, ...args] = JSON.parse(frame.slice(2)) as [string, ...unknown[]]
        handleClientEvent(this.#entry!, event, args)
      } catch {
        /* ignore malformed */
      }
    }
  }

  close(code = 1000, reason = '') {
    if (this.readyState === 3) return
    this.readyState = 3
    clearInterval(this.#pingTimer)
    if (this.#entry) clients.delete(this.#entry)
    this.#fire('close', new CloseEvent('close', { code, reason, wasClean: true }))
  }
}

function handleClientEvent(entry: MockClient, event: string, args: unknown[]) {
  if (event === 'identify') {
    entry.userId = (args[0] as { userId?: string } | undefined)?.userId ?? null
    return
  }
  if (event === 'subscribe:checkout') {
    if (!scenario().bumpCartPriceOnCheckout || !entry.userId) return
    const first = db.carts[entry.userId]?.items[0]
    if (!first) return
    setTimeout(() => {
      const newPrice = (Number(mulEth(first.unitPriceEth, 1)) * 1.25).toFixed(2)
      emitNftUpdated(first.nftId, { priceEth: newPrice })
    }, 2500)
  }
}

export function startSocketMock(): void {
  if (installed || typeof window === 'undefined') return
  installed = true
  NativeWebSocket = window.WebSocket
  window.WebSocket = MockWebSocket as unknown as typeof WebSocket
}

function broadcast(event: NftUpdatedEvent | OrderUpdatedEvent, toUserId?: string) {
  for (const c of clients) {
    if (toUserId && c.userId !== toUserId) continue
    c.ws.emitEvent(event.type, event)
  }
}

/** Bump an NFT's price/availability, sync cart snapshots, and notify clients. */
export function emitNftUpdated(
  nftId: string,
  patch: { priceEth?: string; available?: number },
): NftUpdatedEvent | null {
  const nft = db.nfts.find((n) => n.id === nftId)
  if (!nft) return null
  nft.version += 1
  if (patch.priceEth) nft.priceEth = patch.priceEth
  if (typeof patch.available === 'number') nft.available = patch.available

  if (patch.priceEth) for (const e of nft.editions) e.priceEth = patch.priceEth
  if (typeof patch.available === 'number') for (const e of nft.editions) e.available = patch.available
  for (const cart of Object.values(db.carts)) {
    for (const item of cart.items) {
      if (item.nftId !== nftId) continue
      const edition = nft.editions.find((e) => e.id === item.editionId)
      if (edition) {
        item.unitPriceEth = edition.priceEth
        item.available = edition.available
      }
    }
  }
  persistDb()

  const event: NftUpdatedEvent = {
    type: 'nft.updated',
    nftId,
    version: nft.version,
    priceEth: nft.priceEth,
    available: nft.available,
  }
  broadcast(event)
  return event
}

/** Resolve an order and notify only its owner. */
export function emitOrderUpdated(
  orderId: string,
  status: OrderUpdatedEvent['status'],
): OrderUpdatedEvent | null {
  const order = db.orders[orderId]
  if (!order) return null
  order.version += 1
  order.status = status
  if (status === 'confirmed' && !order.transactionRef) {
    order.transactionRef = `0x${Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40)}`
    order.explorerUrl = `https://example-explorer.test/tx/${order.transactionRef}`
  }
  if (status === 'rejected') order.rejectionReason ??= 'A carteira recusou a transação.'
  persistDb()

  const event: OrderUpdatedEvent = {
    type: 'order.updated',
    orderId,
    version: order.version,
    status: order.status,
    transactionRef: order.transactionRef,
    explorerUrl: order.explorerUrl,
  }
  broadcast(event, db.orderOwners[orderId])
  return event
}
