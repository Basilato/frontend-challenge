import type { Cart, Quote } from '@/contracts'
import { formatEth, mulEth } from '@/lib/money'

/** Right-column order review: receipt rows (from the cart) + quote breakdown. */
export function CheckoutReview({ cart, quote }: { cart: Cart; quote: Quote | undefined }) {
  return (
    <div className="space-y-4">
      <h2 className="text-[17px] font-bold text-fg">Seus NFTs</h2>
      <div className="flex items-center justify-between border-b border-border pb-2 text-base text-fg">
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Subtotal</span>
      </div>

      <ul className="space-y-3">
        {cart.items.map((item) => (
          <li
            key={item.editionId}
            className="flex items-center justify-between gap-3 rounded-[6px] bg-surface-card p-2 pr-4"
          >
            <span className="flex min-w-0 items-center gap-3">
              <img
                src={item.image}
                alt=""
                width={56}
                height={56}
                className="size-14 shrink-0 rounded-[8px] object-cover"
              />
              <span className="min-w-0">
                <span className="block truncate text-base font-bold text-fg">{item.name}</span>
                <span className="block text-sm text-secondary">ID do token: {item.tokenId}</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-4 text-right">
              <span className="text-sm text-text-secondary">(x {item.quantity})</span>
              <span className="text-lg font-bold text-text-accent">
                {formatEth(mulEth(item.unitPriceEth, item.quantity))}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <dl className="space-y-3 border-t border-border pt-4 text-[15px] text-fg">
        <Row label="Subtotal" value={quote?.subtotalEth} big />
        <Row
          label="Desconto do lançamento"
          value={
            quote
              ? Number(quote.discountEth) > 0
                ? `(-) ${formatEth(quote.discountEth).replace(' ETH', '')}`
                : '—'
              : undefined
          }
          raw
        />
        <div className="space-y-1">
          <Row label="Taxa de rede" value={quote?.networkFeeEth} big />
          <p className="text-right text-xs text-text-accent">Taxa estimada</p>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-border pt-3 font-bold">
        <span className="text-base text-fg">Total</span>
        <span className="text-lg text-text-accent">{quote ? formatEth(quote.totalEth) : '—'}</span>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  big,
  raw,
}: {
  label: string
  value: string | undefined
  big?: boolean
  raw?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-[15px]">{label}</dt>
      <dd className={big ? 'text-lg' : 'text-[15px]'}>
        {value === undefined ? (
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
