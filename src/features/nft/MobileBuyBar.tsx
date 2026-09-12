import { Minus, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { ShopIcon } from '@/components/icons'
import { formatEth } from '@/lib/money'

/**
 * Mobile-only sticky footer for the NFT detail screen. The Figma "Mobile /
 * Detalhes do NFT" frame (node 70396:245, "Buy Bar") replaces the standard
 * bottom tab bar entirely on this screen with a quantity/price/buy control —
 * it isn't the same component wearing different content, it's a different
 * bar. Rendered in place of <MobileTabBar> (RootLayout hides that bar on
 * `/nft/*` routes) so there's only ever one fixed bottom bar on screen.
 */
export function MobileBuyBar({
  priceEth,
  qty,
  minQty,
  maxQty,
  onDecrease,
  onIncrease,
  onBuy,
  buyDisabled,
}: {
  priceEth: string
  qty: number
  minQty: number
  maxQty: number
  onDecrease: () => void
  onIncrease: () => void
  onBuy: () => void
  buyDisabled: boolean
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="mx-auto w-full max-w-[520px] rounded-t-[40px] bg-surface-card px-6 pb-[calc(env(safe-area-inset-bottom)+36px)] pt-5 shadow-[0_0_10px_rgba(10,6,4,0.45)]">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-text-secondary">Qtd.</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  disabled={qty <= minQty}
                  onClick={onDecrease}
                  className="flex h-[30px] w-5 items-center justify-center rounded-[20px] border border-ink bg-primary text-ink shadow-[0_4px_6px_rgba(20,13,10,0.15)] disabled:opacity-40"
                >
                  <Minus className="size-3.5" />
                </button>
                <span aria-live="polite" className="w-4 text-center text-lg font-medium text-fg">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  disabled={qty >= maxQty}
                  onClick={onIncrease}
                  className="flex h-[30px] w-5 items-center justify-center rounded-[20px] border border-ink bg-primary text-ink shadow-[0_4px_6px_rgba(20,13,10,0.15)] disabled:opacity-40"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[20px] font-bold text-text-accent">{formatEth(priceEth)}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={buyDisabled}
              onClick={onBuy}
              className="flex h-[60px] w-[196px] shrink-0 items-center justify-center rounded-[40px] text-md font-bold text-ink disabled:opacity-50 [background:linear-gradient(100deg,#D28A4C_4%,rgba(210,138,76,0.8)_122%)]"
            >
              Comprar NFT
            </button>
            <Link
              to="/carrinho"
              aria-label="Ver carrinho"
              className="flex size-[60px] shrink-0 items-center justify-center rounded-[40px] border border-border bg-surface-raised text-fg"
            >
              <ShopIcon className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
