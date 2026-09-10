import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { cartItemCount, cartQuery } from '@/features/cart/api'
import { CartTable } from '@/features/cart/CartTable'
import { WalletSummary } from '@/features/cart/WalletSummary'
import { useAuth } from '@/features/auth/useAuth'

export const Route = createFileRoute('/carrinho')({
  component: CartPage,
})

function CartPage() {
  const { user } = useAuth()
  const ownerKey = user?.id ?? 'guest'
  const { data: cart, isLoading, isError, refetch } = useQuery(cartQuery(ownerKey))

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-fg">
        Carrinho de NFTs
        {cart && cart.items.length > 0 && (
          <span className="ml-2 text-base font-normal text-text-secondary">
            ({cartItemCount(cart)} {cartItemCount(cart) === 1 ? 'item' : 'itens'})
          </span>
        )}
      </h1>

      {isLoading ? (
        <CartSkeleton />
      ) : isError || !cart ? (
        <div className="rounded-[8px] bg-surface-card p-10 text-center">
          <p className="text-fg">Não foi possível carregar o carrinho.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-sm font-bold text-text-accent underline underline-offset-4"
          >
            Tentar novamente
          </button>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="rounded-[8px] bg-surface-card p-12 text-center">
          <p className="text-lg text-fg">Seu carrinho está vazio.</p>
          <p className="mt-2 text-sm text-text-secondary">
            Explore o catálogo e adicione NFTs para colecionar.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-[6px] bg-primary px-5 py-2.5 text-sm font-bold text-ink"
          >
            Explorar NFTs
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_332px]">
          <CartTable cart={cart} />
          <WalletSummary cart={cart} />
        </div>
      )}
    </div>
  )
}

function CartSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_332px]">
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="shimmer h-[86px] rounded-[8px] bg-surface-card" />
        ))}
      </div>
      <div className="shimmer h-[360px] rounded-[8px] bg-surface-card" />
    </div>
  )
}
