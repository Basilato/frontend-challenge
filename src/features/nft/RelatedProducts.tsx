import { useQuery } from '@tanstack/react-query'

import type { NftDetail } from '@/contracts'
import { nftListQuery } from '@/features/catalog/api'
import { NftCard, NftCardSkeleton } from '@/features/catalog/NftCard'

export function RelatedProducts({ nft }: { nft: NftDetail }) {
  const { data, isLoading } = useQuery(
    nftListQuery({ collections: [nft.collection], page: 1, pageSize: 5, tab: 'all', sort: 'recent' }),
  )
  const items = (data?.items ?? []).filter((n) => n.id !== nft.id).slice(0, 4)

  if (!isLoading && items.length === 0) return null

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold text-fg">Mais da coleção {nft.collection}</h2>
      <ul className="grid grid-cols-2 gap-x-[34px] gap-y-8 sm:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => (
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
