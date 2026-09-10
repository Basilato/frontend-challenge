import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { formatEth } from '@/lib/money'
import { nftListQuery } from '@/features/catalog/api'
import { catalogSearchSchema, searchToParams } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(nftListQuery(searchToParams(deps))),
  component: CatalogPage,
})

function CatalogPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isLoading, isFetching, isPlaceholderData } = useQuery(
    nftListQuery(searchToParams(search)),
  )

  return (
    <section className="space-y-6">
      <div className="rounded-card bg-surface-card p-8">
        <p className="text-xs uppercase tracking-widest text-text-secondary">Bem-vindo à Kurio</p>
        <h1 className="mt-2 max-w-xl text-3xl font-bold leading-tight text-foreground md:text-[43px]">
          Seja dono do futuro da arte digital
        </h1>
        <p className="mt-3 max-w-lg text-sm text-text-secondary">
          Descubra NFTs selecionados de criadores emergentes e consagrados.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'new', 'trending'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={search.tab === tab}
            onClick={() => navigate({ search: (p) => ({ ...p, tab, page: 1 }) })}
            className="rounded border border-border px-3 py-1.5 text-xs aria-pressed:border-primary aria-pressed:text-text-accent"
          >
            {{ all: 'Todos os NFTs', new: 'Novos lançamentos', trending: 'Em alta' }[tab]}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-text-secondary">
          Ordenar por
          <select
            value={search.sort}
            onChange={(e) =>
              navigate({ search: (p) => ({ ...p, sort: e.target.value as typeof search.sort, page: 1 }) })
            }
            className="rounded border border-input bg-surface-dark px-2 py-1 text-foreground"
          >
            <option value="recent">Listados recentemente</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <CatalogSkeleton />
      ) : !data || data.items.length === 0 ? (
        <p className="rounded-card bg-surface-card p-8 text-center text-text-secondary">
          Nenhum NFT encontrado com os filtros atuais.
        </p>
      ) : (
        <ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-3"
          aria-busy={isFetching && isPlaceholderData}
        >
          {data.items.map((nft) => (
            <li key={nft.id} className="rounded-card bg-surface-card p-3">
              <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block">
                <img
                  src={nft.image}
                  alt={nft.name}
                  width={250}
                  height={250}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg bg-surface-dark object-cover"
                />
                <p className="mt-3 truncate text-sm font-medium text-foreground">{nft.name}</p>
                <p className="text-xs text-text-accent">{formatEth(nft.priceEth)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <nav aria-label="Paginação" className="flex items-center justify-center gap-2 text-xs">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              aria-current={p === data.page ? 'page' : undefined}
              onClick={() => navigate({ search: (s) => ({ ...s, page: p }) })}
              className="size-8 rounded border border-border aria-[current=page]:border-primary aria-[current=page]:text-text-accent"
            >
              {p}
            </button>
          ))}
        </nav>
      )}
    </section>
  )
}

function CatalogSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {Array.from({ length: 9 }, (_, i) => (
        <li key={i} className="rounded-card bg-surface-card p-3">
          <div className="shimmer aspect-square w-full rounded-lg bg-surface-dark" />
          <div className="shimmer mt-3 h-4 w-3/4 rounded bg-surface-dark" />
          <div className="shimmer mt-2 h-3 w-1/3 rounded bg-surface-dark" />
        </li>
      ))}
    </ul>
  )
}
