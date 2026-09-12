import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Cart } from '@/contracts'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { formatEth } from '@/lib/money'
import { useAuth } from '@/features/auth/useAuth'

import { quoteQuery, useApplyCoupon, useRemoveCoupon } from './api'

export function WalletSummary({ cart }: { cart: Cart }) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const ownerKey = user?.id ?? 'guest'
  const { data: quote, isLoading } = useQuery(quoteQuery(ownerKey, cart.items.length > 0))

  const applyCoupon = useApplyCoupon()
  const removeCoupon = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-fg">Resumo da carteira</h2>
        <hr className="border-border" />
      </div>

      {cart.couponCode ? (
        <div className="flex items-center justify-between rounded-[6px] border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
          <span className="text-fg">
            Cupom <strong className="text-text-accent">{cart.couponCode}</strong> aplicado
          </span>
          <button
            type="button"
            aria-label="Remover cupom"
            onClick={() => removeCoupon.mutate()}
            className="text-text-secondary hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <form
          className="space-y-1.5"
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
          <label htmlFor="coupon" className="text-sm font-bold text-fg">
            Código promocional
          </label>
          <div className="flex overflow-hidden rounded-[3px] border border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            <input
              id="coupon"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Digite o código promocional..."
              aria-invalid={Boolean(couponError)}
              aria-describedby={couponError ? 'coupon-error' : undefined}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs text-fg placeholder:text-secondary focus:outline-none"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!code.trim() || applyCoupon.isPending}
              className="rounded-none"
            >
              Aplicar
            </Button>
          </div>
          {couponError && (
            <p id="coupon-error" role="alert" className="text-xs text-destructive">
              {couponError}
            </p>
          )}
        </form>
      )}

      <dl className="space-y-3 text-[15px] text-fg">
        <Row label="Subtotal" value={quote?.subtotalEth} loading={isLoading} big />
        <Row
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
        />
        <div className="space-y-1">
          <Row label="Taxa de rede" value={quote?.networkFeeEth} loading={isLoading} big />
          <p className="text-right text-xs text-text-accent">Taxa estimada</p>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-border pt-3 font-bold">
        <span className="text-base text-fg">Total</span>
        <span className="text-lg text-text-accent">
          {isLoading || !quote ? '—' : formatEth(quote.totalEth)}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          className="w-full rounded-[3px]"
          disabled={cart.items.length === 0}
          onClick={() =>
            isAuthenticated
              ? navigate({ to: '/pagamento' })
              : navigate({ to: '/login', search: { redirect: '/pagamento' } })
          }
        >
          {isAuthenticated ? 'Revisar e finalizar' : 'Conectar e finalizar'}
        </Button>
        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          className="text-[15px] text-text-accent hover:underline"
        >
          Continuar explorando
        </button>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  loading,
  big,
  raw,
}: {
  label: string
  value: string | undefined
  loading?: boolean
  big?: boolean
  raw?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-[15px]">{label}</dt>
      <dd className={big ? 'text-lg' : 'text-[15px]'}>
        {loading || value === undefined ? (
          <span className="shimmer inline-block h-4 w-16 rounded bg-surface-card" />
        ) : raw ? (
          value
        ) : (
          formatEth(value)
        )}
      </dd>
    </div>
  )
}
