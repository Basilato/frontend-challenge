import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'

import { nftListQuery } from './api'

/** Sidebar promo — highlights the priciest currently-available NFT. */
export function FeaturedNftBanner({ className }: { className?: string }) {
  const { data } = useQuery(
    nftListQuery({ sort: 'price-desc', page: 1, pageSize: 4, tab: 'all' }),
  )
  const featured = data?.items.find((n) => n.available > 0) ?? data?.items[0]

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-[15px] bg-gradient-to-b from-primary/10 to-primary/[0.03] px-4 pb-2 pt-6',
        className,
      )}
    >
      <p className="w-full text-2xl font-bold leading-tight text-text-accent">NFT EM DESTAQUE</p>
      <p className="w-full text-center text-lg font-bold text-fg">OFERTA LIMITADA</p>
      {featured ? (
        <Link
          to="/nft/$nftId"
          params={{ nftId: featured.id }}
          className="group block w-full overflow-hidden rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <img
            src={featured.image}
            alt={featured.name}
            width={270}
            height={340}
            loading="lazy"
            className="h-[340px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <span className="mt-3 flex items-baseline justify-between">
            <span className="truncate text-sm text-fg">{featured.name}</span>
            <span className="shrink-0 text-sm font-bold text-text-accent">
              {formatEth(featured.priceEth)}
            </span>
          </span>
        </Link>
      ) : (
        <div className="shimmer h-[340px] w-full rounded-[22px] bg-surface-card" />
      )}
    </div>
  )
}
