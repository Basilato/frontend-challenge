/**
 * Named, reproducible scenarios. Selected via `?scenario=` on first load or the
 * dev panel; persisted to sessionStorage. Handlers read these knobs to inject
 * latency and failures (MSW guide).
 */
export type ScenarioName =
  | 'default'
  | 'empty-catalog'
  | 'slow-network'
  | 'flaky-network'
  | 'offline'
  | 'coupon-expired'
  | 'price-changed-during-checkout'
  | 'order-timeout-then-recover'
  | 'payment-rejected'
  | 'wallet-connect-rejected'
  | 'favorite-write-fails'

export interface ScenarioConfig {
  name: ScenarioName
  /** base latency in ms applied to every response */
  latencyMs: number
  /** extra random jitter in ms */
  jitterMs: number
  /** probability [0..1] that a GET fails with 503 */
  transientFailureRate: number
  /** simulate no connectivity */
  offline: boolean
  emptyCatalog: boolean
  couponForcedError: 'invalid' | 'expired' | null
  /** emit an nft.updated for a cart item shortly after checkout opens */
  bumpCartPriceOnCheckout: boolean
  /** first order create times out; the idempotent retry recovers it */
  orderFirstAttemptTimesOut: boolean
  /** order.updated resolves to 'rejected' instead of 'confirmed' */
  paymentRejected: boolean
  /** wallet connection simulation is refused */
  walletConnectRejected: boolean
  /** favorite add/remove mutations fail with 503 */
  favoriteWriteFails: boolean
}

const PRESETS: Record<ScenarioName, ScenarioConfig> = {
  default: base('default'),
  'empty-catalog': { ...base('empty-catalog'), emptyCatalog: true },
  'slow-network': { ...base('slow-network'), latencyMs: 1800, jitterMs: 600 },
  'flaky-network': { ...base('flaky-network'), transientFailureRate: 0.35, jitterMs: 800 },
  offline: { ...base('offline'), offline: true },
  'coupon-expired': { ...base('coupon-expired'), couponForcedError: 'expired' },
  'price-changed-during-checkout': {
    ...base('price-changed-during-checkout'),
    bumpCartPriceOnCheckout: true,
  },
  'order-timeout-then-recover': {
    ...base('order-timeout-then-recover'),
    orderFirstAttemptTimesOut: true,
  },
  'payment-rejected': { ...base('payment-rejected'), paymentRejected: true },
  'wallet-connect-rejected': {
    ...base('wallet-connect-rejected'),
    walletConnectRejected: true,
  },
  'favorite-write-fails': { ...base('favorite-write-fails'), favoriteWriteFails: true },
}

function base(name: ScenarioName): ScenarioConfig {
  return {
    name,
    latencyMs: 120,
    jitterMs: 180,
    transientFailureRate: 0,
    offline: false,
    emptyCatalog: false,
    couponForcedError: null,
    bumpCartPriceOnCheckout: false,
    orderFirstAttemptTimesOut: false,
    paymentRejected: false,
    walletConnectRejected: false,
    favoriteWriteFails: false,
  }
}

const SESSION_KEY = 'greenmint.scenario'

function initialName(): ScenarioName {
  try {
    const fromUrl = new URLSearchParams(location.search).get('scenario') as ScenarioName | null
    if (fromUrl && fromUrl in PRESETS) {
      sessionStorage.setItem(SESSION_KEY, fromUrl)
      return fromUrl
    }
    const stored = sessionStorage.getItem(SESSION_KEY) as ScenarioName | null
    if (stored && stored in PRESETS) return stored
  } catch {
    /* ignore */
  }
  return 'default'
}

let current: ScenarioConfig = PRESETS[initialName()]

export function scenario(): ScenarioConfig {
  return current
}

export function setScenario(name: ScenarioName): void {
  current = PRESETS[name]
  try {
    sessionStorage.setItem(SESSION_KEY, name)
  } catch {
    /* ignore */
  }
}

export const scenarioNames = Object.keys(PRESETS) as ScenarioName[]

export async function applyLatency(): Promise<void> {
  const { latencyMs, jitterMs } = current
  const ms = latencyMs + Math.random() * jitterMs
  if (ms > 0) await new Promise((r) => setTimeout(r, ms))
}

export function shouldTransientlyFail(): boolean {
  return Math.random() < current.transientFailureRate
}
