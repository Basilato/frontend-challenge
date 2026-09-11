import { useQuery } from '@tanstack/react-query'

import type { Cart } from '@/contracts'
import { nftListQuery } from '@/features/catalog/api'
import { NftCard, NftCardSkeleton } from '@/features/catalog/NftCard'

/** Cart page "Colecionadores também viram" — a generic pick, not tied to any one item's collection. */
export function RecommendedProducts({ cart }: { cart: Cart }) {
  const { data, isLoading } = useQuery(
    nftListQuery({ page: 1, pageSize: 10, tab: 'all', sort: 'recent' }),
  )
  const cartIds = new Set(cart.items.map((item) => item.nftId))
  const items = (data?.items ?? []).filter((n) => !cartIds.has(n.id)).slice(0, 5)

  if (!isLoading && items.length === 0) return null

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold text-fg">Colecionadores também viram</h2>
      <ul className="grid grid-cols-2 gap-x-[34px] gap-y-8 sm:grid-cols-4 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i}>
                <NftCardSkeleton />
              </li>
            ))
          : items.map((n) => (
              <li key={n.id}>
                <NftCard nft={n} />
              </li>
            ))}
      </ul>
    </section>
  )
}
