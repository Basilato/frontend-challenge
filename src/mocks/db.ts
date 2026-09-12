import type { Cart, NftDetail, Order, Wallet } from '@/contracts'

import { buildNfts, USERS, walletsFor, type SeedUser } from './data/seed'

/**
 * Single source of truth for the mock backend. Catalog, favorites, cart,
 * profile, wallets and orders all read and write this object. Persisted to
 * localStorage so a refresh survives; `resetDb()` restores a known scenario.
 */
export interface MockDb {
  nfts: NftDetail[]
  users: SeedUser[]
  favorites: Record<string, string[]> // userId -> nftIds
  carts: Record<string, Cart> // ownerKey (userId or guest id) -> cart
  wallets: Record<string, Wallet[]> // userId -> wallets
  orders: Record<string, Order> // orderId -> order
  orderOwners: Record<string, string> // orderId -> userId (private, never serialized in responses)
  ordersByIdempotencyKey: Record<string, string> // key -> orderId
  idempotency: Record<string, { quoteHash: string; firstAttemptSeen: boolean }> // key -> meta
  sessions: Record<string, { userId: string; expiresAt: number }> // token -> session
}

// Bump the version suffix whenever the seed shape changes (item count, fields,
// image source, …) — returning browsers keep whatever they last persisted here
// otherwise, so a seed change alone never reaches them.
const STORAGE_KEY = 'greenmint.mockdb.v2'

function freshDb(): MockDb {
  return {
    nfts: buildNfts(36),
    users: USERS.map((u) => ({ ...u })),
    favorites: {},
    carts: {},
    wallets: Object.fromEntries(USERS.map((u) => [u.id, walletsFor(u.id)])),
    orders: {},
    orderOwners: {},
    ordersByIdempotencyKey: {},
    idempotency: {},
    sessions: {},
  }
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MockDb
  } catch {
    /* ignore */
  }
  return freshDb()
}

export let db: MockDb = load()

export function persistDb(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    /* ignore */
  }
}

export function resetDb(): void {
  db = freshDb()
  persistDb()
}

export function getUserByEmail(email: string): SeedUser | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function getSessionUser(token: string | undefined): SeedUser | undefined {
  if (!token) return undefined
  const session = db.sessions[token]
  if (!session || session.expiresAt < Date.now()) return undefined
  return db.users.find((u) => u.id === session.userId)
}
