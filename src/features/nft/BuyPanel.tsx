import { useNavigate } from '@tanstack/react-router'
import { Heart, Minus, Plus, Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { NftDetail } from '@/contracts'
import { LinkedinShareIcon, MessageShareIcon, TwitterShareIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useAddToCart } from '@/features/cart/api'

import { MobileBuyBar } from './MobileBuyBar'

const MAX_PER_ORDER = 10

export function BuyPanel({
  nft,
  isFavorite,
  onToggleFavorite,
}: {
  nft: NftDetail
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  const navigate = useNavigate()
  const addToCart = useAddToCart()

  const firstAvailable = nft.editions.find((e) => e.available > 0) ?? nft.editions[0]!
  const [editionId, setEditionId] = useState(firstAvailable.id)
  const edition = nft.editions.find((e) => e.id === editionId) ?? firstAvailable
  const maxQty = Math.max(1, Math.min(edition.available, MAX_PER_ORDER))
  const [qty, setQty] = useState(1)
  const clampedQty = Math.min(qty, maxQty)
  const canBuy = edition.available > 0

  const rounded = Math.round(nft.rating)

  const buy = () => {
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity: clampedQty },
      {
        onSuccess: () =>
          toast.success('Adicionado ao carrinho', {
            action: { label: 'Ver carrinho', onClick: () => navigate({ to: '/carrinho' }) },
          }),
        onError: () => toast.error('Não foi possível adicionar ao carrinho.'),
      },
    )
  }

  return (
    <div className="relative -mt-8 flex flex-col gap-5 rounded-t-[31px] bg-surface-card px-6 pb-6 pt-8 lg:mt-0 lg:rounded-none lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0">
      {/* Desktop header: title, price, and a 5-star row with the review
          count spelled out. The Figma mobile frame has none of that — see
          the compact title+rating-pill row just below, mobile-only. */}
      <div className="hidden space-y-3 border-b border-border pb-4 lg:block">
        <h1 className="text-[28px] font-bold leading-tight text-fg">{nft.name}</h1>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[22px] font-bold text-text-accent">{formatEth(edition.priceEth)}</p>
          <p className="flex items-center gap-1 text-[15px] text-fg">
            <span className="flex" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn('size-4', i < rounded ? 'fill-primary text-primary' : 'text-border-soft')}
                />
              ))}
            </span>
            {nft.reviewCount} avaliações de colecionadores
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 lg:hidden">
        <h1 className="text-[20px] font-bold leading-4 text-fg">{nft.name}</h1>
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-3 py-1.5">
          <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
          <span className="text-sm">
            <span className="font-medium text-fg">{nft.rating.toFixed(1)}</span>
            <span className="text-text-secondary">({nft.reviewCount})</span>
          </span>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="hidden text-[15px] font-bold text-fg lg:block">Sobre este NFT:</h2>
        <p className="text-sm leading-6 text-text-secondary">{nft.description}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-bold text-fg">Edição:</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Edição">
          {nft.editions.map((e) => {
            const selected = e.id === editionId
            const disabled = e.available <= 0
            return (
              <button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => {
                  setEditionId(e.id)
                  setQty(1)
                }}
                className={cn(
                  'h-[28px] rounded-full border px-3 text-sm transition-colors',
                  disabled && 'cursor-not-allowed border-border text-text-secondary/40 line-through',
                  !disabled && selected && 'border-primary text-text-accent',
                  !disabled && !selected && 'border-border-soft text-text-secondary hover:border-primary',
                )}
              >
                {e.label}
              </button>
            )
          })}
        </div>
        {!canBuy && (
          <p className="text-sm text-text-secondary" role="status">
            Esta edição está indisponível no momento.
          </p>
        )}
      </section>

      {/* Figma's mobile "Detalhes do NFT" frame moves quantity/price/buy into
          the sticky Buy Bar (see MobileBuyBar below) and has no inline
          Favoritar button — favoriting is the heart on the hero image. This
          row is the desktop-only equivalent. */}
      <div className="hidden flex-wrap items-center gap-4 lg:flex">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={clampedQty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex size-[38px] items-center justify-center rounded-full border border-ink bg-primary text-ink disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span aria-live="polite" className="w-6 text-center text-xl text-fg">
            {clampedQty}
          </span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={clampedQty >= maxQty}
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="flex size-[38px] items-center justify-center rounded-full border border-ink bg-primary text-ink disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <Button className="w-[130px]" disabled={!canBuy || addToCart.isPending} onClick={buy}>
          COMPRAR
        </Button>

        <Button
          variant="outline"
          className="w-[130px] gap-2 border-primary text-text-accent"
          aria-pressed={isFavorite}
          onClick={onToggleFavorite}
        >
          <Heart className={cn('size-4', isFavorite && 'fill-current')} />
          {isFavorite ? 'Favoritado' : 'Favoritar'}
        </Button>
      </div>

      <MobileBuyBar
        priceEth={edition.priceEth}
        qty={clampedQty}
        minQty={1}
        maxQty={maxQty}
        onDecrease={() => setQty((q) => Math.max(1, q - 1))}
        onIncrease={() => setQty((q) => Math.min(maxQty, q + 1))}
        onBuy={buy}
        buyDisabled={!canBuy || addToCart.isPending}
      />

      <dl className="space-y-2 text-[15px] text-secondary">
        <div className="flex gap-2">
          <dt>ID do token:</dt>
          <dd>{nft.tokenId}</dd>
        </div>
        <div className="flex gap-2">
          <dt>Coleção:</dt>
          <dd>{nft.collection}</dd>
        </div>
        <div className="flex gap-2">
          <dt>Atributos:</dt>
          <dd>{nft.attributes.map((a) => a.value).join(', ')}</dd>
        </div>
      </dl>

      <div className="flex items-center gap-2">
        <span className="text-[15px] font-bold text-fg">Compartilhar este NFT:</span>
        <a
          aria-label="Compartilhar no LinkedIn"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(location.href)}`}
          target="_blank"
          rel="noreferrer"
          className="text-fg transition-colors hover:text-text-accent"
        >
          <LinkedinShareIcon className="h-[14.375px] w-[15px]" />
        </a>
        <a
          aria-label="Compartilhar por e-mail"
          href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(location.href)}`}
          className="text-fg transition-colors hover:text-text-accent"
        >
          <MessageShareIcon className="size-[18px]" />
        </a>
        <a
          aria-label="Compartilhar no X (Twitter)"
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(nft.name)}&url=${encodeURIComponent(location.href)}`}
          target="_blank"
          rel="noreferrer"
          className="text-fg transition-colors hover:text-text-accent"
        >
          <TwitterShareIcon className="h-[12.191px] w-[15.966px]" />
        </a>
      </div>
    </div>
  )
}
