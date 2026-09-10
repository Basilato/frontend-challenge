import { useNavigate } from '@tanstack/react-router'
import { Heart, Link2, Mail, Minus, Plus, Share2, Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { NftDetail } from '@/contracts'
import { Button } from '@/components/ui/button'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useAddToCart } from '@/features/cart/api'

const MAX_PER_ORDER = 10

export function BuyPanel({
  nft,
  isAuthenticated,
  isFavorite,
  onToggleFavorite,
}: {
  nft: NftDetail
  isAuthenticated: boolean
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

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-3 border-b border-border pb-4">
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

      <section className="space-y-3">
        <h2 className="text-[15px] font-bold text-fg">Sobre este NFT:</h2>
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

      <div className="flex flex-wrap items-center gap-4">
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

        <Button
          className="w-[130px]"
          disabled={!canBuy || addToCart.isPending}
          onClick={() => {
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
          }}
        >
          COMPRAR
        </Button>

        <Button
          variant="outline"
          className="w-[130px] gap-2 border-primary text-text-accent"
          aria-pressed={isFavorite}
          onClick={() => {
            if (!isAuthenticated) {
              toast.info('Entre para salvar favoritos.', {
                action: { label: 'Entrar', onClick: () => navigate({ to: '/login' }) },
              })
              return
            }
            onToggleFavorite()
          }}
        >
          <Heart className={cn('size-4', isFavorite && 'fill-current')} />
          {isFavorite ? 'Favoritado' : 'Favoritar'}
        </Button>
      </div>

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

      <div className="flex items-center gap-3">
        <span className="text-[15px] font-bold text-fg">Compartilhar este NFT:</span>
        <button
          type="button"
          aria-label="Copiar link"
          onClick={() => {
            navigator.clipboard?.writeText(location.href)
            toast.success('Link copiado')
          }}
          className="text-text-secondary transition-colors hover:text-text-accent"
        >
          <Link2 className="size-[18px]" />
        </button>
        <a
          aria-label="Compartilhar por e-mail"
          href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(location.href)}`}
          className="text-text-secondary transition-colors hover:text-text-accent"
        >
          <Mail className="size-[18px]" />
        </a>
        <button
          type="button"
          aria-label="Compartilhar"
          onClick={() => {
            if (navigator.share) void navigator.share({ title: nft.name, url: location.href })
            else {
              navigator.clipboard?.writeText(location.href)
              toast.success('Link copiado')
            }
          }}
          className="text-text-secondary transition-colors hover:text-text-accent"
        >
          <Share2 className="size-[18px]" />
        </button>
      </div>
    </div>
  )
}
