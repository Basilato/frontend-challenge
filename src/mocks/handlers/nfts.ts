import { http, HttpResponse, delay } from 'msw'

import type {
  CatalogFacets,
  CatalogTab,
  NftDetail,
  NftListResponse,
  NftSummary,
  Network,
  SortKey,
} from '@/contracts'

import { COLLECTIONS } from '../data/seed'
import { db } from '../db'
import { applyLatency, scenario, shouldTransientlyFail } from '../scenario'

const API = (path: string) => `${import.meta.env.VITE_API_URL ?? '/api'}${path}`
const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']

function toSummary(n: NftDetail): NftSummary {
  const { description: _d, gallery: _g, editions: _e, attributes: _a, ...summary } = n
  return summary
}

interface ParsedFilters {
  q: string
  collections: string[]
  networks: Network[]
  priceMin: number | null
  priceMax: number | null
  tab: CatalogTab
}

function parseFilters(url: URL): ParsedFilters {
  return {
    q: url.searchParams.get('q')?.trim().toLowerCase() ?? '',
    collections: url.searchParams.getAll('collections'),
    networks: url.searchParams.getAll('networks') as Network[],
    priceMin: numOrNull(url.searchParams.get('priceMinEth')),
    priceMax: numOrNull(url.searchParams.get('priceMaxEth')),
    tab: (url.searchParams.get('tab') as CatalogTab) || 'all',
  }
}

const numOrNull = (v: string | null) => (v == null || v === '' ? null : Number(v))

/** Apply a subset of the filters; `skip` omits one facet so its own counts stay full. */
function filterNfts(rows: NftDetail[], f: ParsedFilters, skip?: 'collections' | 'networks') {
  const now = Date.now()
  return rows.filter((n) => {
    if (f.q && !`${n.name} ${n.collection} ${n.creator}`.toLowerCase().includes(f.q)) return false
    if (skip !== 'collections' && f.collections.length && !f.collections.includes(n.collection)) {
      return false
    }
    if (skip !== 'networks' && f.networks.length && !f.networks.includes(n.network)) return false
    if (f.priceMin != null && Number(n.priceEth) < f.priceMin) return false
    if (f.priceMax != null && Number(n.priceEth) > f.priceMax) return false
    if (f.tab === 'new' && now - new Date(n.listedAt).getTime() >= 12 * 36e5) return false
    if (f.tab === 'trending' && !(n.available > 0 && Number(n.priceEth) > 1)) return false
    return true
  })
}

function sortNfts(rows: NftDetail[], sort: SortKey) {
  return rows.slice().sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return Number(a.priceEth) - Number(b.priceEth)
      case 'price-desc':
        return Number(b.priceEth) - Number(a.priceEth)
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime()
    }
  })
}

export const nftHandlers = [
  http.get(API('/nfts'), async ({ request }) => {
    await applyLatency()
    if (scenario().offline) return HttpResponse.error()
    if (shouldTransientlyFail()) {
      return HttpResponse.json({ message: 'Serviço indisponível' }, { status: 503 })
    }

    const url = new URL(request.url)
    const f = parseFilters(url)
    const sort = (url.searchParams.get('sort') as SortKey) || 'recent'
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = Math.min(48, Math.max(1, Number(url.searchParams.get('pageSize')) || 9))

    const base = scenario().emptyCatalog ? [] : db.nfts
    const rows = sortNfts(filterNfts(base, f), sort)

    const total = rows.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const start = (page - 1) * pageSize
    const items = rows.slice(start, start + pageSize).map(toSummary)

    // Out-of-order responses: delay page 1 extra so a later request can land first.
    if (scenario().name === 'flaky-network' && page === 1) await delay(700)

    const body: NftListResponse = { items, page, pageSize, total, totalPages }
    return HttpResponse.json(body)
  }),

  http.get(API('/nfts/facets'), async ({ request }) => {
    await applyLatency()
    if (scenario().offline) return HttpResponse.error()
    const f = parseFilters(new URL(request.url))
    const base = scenario().emptyCatalog ? [] : db.nfts

    const forCollections = filterNfts(base, f, 'collections')
    const forNetworks = filterNfts(base, f, 'networks')
    const forPrice = filterNfts(base, f)

    const prices = forPrice.map((n) => Number(n.priceEth))
    const body: CatalogFacets = {
      collections: COLLECTIONS.map((value) => ({
        value,
        count: forCollections.filter((n) => n.collection === value).length,
      })),
      networks: NETWORKS.map((value) => ({
        value,
        count: forNetworks.filter((n) => n.network === value).length,
      })),
      priceRangeEth: {
        minEth: (prices.length ? Math.min(...prices) : 0).toFixed(2),
        maxEth: (prices.length ? Math.max(...prices) : 0).toFixed(2),
      },
    }
    return HttpResponse.json(body)
  }),

  http.get(API('/nfts/:id'), async ({ params }) => {
    await applyLatency()
    if (scenario().offline) return HttpResponse.error()
    if (shouldTransientlyFail()) {
      return HttpResponse.json({ message: 'Serviço indisponível' }, { status: 503 })
    }
    const nft = db.nfts.find((n) => n.id === params.id || n.slug === params.id)
    if (!nft) return HttpResponse.json({ message: 'NFT não encontrado' }, { status: 404 })
    return HttpResponse.json(nft)
  }),
]
