import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { Cart, CartItem } from '@/contracts'
import { ApiError } from '@/lib/http'
import { formatEth } from '@/lib/money'

import { useRemoveCartItem, useUpdateCartItem } from './api'

const MAX_PER_ORDER = 10

/**
 * Mobile-only cart list (Figma "Mobile / Carrinho de NFTs"): each item is
 * its own card (rounded corners, drop shadow, thumbnail flush to the left
 * edge) rather than the desktop table row. Same mutations as the desktop
 * CartTable/CartRow, just a different shell.
 */
export function MobileCartList({ cart }: { cart: Cart }) {
  return (
    <ul className="flex flex-col gap-5">
      {cart.items.map((item) => (
        <li key={item.editionId}>
          <MobileCartCard item={item} />
        </li>
      ))}
    </ul>
  )
}

function MobileCartCard({ item }: { item: CartItem }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const cap = Math.max(1, Math.min(item.available, MAX_PER_ORDER))

  const setQty = (quantity: number) => {
    update.mutate(
      { editionId: item.editionId, quantity },
      {
        onError: (error) =>
          toast.error(
            error instanceof ApiError && error.kind === 'conflict'
              ? error.message
              : 'Não foi possível atualizar a quantidade.',
          ),
      },
    )
  }

  return (
    <div className="relative flex h-[100px] overflow-hidden rounded-[14px] bg-surface-card shadow-[0_6px_20px_rgba(10,6,4,0.45)]">
      <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="block h-full w-[100px] shrink-0">
        <img src={item.image} alt="" className="size-full object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 py-3 pl-3 pr-4">
        <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="min-w-0">
          <p className="truncate text-[15px] font-bold text-fg">{item.name}</p>
          <p className="text-sm text-text-secondary">Edição: {item.editionLabel}</p>
          <p className="text-lg font-bold text-text-accent">{formatEth(item.unitPriceEth)}</p>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={update.isPending}
            onClick={() => setQty(item.quantity - 1)}
            className="flex size-6 items-center justify-center rounded-full border border-border bg-surface-raised text-text-secondary disabled:opacity-50"
          >
            <Minus className="size-3" />
          </button>
          <span aria-live="polite" className="w-4 text-center text-md text-fg">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={update.isPending || item.quantity >= cap}
            onClick={() => setQty(item.quantity + 1)}
            className="flex size-6 items-center justify-center rounded-full border border-border bg-surface-raised text-fg disabled:opacity-50"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>

      <button
        type="button"
        aria-label={`Remover ${item.name} do carrinho`}
        disabled={remove.isPending}
        onClick={() => remove.mutate(item.editionId)}
        className="absolute right-3 top-3 text-primary outline-none disabled:opacity-50"
      >
        <Trash2 className="size-[18px]" />
      </button>
    </div>
  )
}
