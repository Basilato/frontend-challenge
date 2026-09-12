import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { Breadcrumb } from '@/components/Breadcrumb'
import { cartItemCount, cartQuery } from '@/features/cart/api'
import { CartTable } from '@/features/cart/CartTable'
import { MobileCartHeader } from '@/features/cart/MobileCartHeader'
import { MobileCartList } from '@/features/cart/MobileCartList'
import { MobileCartSummary } from '@/features/cart/MobileCartSummary'
import { RecommendedProducts } from '@/features/cart/RecommendedProducts'
import { WalletSummary } from '@/features/cart/WalletSummary'
import { useAuth } from '@/features/auth/useAuth'
import { useIsDesktopViewport } from '@/lib/viewport'

export const Route = createFileRoute('/carrinho')({
  component: CartPage,
})

function CartPage() {
  const { user } = useAuth()
  const ownerKey = user?.id ?? 'guest'
  const { data: cart, isLoading, isError, refetch } = useQuery(cartQuery(ownerKey))
  // The desktop and mobile Figma layouts share almost no markup (a table vs.
  // cards, a sidebar vs. a bottom sheet) and reuse the same labels ("Total",
  // "Aplicar", "Código promocional"...) — hiding one with CSS still leaves
  // both in the DOM/accessibility tree, so anything querying by label or
  // role finds two matches. Mount only one, like AuthScreen does.
  const isDesktop = useIsDesktopViewport()

  return (
    <div className="space-y-10">
      {isDesktop ? (
        <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/mercado' }, { label: 'Carrinho' }]} />
      ) : (
        <MobileCartHeader />
      )}
      <h1 className="sr-only">
        Carrinho de NFTs
        {cart && cart.items.length > 0 && (
          <span> ({cartItemCount(cart)} {cartItemCount(cart) === 1 ? 'item' : 'itens'})</span>
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
      ) : isDesktop ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_332px]">
          <CartTable cart={cart} />
          <WalletSummary cart={cart} />
        </div>
      ) : (
        <div>
          {/* A real wrapper, not a Fragment: MobileCartSummary is `fixed`,
              but as a direct child of this page's `space-y-10` container it
              would still pick up that utility's `margin-top` as a "later
              sibling" of MobileCartList — and margin still shifts a fixed
              box's solved position even though the element is out of flow,
              nudging it 40px above the viewport's bottom edge. Nesting it
              one level deeper keeps it out of that sibling selector. */}
          <MobileCartList cart={cart} />
          <MobileCartSummary cart={cart} />
        </div>
      )}

      {cart && <RecommendedProducts cart={cart} />}
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
