import { useRouter } from '@tanstack/react-router'
import { ChevronLeft, Heart } from 'lucide-react'
import { useState } from 'react'

import type { NftDetail } from '@/contracts'
import { cn } from '@/lib/utils'

import { NftGalleryModal } from './NftGalleryModal'

/**
 * Mobile-only hero for the NFT detail screen (Figma "Mobile / Detalhes do
 * NFT", node 70396:241): a single full-bleed image with a back button and
 * the favorite heart overlaid on it — no thumbnail rail, no carousel dots
 * (the Figma frame doesn't have those on mobile). Only the main photo shows
 * here; tapping it opens NftGalleryModal to browse the rest.
 */
export function MobileNftHero({
  nft,
  isFavorite,
  onToggleFavorite,
  favoriteDisabled,
}: {
  nft: NftDetail
  isFavorite: boolean
  onToggleFavorite: () => void
  favoriteDisabled?: boolean
}) {
  const router = useRouter()
  const images = nft.gallery.length ? nft.gallery : [nft.image]
  const [active, setActive] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const current = images[active] ?? nft.image

  return (
    <div
      className="relative [background:linear-gradient(137.6deg,#241612_12%,#2f1d15_106.6%)]"
      style={{ padding: '23px 28px 32px' }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: '/' }))}
          className="flex size-[35px] items-center justify-center rounded-full border border-border bg-surface-raised text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={favoriteDisabled}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className="flex size-[35px] items-center justify-center rounded-full border border-border bg-surface-raised text-fg outline-none transition-colors hover:text-text-accent disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Heart className={cn('size-4', isFavorite && 'fill-primary text-primary')} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setGalleryOpen(true)}
        aria-label={images.length > 1 ? 'Abrir galeria de imagens' : 'Ampliar imagem'}
        className="relative mt-2 block aspect-square w-full overflow-hidden rounded-[24px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img src={current} alt={nft.name} className="size-full object-cover" fetchPriority="high" />
      </button>

      <NftGalleryModal
        images={images}
        name={nft.name}
        active={active}
        onActiveChange={setActive}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />
    </div>
  )
}
