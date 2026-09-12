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
        'flex flex-col gap-4 rounded-[15px] bg-gradient-to-b from-primary/10 to-primary/[0.03] pb-1 pt-6',
        className,
      )}
    >
      <div className="flex flex-col gap-4 px-5">
        <p className="text-2xl font-bold leading-tight text-text-accent">NFT EM DESTAQUE</p>
        <p className="text-center text-[22px] font-bold leading-tight text-fg">OFERTA LIMITADA</p>
      </div>
      {featured ? (
        <Link
          to="/nft/$nftId"
          params={{ nftId: featured.id }}
          aria-label={`${featured.name} — ${formatEth(featured.priceEth)}`}
          className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <img
            src={featured.image}
            alt={featured.name}
            width={310}
            height={368}
            loading="lazy"
            className="h-[368px] w-full rounded-[22px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
      ) : (
        <div className="shimmer h-[368px] w-full rounded-[22px] bg-surface-card" />
      )}
    </div>
  )
}
