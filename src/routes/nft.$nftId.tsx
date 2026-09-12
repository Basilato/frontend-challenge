import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Breadcrumb } from '@/components/Breadcrumb'
import { ApiError } from '@/lib/http'
import { nftDetailQuery } from '@/features/catalog/api'
import { useAuth } from '@/features/auth/useAuth'
import { favoritesQuery, useToggleFavorite } from '@/features/favorites/api'
import { BuyPanel } from '@/features/nft/BuyPanel'
import { MobileNftHero } from '@/features/nft/MobileNftHero'
import { NftDescription } from '@/features/nft/NftDescription'
import { NftGallery } from '@/features/nft/NftGallery'
import { RelatedProducts } from '@/features/nft/RelatedProducts'

export const Route = createFileRoute('/nft/$nftId')({
  loader: async ({ context, params }) => {
    // Prefetch, but let the component render its own not-found / error state
    // rather than bubbling to the router error boundary.
    try {
      await context.queryClient.ensureQueryData(nftDetailQuery(params.nftId))
    } catch {
      /* handled in the component via useQuery */
    }
  },
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { data: nft, isLoading, isError, error, refetch } = useQuery(nftDetailQuery(nftId))
  const { data: favorites } = useQuery(favoritesQuery(user?.id ?? null))
  const toggleFavorite = useToggleFavorite()

  if (isLoading) return <DetailSkeleton />

  const notFound = isError && error instanceof ApiError && error.kind === 'not-found'

  if (notFound) {
    return (
      <div className="rounded-[15px] bg-surface-card p-12 text-center">
        <h1 className="text-xl font-bold text-text-accent">NFT não encontrado</h1>
        <p className="mt-2 text-sm text-text-secondary">
          O item que você procura não existe ou saiu do mercado.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-bold text-text-accent underline underline-offset-4"
        >
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  if (isError || !nft) {
    return (
      <div className="rounded-[15px] bg-surface-card p-12 text-center">
        <p className="text-fg">Não foi possível carregar este NFT.</p>
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

  const isFavorite = favorites?.includes(nft.id) ?? false
  // Shared by the gallery's heart icon (the only favorite affordance on
  // mobile) and BuyPanel's desktop-only "Favoritar" button, so both prompt
  // the same way when signed out instead of one silently no-oping.
  const onToggleFavorite = () => {
    if (!isAuthenticated) {
      toast.info('Entre para salvar favoritos.', {
        action: { label: 'Entrar', onClick: () => navigate({ to: '/login' }) },
      })
      return
    }
    toggleFavorite.mutate({ nftId: nft.id, next: !isFavorite })
  }

  return (
    // The Footer becomes visible from md: up (RootLayout's own breakpoint for
    // it), so the bottom gap needs to start there too, even though this
    // page's gallery/buy-panel switch to the 2-column desktop layout at the
    // wider lg: breakpoint — otherwise "Mais da coleção" sits flush against
    // the Footer in the md–lg range. Matches Início's own md:pb-24 before
    // its Footer.
    <div className="space-y-14 md:pb-24">
      <div className="hidden lg:block">
        <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/mercado' }]} />
      </div>

      <div className="-mx-4 -mt-4 space-y-0 md:mx-0 md:mt-0 lg:grid lg:grid-cols-2 lg:gap-10 lg:space-y-0">
        <div className="hidden lg:flex">
          <NftGallery
            nft={nft}
            isFavorite={isFavorite}
            favoriteDisabled={toggleFavorite.isPending}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
        <div className="lg:hidden">
          <MobileNftHero
            nft={nft}
            isFavorite={isFavorite}
            favoriteDisabled={toggleFavorite.isPending}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
        <BuyPanel nft={nft} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
      </div>

      <NftDescription nft={nft} />
      <RelatedProducts nft={nft} />
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-14">
      <div className="shimmer h-4 w-40 rounded bg-surface-card" />
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="shimmer aspect-square w-full rounded-[24px] bg-surface-card" />
        <div className="space-y-4">
          <div className="shimmer h-8 w-2/3 rounded bg-surface-card" />
          <div className="shimmer h-6 w-1/3 rounded bg-surface-card" />
          <div className="shimmer h-24 w-full rounded bg-surface-card" />
          <div className="shimmer h-10 w-1/2 rounded bg-surface-card" />
        </div>
      </div>
    </div>
  )
}
