import { useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

/**
 * Mobile-only header for the payment screen (Figma "Mobile / Pagamento",
 * node 16:748) — same back-button-plus-centered-title chrome as the cart
 * and NFT detail screens, replacing the search-pill top bar there.
 */
export function MobileCheckoutHeader() {
  const router = useRouter()

  return (
    <div className="relative flex items-center py-2">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: '/carrinho' }))}
        className="z-10 flex size-[35px] items-center justify-center rounded-full border border-border bg-surface-raised text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-5" />
      </button>
      <h1 className="absolute inset-x-0 text-center text-[20px] font-bold text-fg">
        Pagamento com carteira
      </h1>
    </div>
  )
}
