/**
 * Typed REST contracts — the boundary between transport, state and UI (CLAUDE.md).
 * The MSW handlers and the Axios API functions both import from here: one source.
 * ETH amounts are always decimal strings (see lib/money.ts).
 */

// ---------------------------------------------------------------------------
// Domain
// ---------------------------------------------------------------------------

export type Network = 'ethereum' | 'polygon' | 'solana'

export interface NftEdition {
  id: string
  label: string
  priceEth: string
  /** units still available for this edition */
  available: number
}

export interface NftSummary {
  id: string
  slug: string
  name: string
  collection: string
  creator: string
  image: string
  priceEth: string
  network: Network
  available: number
  /** monotonic version, bumped by nft.updated events */
  version: number
  listedAt: string
  createdAt: string
}

export interface NftDetail extends NftSummary {
  description: string
  gallery: string[]
  editions: NftEdition[]
  attributes: { trait: string; value: string }[]
}

// ---------------------------------------------------------------------------
// NFTs — listing + detail
// ---------------------------------------------------------------------------

export type CatalogTab = 'all' | 'new' | 'trending'
export type SortKey = 'recent' | 'price-asc' | 'price-desc' | 'name'

export interface CatalogParams {
  q?: string
  collections?: string[]
  networks?: Network[]
  priceMinEth?: string
  priceMaxEth?: string
  tab?: CatalogTab
  sort?: SortKey
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type NftListResponse = Paginated<NftSummary>

// ---------------------------------------------------------------------------
// Session & account
// ---------------------------------------------------------------------------

export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
}

export interface Session {
  user: User
  expiresAt: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export interface FavoritesResponse {
  nftIds: string[]
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export interface CartItem {
  nftId: string
  editionId: string
  quantity: number
  /** snapshot of unit price when added; revalidated at quote time */
  unitPriceEth: string
  name: string
  image: string
  network: Network
  available: number
}

export interface Cart {
  id: string
  items: CartItem[]
  couponCode: string | null
  updatedAt: string
}

export interface AddCartItemRequest {
  nftId: string
  editionId: string
  quantity: number
}

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------

export interface QuoteRequest {
  cartId: string
  couponCode?: string
}

export interface QuoteLine {
  nftId: string
  editionId: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
}

export interface Quote {
  lines: QuoteLine[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  couponCode: string | null
  couponError: 'invalid' | 'expired' | null
  /** hash of the priced cart state; the order must be created against this */
  quoteHash: string
  expiresAt: string
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type OrderStatus = 'pending' | 'confirmed' | 'rejected'

export interface OrderItemReceipt {
  nftId: string
  editionId: string
  name: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
}

export interface Order {
  id: string
  status: OrderStatus
  /** monotonic version, bumped by order.updated events */
  version: number
  createdAt: string
  walletId: string
  network: Network
  items: OrderItemReceipt[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  transactionRef: string | null
  explorerUrl: string | null
}

export interface CreateOrderRequest {
  quoteHash: string
  cartId: string
  walletId: string
  network: Network
  collector: {
    name: string
    email: string
  }
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface UpdateProfileRequest {
  name?: string
  email?: string
  avatar?: string | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// ---------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------

export type WalletRole = 'primary' | 'secondary'

export interface Wallet {
  id: string
  role: WalletRole
  label: string
  address: string
  networks: Network[]
}

export interface UpsertWalletRequest {
  role: WalletRole
  label: string
  address: string
  networks: Network[]
}

// ---------------------------------------------------------------------------
// Realtime events
// ---------------------------------------------------------------------------

export interface NftUpdatedEvent {
  type: 'nft.updated'
  nftId: string
  version: number
  priceEth: string
  available: number
}

export interface OrderUpdatedEvent {
  type: 'order.updated'
  orderId: string
  version: number
  status: OrderStatus
  transactionRef: string | null
  explorerUrl: string | null
}

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

// ---------------------------------------------------------------------------
// Error envelope
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  message: string
  code?: string
  fields?: Record<string, string>
}
