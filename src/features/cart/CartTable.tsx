import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { Cart, CartItem } from '@/contracts'
import { ApiError } from '@/lib/http'
import { formatEth, mulEth } from '@/lib/money'

import { useRemoveCartItem, useUpdateCartItem } from './api'

const MAX_PER_ORDER = 10

export function CartTable({ cart }: { cart: Cart }) {
  return (
    <div className="min-w-0">
      <div className="hidden grid-cols-[1fr_88px_120px_96px_32px] items-center gap-4 border-b border-border pb-3 pr-2 text-base font-bold text-fg sm:grid">
        <span>NFTs</span>
        <span>Preço</span>
        <span>Edições</span>
        <span>Total</span>
        <span className="sr-only">Remover</span>
      </div>
      <ul className="mt-3 space-y-3">
        {cart.items.map((item) => (
          <li key={item.editionId}>
            <CartRow item={item} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function CartRow({ item }: { item: CartItem }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const cap = Math.max(1, Math.min(item.available, MAX_PER_ORDER))
  const lineTotal = mulEth(item.unitPriceEth, item.quantity)

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
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 rounded-[8px] bg-surface-card p-3 sm:grid-cols-[1fr_88px_120px_96px_32px] sm:py-2 sm:pr-2">
      <Link
        to="/nft/$nftId"
        params={{ nftId: item.nftId }}
        className="flex min-w-0 items-center gap-4"
      >
        <img
          src={item.image}
          alt=""
          width={70}
          height={70}
          className="size-[70px] shrink-0 rounded-[6px] object-cover"
        />
        <span className="min-w-0">
          <span className="block truncate text-base font-bold text-fg">{item.name}</span>
          <span className="block text-sm text-secondary">
            Edição {item.editionLabel} · ID {item.tokenId}
          </span>
        </span>
      </Link>

      <p className="text-base font-bold text-text-secondary sm:col-start-2">
        {formatEth(item.unitPriceEth)}
      </p>

      <div className="flex items-center gap-3 sm:col-start-3">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={update.isPending}
          onClick={() => setQty(item.quantity - 1)}
          className="flex size-[30px] items-center justify-center rounded-full border border-ink bg-primary text-ink disabled:opacity-50"
        >
          <Minus className="size-3.5" />
        </button>
        <span aria-live="polite" className="w-5 text-center text-[17px] text-fg">
          {item.quantity}
        </span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={update.isPending || item.quantity >= cap}
          onClick={() => setQty(item.quantity + 1)}
          className="flex size-[30px] items-center justify-center rounded-full border border-ink bg-primary text-ink disabled:opacity-50"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <p className="text-base font-bold text-text-accent sm:col-start-4">{formatEth(lineTotal)}</p>

      <button
        type="button"
        aria-label={`Remover ${item.name} do carrinho`}
        disabled={remove.isPending}
        onClick={() => remove.mutate(item.editionId)}
        className="justify-self-end text-text-secondary transition-colors hover:text-destructive disabled:opacity-50 sm:col-start-5"
      >
        <Trash2 className="size-5" />
      </button>
    </div>
  )
}
