import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { ArrowRightIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

import { nftListQuery } from './api'
import { NftCard, NftCardSkeleton } from './NftCard'
import { catalogRoute } from './route'
import { searchToParams } from './search'

export function useCatalogPagination() {
  const search = catalogRoute.useSearch()
  const navigate = catalogRoute.useNavigate()
  const params = searchToParams(search)
  const { data } = useQuery(nftListQuery(params))
  return { totalPages: data?.totalPages ?? 0, page: data?.page ?? 1, navigate, data }
}

export function Pagination() {
  const { totalPages, page, navigate } = useCatalogPagination()
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          aria-current={p === page ? 'page' : undefined}
          onClick={() => navigate({ search: (s) => ({ ...s, page: p }) })}
          className="size-9 rounded-[8px] border border-border text-sm transition-colors hover:border-primary aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:font-bold aria-[current=page]:text-ink"
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        aria-label="Próxima página"
        disabled={page >= totalPages}
        onClick={() => navigate({ search: (s) => ({ ...s, page: Math.min(page + 1, totalPages) }) })}
        className="flex size-9 items-center justify-center rounded-[8px] border border-border transition-colors hover:border-primary disabled:pointer-events-none disabled:opacity-40"
      >
        <ArrowRightIcon className="size-[18px] -rotate-90" />
      </button>
    </nav>
  )
}

export function NftGrid() {
  const search = catalogRoute.useSearch()
  const params = searchToParams(search)
  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useQuery(
    nftListQuery(params),
  )

  if (isLoading) {
    return (
      <Grid>
        {Array.from({ length: params.pageSize ?? 9 }, (_, i) => (
          <li key={i}>
            <NftCardSkeleton />
          </li>
        ))}
      </Grid>
    )
  }

  if (isError) {
    return (
      <div className="rounded-[15px] bg-surface-card p-10 text-center">
        <p className="text-fg">Não foi possível carregar o catálogo.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-sm font-bold text-text-accent underline underline-offset-4"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-[15px] bg-surface-card p-10 text-center text-text-secondary">
        Nenhum NFT encontrado com os filtros atuais.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Grid busy={isFetching && isPlaceholderData}>
        {data.items.map((nft) => (
          <li key={nft.id}>
            <NftCard nft={nft} />
          </li>
        ))}
      </Grid>

      {data.totalPages > 1 && (
        <div className="md:hidden">
          <Pagination />
        </div>
      )}
    </div>
  )
}

function Grid({ children, busy, className }: { children: ReactNode; busy?: boolean; className?: string }) {
  return (
    <ul
      aria-busy={busy || undefined}
      className={cn(
        'grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:gap-x-[34px] md:gap-y-[72px]',
        className,
      )}
    >
      {children}
    </ul>
  )
}
