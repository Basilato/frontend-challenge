import { http, HttpResponse, delay } from 'msw'

import type { CatalogTab, NftListResponse, NftSummary, Network, SortKey } from '@/contracts'

import { db } from '../db'
import { applyLatency, scenario, shouldTransientlyFail } from '../scenario'

const API = (path: string) => `${import.meta.env.VITE_API_URL ?? '/api'}${path}`

function toSummary(n: (typeof db.nfts)[number]): NftSummary {
  const { description: _d, gallery: _g, editions: _e, attributes: _a, ...summary } = n
  return summary
}

export const nftHandlers = [
  http.get(API('/nfts'), async ({ request }) => {
    await applyLatency()
    if (scenario().offline) return HttpResponse.error()
    if (shouldTransientlyFail()) {
      return HttpResponse.json({ message: 'Serviço indisponível' }, { status: 503 })
    }

    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
    const collections = url.searchParams.getAll('collections')
    const networks = url.searchParams.getAll('networks') as Network[]
    const priceMin = url.searchParams.get('priceMinEth')
    const priceMax = url.searchParams.get('priceMaxEth')
    const tab = (url.searchParams.get('tab') as CatalogTab) || 'all'
    const sort = (url.searchParams.get('sort') as SortKey) || 'recent'
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = Math.min(48, Math.max(1, Number(url.searchParams.get('pageSize')) || 9))

    let rows = scenario().emptyCatalog ? [] : db.nfts.slice()

    if (q) rows = rows.filter((n) => `${n.name} ${n.collection} ${n.creator}`.toLowerCase().includes(q))
    if (collections.length) rows = rows.filter((n) => collections.includes(n.collection))
    if (networks.length) rows = rows.filter((n) => networks.includes(n.network))
    if (priceMin) rows = rows.filter((n) => Number(n.priceEth) >= Number(priceMin))
    if (priceMax) rows = rows.filter((n) => Number(n.priceEth) <= Number(priceMax))

    const now = Date.now()
    if (tab === 'new') rows = rows.filter((n) => now - new Date(n.listedAt).getTime() < 12 * 36e5)
    if (tab === 'trending') rows = rows.filter((n) => n.available > 0 && Number(n.priceEth) > 1)

    rows.sort((a, b) => {
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

    const total = rows.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const start = (page - 1) * pageSize
    const items = rows.slice(start, start + pageSize).map(toSummary)

    // Out-of-order responses: delay page 1 extra so a later request can land first.
    if (scenario().name === 'flaky-network' && page === 1) await delay(700)

    const body: NftListResponse = { items, page, pageSize, total, totalPages }
    return HttpResponse.json(body)
  }),

  http.get(API('/nfts/:id'), async ({ params }) => {
    await applyLatency()
    if (scenario().offline) return HttpResponse.error()
    const nft = db.nfts.find((n) => n.id === params.id || n.slug === params.id)
    if (!nft) return HttpResponse.json({ message: 'NFT não encontrado' }, { status: 404 })
    return HttpResponse.json(nft)
  }),
]
