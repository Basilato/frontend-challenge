import { fallback } from '@tanstack/zod-adapter'
import { z } from 'zod'

import type { CatalogParams } from '@/contracts'

/**
 * Catalog state lives in the URL (CLAUDE.md rule 3). Every field has a fallback
 * so a bad value never throws and links don't need to pass search. Changing any
 * filter must reset `page` to 1 (done where `navigate` is called).
 */
export const catalogSearchSchema = z.object({
  q: fallback(z.string(), '').default(''),
  collections: fallback(z.array(z.string()), []).default([]),
  networks: fallback(z.array(z.enum(['ethereum', 'polygon', 'solana'])), []).default([]),
  priceMinEth: fallback(z.string().optional(), undefined),
  priceMaxEth: fallback(z.string().optional(), undefined),
  tab: fallback(z.enum(['all', 'new', 'trending']), 'all').default('all'),
  sort: fallback(z.enum(['recent', 'price-asc', 'price-desc', 'name']), 'recent').default('recent'),
  page: fallback(z.coerce.number().int().min(1), 1).default(1),
  // Transient UI state (mobile filter drawer). Not sent to the API.
  filtersOpen: fallback(z.coerce.boolean(), false).default(false),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export function searchToParams(s: CatalogSearch): CatalogParams {
  return {
    q: s.q || undefined,
    collections: s.collections.length ? s.collections : undefined,
    networks: s.networks.length ? s.networks : undefined,
    priceMinEth: s.priceMinEth,
    priceMaxEth: s.priceMaxEth,
    tab: s.tab,
    sort: s.sort,
    page: s.page,
    pageSize: 9,
  }
}
