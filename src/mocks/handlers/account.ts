import { http, HttpResponse } from 'msw'

import type {
  AddCartItemRequest,
  Cart,
  CreateOrderRequest,
  Order,
  Quote,
  UpsertWalletRequest,
} from '@/contracts'
import { addEth, mulEth } from '@/lib/money'

import { db, getSessionUser, persistDb } from '../db'
import { applyLatency, scenario } from '../scenario'
import { tokenFrom, publicUser } from './auth'

const API = (path: string) => `${import.meta.env.VITE_API_URL ?? '/api'}${path}`
const NETWORK_FEE_ETH = '0.012'

function requireUser(request: Request) {
  const user = getSessionUser(tokenFrom(request))
  if (!user) return null
  return user
}
const unauthorized = () => HttpResponse.json({ message: 'Sessão inválida' }, { status: 401 })

function emptyCart(ownerKey: string): Cart {
  return { id: `cart_${ownerKey}`, items: [], couponCode: null, updatedAt: new Date().toISOString() }
}

function priceCart(cart: Cart, couponCode: string | null): Quote {
  const lines = cart.items.map((it) => ({
    nftId: it.nftId,
    editionId: it.editionId,
    quantity: it.quantity,
    unitPriceEth: it.unitPriceEth,
    lineTotalEth: mulEth(it.unitPriceEth, it.quantity),
  }))
  const subtotalEth = lines.reduce((acc, l) => addEth(acc, l.lineTotalEth), '0')
  let discountEth = '0'
  let couponError: Quote['couponError'] = null
  if (couponCode) {
    const forced = scenario().couponForcedError
    if (forced) couponError = forced
    else if (couponCode.toUpperCase() === 'GREEN10') discountEth = mulEth(subtotalEth, 1) // placeholder 10%
    else couponError = 'invalid'
  }
  const totalEth = addEth(subtotalEth, NETWORK_FEE_ETH)
  return {
    lines,
    subtotalEth,
    discountEth,
    networkFeeEth: NETWORK_FEE_ETH,
    totalEth,
    couponCode: couponError ? null : couponCode,
    couponError,
    quoteHash: `qh_${subtotalEth}_${couponError ? 'x' : couponCode ?? 'none'}`,
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  }
}

export const accountHandlers = [
  // -- favorites --------------------------------------------------------------
  http.get(API('/favorites'), async ({ request }) => {
    await applyLatency()
    const user = requireUser(request)
    if (!user) return unauthorized()
    return HttpResponse.json({ nftIds: db.favorites[user.id] ?? [] })
  }),
  http.put(API('/favorites/:nftId'), async ({ request, params }) => {
    await applyLatency()
    const user = requireUser(request)
    if (!user) return unauthorized()
    const set = new Set(db.favorites[user.id] ?? [])
    set.add(String(params.nftId))
    db.favorites[user.id] = [...set]
    persistDb()
    return HttpResponse.json({ nftIds: db.favorites[user.id] })
  }),
  http.delete(API('/favorites/:nftId'), async ({ request, params }) => {
    await applyLatency()
    const user = requireUser(request)
    if (!user) return unauthorized()
    db.favorites[user.id] = (db.favorites[user.id] ?? []).filter((id) => id !== String(params.nftId))
    persistDb()
    return HttpResponse.json({ nftIds: db.favorites[user.id] })
  }),

  // -- cart ------------------------------------------------------------------
  http.get(API('/cart'), async ({ request }) => {
    await applyLatency()
    const user = requireUser(request)
    const key = user?.id ?? 'guest'
    db.carts[key] ??= emptyCart(key)
    return HttpResponse.json(db.carts[key])
  }),
  http.post(API('/cart/items'), async ({ request }) => {
    await applyLatency()
    const user = requireUser(request)
    const key = user?.id ?? 'guest'
    const body = (await request.json()) as AddCartItemRequest
    const nft = db.nfts.find((n) => n.id === body.nftId)
    const edition = nft?.editions.find((e) => e.id === body.editionId)
    if (!nft || !edition) return HttpResponse.json({ message: 'Item inválido' }, { status: 404 })
    if (edition.available < body.quantity) {
      return HttpResponse.json({ message: 'Sem disponibilidade', code: 'unavailable' }, { status: 409 })
    }
    const cart = (db.carts[key] ??= emptyCart(key))
    const existing = cart.items.find((i) => i.nftId === body.nftId && i.editionId === body.editionId)
    if (existing) existing.quantity += body.quantity
    else
      cart.items.push({
        nftId: nft.id,
        editionId: edition.id,
        quantity: body.quantity,
        unitPriceEth: edition.priceEth,
        name: nft.name,
        image: nft.image,
        network: nft.network,
        available: edition.available,
      })
    cart.updatedAt = new Date().toISOString()
    persistDb()
    return HttpResponse.json(cart, { status: 201 })
  }),
  http.patch(API('/cart/items/:editionId'), async ({ request, params }) => {
    await applyLatency()
    const key = requireUser(request)?.id ?? 'guest'
    const cart = (db.carts[key] ??= emptyCart(key))
    const { quantity } = (await request.json()) as { quantity: number }
    const item = cart.items.find((i) => i.editionId === String(params.editionId))
    if (!item) return HttpResponse.json({ message: 'Item não está no carrinho' }, { status: 404 })
    if (quantity <= 0) cart.items = cart.items.filter((i) => i !== item)
    else item.quantity = quantity
    cart.updatedAt = new Date().toISOString()
    persistDb()
    return HttpResponse.json(cart)
  }),
  http.delete(API('/cart/items/:editionId'), async ({ request, params }) => {
    await applyLatency()
    const key = requireUser(request)?.id ?? 'guest'
    const cart = (db.carts[key] ??= emptyCart(key))
    cart.items = cart.items.filter((i) => i.editionId !== String(params.editionId))
    cart.updatedAt = new Date().toISOString()
    persistDb()
    return HttpResponse.json(cart)
  }),

  // -- quote ---------------------------------------------------------------
  http.post(API('/quote'), async ({ request }) => {
    await applyLatency()
    const key = requireUser(request)?.id ?? 'guest'
    const { couponCode } = (await request.json()) as { cartId: string; couponCode?: string }
    const cart = db.carts[key] ?? emptyCart(key)
    return HttpResponse.json(priceCart(cart, couponCode ?? null))
  }),

  // -- orders (idempotent) ------------------------------------------------
  http.post(API('/orders'), async ({ request }) => {
    await applyLatency()
    const user = requireUser(request)
    if (!user) return unauthorized()
    const idempotencyKey = request.headers.get('idempotency-key')
    if (!idempotencyKey) {
      return HttpResponse.json({ message: 'Idempotency-Key ausente' }, { status: 400 })
    }
    const body = (await request.json()) as CreateOrderRequest
    const cartKey = user.id

    // Replay of a known key.
    const meta = db.idempotency[idempotencyKey]
    if (meta) {
      if (meta.quoteHash !== body.quoteHash) {
        return HttpResponse.json({ message: 'Conflito de idempotência', code: 'conflict' }, { status: 409 })
      }
      const existingId = db.ordersByIdempotencyKey[idempotencyKey]
      if (existingId && db.orders[existingId]) {
        return HttpResponse.json(db.orders[existingId]) // same attempt -> same order
      }
    }

    const cart = db.carts[cartKey] ?? emptyCart(cartKey)
    const quote = priceCart(cart, cart.couponCode)
    if (!meta && quote.quoteHash !== body.quoteHash) {
      return HttpResponse.json({ message: 'Cotação desatualizada', code: 'stale_quote' }, { status: 409 })
    }

    const order = createOrder(idempotencyKey, body, quote, user.id)
    db.orders[order.id] = order
    db.ordersByIdempotencyKey[idempotencyKey] = order.id
    db.idempotency[idempotencyKey] = { quoteHash: body.quoteHash, firstAttemptSeen: true }
    db.carts[cartKey] = emptyCart(cartKey) // remove purchased items
    persistDb()

    // First attempt hangs past the client timeout; the idempotent retry recovers it.
    if (scenario().orderFirstAttemptTimesOut && !meta) {
      await new Promise((r) => setTimeout(r, 16_000))
      return HttpResponse.json(order)
    }
    return HttpResponse.json(order, { status: 201 })
  }),
  http.get(API('/orders/:id'), async ({ request, params }) => {
    await applyLatency()
    const user = requireUser(request)
    if (!user) return unauthorized()
    const order = db.orders[String(params.id)]
    if (!order) return HttpResponse.json({ message: 'Pedido não encontrado' }, { status: 404 })
    return HttpResponse.json(order)
  }),

  // -- profile ----------------------------------------------------------
  http.patch(API('/profile'), async ({ request }) => {
    await applyLatency()
    const user = requireUser(request)
    if (!user) return unauthorized()
    const body = (await request.json()) as Partial<{ name: string; email: string; avatar: string | null }>
    if (body.email && db.users.some((u) => u.id !== user.id && u.email === body.email)) {
      return HttpResponse.json({ message: 'E-mail em uso', fields: { email: 'E-mail em uso' } }, { status: 409 })
    }
    Object.assign(user, body)
    persistDb()
    return HttpResponse.json(publicUser(user))
  }),
  http.post(API('/profile/password'), async ({ request }) => {
    await applyLatency()
    const user = requireUser(request)
    if (!user) return unauthorized()
    const body = (await request.json()) as { currentPassword: string; newPassword: string }
    if (body.currentPassword !== user.password) {
      return HttpResponse.json(
        { message: 'Senha atual incorreta', fields: { currentPassword: 'Senha atual incorreta' } },
        { status: 422 },
      )
    }
    user.password = body.newPassword
    persistDb()
    return HttpResponse.json({ ok: true })
  }),

  // -- wallets --------------------------------------------------------
  http.get(API('/wallets'), async ({ request }) => {
    await applyLatency()
    const user = requireUser(request)
    if (!user) return unauthorized()
    return HttpResponse.json(db.wallets[user.id] ?? [])
  }),
  http.put(API('/wallets/:role'), async ({ request, params }) => {
    await applyLatency()
    const user = requireUser(request)
    if (!user) return unauthorized()
    const body = (await request.json()) as UpsertWalletRequest
    const list = (db.wallets[user.id] ??= [])
    const role = String(params.role) as UpsertWalletRequest['role']
    const idx = list.findIndex((w) => w.role === role)
    const wallet = { id: `${user.id}_w_${role}`, ...body, role }
    if (idx >= 0) list[idx] = wallet
    else list.push(wallet)
    persistDb()
    return HttpResponse.json(wallet)
  }),
]

function createOrder(
  idempotencyKey: string,
  body: CreateOrderRequest,
  quote: Quote,
  userId: string,
): Order {
  void idempotencyKey
  void userId
  return {
    id: `order_${Math.random().toString(36).slice(2, 10)}`,
    status: 'pending',
    version: 1,
    createdAt: new Date().toISOString(),
    walletId: body.walletId,
    network: body.network,
    items: quote.lines.map((l) => ({
      nftId: l.nftId,
      editionId: l.editionId,
      name: db.nfts.find((n) => n.id === l.nftId)?.name ?? l.nftId,
      quantity: l.quantity,
      unitPriceEth: l.unitPriceEth,
      lineTotalEth: l.lineTotalEth,
    })),
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    transactionRef: null,
    explorerUrl: null,
  }
}
