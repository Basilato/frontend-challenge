import { Heart, Search } from 'lucide-react'
import { useState } from 'react'

import type { NftDetail } from '@/contracts'
import { cn } from '@/lib/utils'

import { NftGalleryModal } from './NftGalleryModal'

export function NftGallery({
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
  const images = nft.gallery.length ? nft.gallery : [nft.image]
  const [active, setActive] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const current = images[active] ?? nft.image

  return (
    <div className="flex gap-4 sm:gap-7">
      <ul className="flex shrink-0 flex-col gap-4" aria-label="Miniaturas">
        {images.slice(0, 4).map((src, i) => (
          <li key={src}>
            <button
              type="button"
              aria-label={`Ver imagem ${i + 1}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={cn(
                'block size-[68px] overflow-hidden rounded-[8px] border bg-surface-card transition-colors sm:size-[100px]',
                i === active ? 'border-primary' : 'border-transparent hover:border-border-soft',
              )}
            >
              <img src={src} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative flex flex-1 items-center justify-center rounded-[6px] bg-surface-card p-3 sm:p-4">
        <img
          src={current}
          alt={nft.name}
          width={404}
          height={404}
          fetchPriority="high"
          className="aspect-square w-full rounded-[24px] object-cover"
        />
        <button
          type="button"
          onClick={() => setGalleryOpen(true)}
          aria-label={images.length > 1 ? 'Abrir galeria de imagens' : 'Ampliar imagem'}
          className="absolute right-4 top-4 flex size-[30px] items-center justify-center rounded-full bg-ink/70 text-fg outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={favoriteDisabled}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className="absolute bottom-4 right-4 flex size-[36px] items-center justify-center rounded-full bg-ink/70 text-fg backdrop-blur transition-colors hover:text-text-accent disabled:opacity-50"
        >
          <Heart className={cn('size-4', isFavorite && 'fill-primary text-primary')} />
        </button>
      </div>

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
