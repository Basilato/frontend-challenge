import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { nftListQuery } from './api'
import { NftCard, NftCardSkeleton } from './NftCard'
import { catalogRoute } from './route'
import { searchToParams } from './search'

export function NftGrid() {
  const search = catalogRoute.useSearch()
  const navigate = catalogRoute.useNavigate()
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
    <div className="space-y-8">
      <Grid busy={isFetching && isPlaceholderData}>
        {data.items.map((nft) => (
          <li key={nft.id}>
            <NftCard nft={nft} />
          </li>
        ))}
      </Grid>

      {data.totalPages > 1 && (
        <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              aria-current={p === data.page ? 'page' : undefined}
              onClick={() => navigate({ search: (s) => ({ ...s, page: p }) })}
              className="size-9 rounded-[8px] border border-border text-sm transition-colors hover:border-primary aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:font-bold aria-[current=page]:text-ink"
            >
              {p}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

function Grid({ children, busy }: { children: ReactNode; busy?: boolean }) {
  return (
    <ul aria-busy={busy || undefined} className="grid grid-cols-2 gap-x-[34px] gap-y-10 sm:grid-cols-3">
      {children}
    </ul>
  )
}
