import { useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

/**
 * Mobile-only header for the cart screen (Figma "Mobile / Carrinho de
 * NFTs", node 16:360): a back button and a centered title replace the
 * standard search-pill top bar there — same "this screen owns its own
 * chrome" pattern as the NFT detail screen's hero.
 */
export function MobileCartHeader() {
  const router = useRouter()

  return (
    <div className="relative flex items-center py-2">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: '/' }))}
        className="z-10 flex size-[35px] items-center justify-center rounded-full border border-border bg-surface-raised text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-5" />
      </button>
      <h1 className="absolute inset-x-0 text-center text-[20px] font-bold text-fg">Carrinho de NFTs</h1>
    </div>
  )
}
