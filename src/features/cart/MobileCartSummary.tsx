import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Cart } from '@/contracts'
import { ApiError } from '@/lib/http'
import { formatEth } from '@/lib/money'
import { useAuth } from '@/features/auth/useAuth'

import { quoteQuery, useApplyCoupon, useRemoveCoupon } from './api'

/**
 * Mobile-only "Payment Summary" bottom panel (Figma "Mobile / Carrinho de
 * NFTs", node 70397:245): fixed to the bottom of the viewport, same as the
 * NFT detail screen's Buy Bar — it's docked chrome the item list scrolls
 * under, not part of the normal document flow. A bottom-sheet-style card
 * with the promo input, price breakdown, and checkout CTA. Same
 * quote/coupon logic as the desktop WalletSummary, laid out to match the
 * mobile frame instead.
 */
export function MobileCartSummary({ cart }: { cart: Cart }) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const ownerKey = user?.id ?? 'guest'
  const { data: quote, isLoading } = useQuery(quoteQuery(ownerKey, cart.items.length > 0))

  const applyCoupon = useApplyCoupon()
  const removeCoupon = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto w-full max-w-[520px] rounded-t-[40px] bg-surface-card px-6 pb-[calc(env(safe-area-inset-bottom)+36px)] pt-6 shadow-[0_-6px_20px_rgba(10,6,4,0.45)]">
        <div className="flex flex-col gap-3">
          {cart.couponCode ? (
            <div className="flex h-[50px] items-center justify-between rounded-[40px] border border-border bg-surface-card px-4 shadow-[0_6px_10px_rgba(10,6,4,0.45)]">
              <span className="truncate text-[12px] text-fg">
                Cupom <strong className="text-text-accent">{cart.couponCode}</strong> aplicado
              </span>
              <button
                type="button"
                aria-label="Remover cupom"
                onClick={() => removeCoupon.mutate()}
                className="text-text-secondary outline-none hover:text-fg"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setCouponError(null)
                applyCoupon.mutate(code, {
                  onSuccess: () => {
                    setCode('')
                    toast.success('Cupom aplicado')
                  },
                  onError: (error) =>
                    setCouponError(
                      error instanceof ApiError ? error.message : 'Não foi possível aplicar o cupom.',
                    ),
                })
              }}
            >
              <div className="flex h-[50px] items-center overflow-hidden rounded-[40px] border border-border bg-surface-card pl-4 shadow-[0_6px_10px_rgba(10,6,4,0.45)] focus-within:ring-2 focus-within:ring-ring">
                <label htmlFor="mobile-coupon" className="sr-only">
                  Código promocional
                </label>
                <input
                  id="mobile-coupon"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Digite o código promocional..."
                  aria-invalid={Boolean(couponError)}
                  aria-describedby={couponError ? 'mobile-coupon-error' : undefined}
                  className="min-w-0 flex-1 truncate bg-transparent text-[12px] text-fg placeholder:text-secondary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!code.trim() || applyCoupon.isPending}
                  className="flex h-[50px] w-[97px] shrink-0 items-center justify-center rounded-[40px] text-[15px] font-bold text-fg disabled:opacity-60 [background:linear-gradient(96deg,rgba(210,138,76,0.54)_1%,#D28A4C_105%)]"
                >
                  Aplicar
                </button>
              </div>
              {couponError && (
                <p id="mobile-coupon-error" role="alert" className="mt-1.5 text-xs text-destructive">
                  {couponError}
                </p>
              )}
            </form>
          )}

          <SummaryRow label="Subtotal" value={quote?.subtotalEth} loading={isLoading} />
          <SummaryRow
            label="Desconto do lançamento"
            value={
              quote
                ? Number(quote.discountEth) > 0
                  ? `(-) ${formatEth(quote.discountEth).replace(' ETH', '')}`
                  : '—'
                : undefined
            }
            loading={isLoading}
            raw
            valueSize="text-[15px]"
          />
          <div>
            <SummaryRow label="Taxa de rede" value={quote?.networkFeeEth} loading={isLoading} />
            <p className="text-right text-xs text-text-accent">Taxa estimada</p>
          </div>
          <div className="flex items-center justify-between font-bold">
            <span className="text-md text-fg">Total</span>
            <span className="text-lg text-text-accent">
              {isLoading || !quote ? '—' : formatEth(quote.totalEth)}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={cart.items.length === 0}
          onClick={() =>
            isAuthenticated
              ? navigate({ to: '/pagamento' })
              : navigate({ to: '/login', search: { redirect: '/pagamento' } })
          }
          className="mt-6 flex h-[60px] w-full items-center justify-center rounded-[40px] text-md font-bold text-ink disabled:opacity-50 [background:linear-gradient(109deg,#D28A4C_4%,rgba(210,138,76,0.8)_122%)]"
        >
          {isAuthenticated ? 'Revisar e finalizar' : 'Conectar e finalizar'}
        </button>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  loading,
  raw,
  valueSize = 'text-md',
}: {
  label: string
  value: string | undefined
  loading?: boolean
  raw?: boolean
  /** Figma sizes "Desconto do lançamento" the same as its label (15px), unlike
   *  the 16px used for Subtotal/Taxa de rede's values. */
  valueSize?: string
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-[15px] text-fg">
      <dt>{label}</dt>
      <dd className={valueSize}>
        {loading || value === undefined ? (
          <span className="shimmer inline-block h-4 w-16 rounded bg-surface-raised" />
        ) : raw ? (
          value
        ) : (
          formatEth(value)
        )}
      </dd>
    </div>
  )
}
