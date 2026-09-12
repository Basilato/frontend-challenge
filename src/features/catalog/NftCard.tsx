import { Link } from '@tanstack/react-router'

import type { NftSummary } from '@/contracts'
import { formatEth } from '@/lib/money'

export function NftCard({ nft }: { nft: NftSummary }) {
  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: nft.id }}
      className="group flex flex-col gap-3 rounded-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative rounded-[15px] bg-surface-card p-2">
        <img
          src={nft.image}
          alt={nft.name}
          width={250}
          height={250}
          loading="lazy"
          className="aspect-square w-full rounded-[12px] bg-surface-dark object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <p className="truncate text-base leading-none text-fg">{nft.name}</p>
      <p className="text-lg font-bold leading-none text-text-accent">{formatEth(nft.priceEth)}</p>
    </Link>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[15px] bg-surface-card p-2">
        <div className="shimmer aspect-square w-full rounded-[12px] bg-surface-dark" />
      </div>
      <div className="shimmer h-4 w-3/4 rounded bg-surface-card" />
      <div className="shimmer h-4 w-1/3 rounded bg-surface-card" />
    </div>
  )
}
