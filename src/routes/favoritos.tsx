import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import type { ReactNode } from 'react'

import { sessionQuery } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { AccountLayout } from '@/features/account/AccountLayout'
import { nftListQuery } from '@/features/catalog/api'
import { NftCard, NftCardSkeleton } from '@/features/catalog/NftCard'
import { cn } from '@/lib/utils'
import { favoritesQuery, useToggleFavorite } from '@/features/favorites/api'

export const Route = createFileRoute('/favoritos')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (!session) throw redirect({ to: '/login', search: { redirect: location.pathname } })
  },
  component: FavoritesPage,
})

function FavoritesPage() {
  const { user } = useAuth()
  const idsQuery = useQuery(favoritesQuery(user?.id ?? null))
  const favoriteIds = idsQuery.data ?? []
  const hasIds = favoriteIds.length > 0

  const nftsQuery = useQuery({
    ...nftListQuery({ ids: favoriteIds, pageSize: 48 }),
    enabled: hasIds,
  })

  const isLoading = idsQuery.isLoading || (hasIds && nftsQuery.isLoading)
  const isError = idsQuery.isError || (hasIds && nftsQuery.isError)
  const items = hasIds ? (nftsQuery.data?.items ?? []) : []

  const retry = () => {
    idsQuery.refetch()
    if (hasIds) nftsQuery.refetch()
  }

  return (
    <AccountLayout title="Lista de interesse">
      {isLoading ? (
        <Grid>
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i}>
              <NftCardSkeleton />
            </li>
          ))}
        </Grid>
      ) : isError ? (
        <div className="rounded-[15px] bg-surface-card p-10 text-center">
          <p className="text-fg">Não foi possível carregar seus favoritos.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 text-sm font-bold text-text-accent underline underline-offset-4"
          >
            Tentar novamente
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[15px] bg-surface-card p-10 text-center text-text-secondary">
          <Heart className="size-8" aria-hidden />
          Você ainda não favoritou nenhum NFT.
        </div>
      ) : (
        <Grid>
          {items.map((nft) => (
            <li key={nft.id} className="relative">
              <NftCard nft={nft} />
              <RemoveFavoriteButton nftId={nft.id} nftName={nft.name} />
            </li>
          ))}
        </Grid>
      )}
    </AccountLayout>
  )
}

function RemoveFavoriteButton({ nftId, nftName }: { nftId: string; nftName: string }) {
  const toggleFavorite = useToggleFavorite()
  return (
    <button
      type="button"
      aria-label={`Remover ${nftName} da lista de interesse`}
      disabled={toggleFavorite.isPending}
      onClick={() => toggleFavorite.mutate({ nftId, next: false })}
      className="absolute right-4 top-4 flex size-[36px] items-center justify-center rounded-full bg-ink/70 text-fg backdrop-blur transition-colors hover:text-text-accent disabled:opacity-50"
    >
      <Heart className={cn('size-4 fill-primary text-primary')} />
    </button>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-2 gap-x-[34px] gap-y-10 sm:grid-cols-3">{children}</ul>
  )
}
