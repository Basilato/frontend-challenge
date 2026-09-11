import { useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { Toaster } from '@/components/ui/toaster'
import { useSessionExpiryRedirect } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'

import { Footer } from './Footer'
import { Header } from './Header'
import { MobileTabBar } from './MobileTabBar'
import { MobileTopBar } from './MobileTopBar'

// The Figma account-sidebar screens (Perfil, Carteiras) end right after their
// content — no Footer instance on those two frames, unlike every other route.
const ROUTES_WITHOUT_FOOTER = new Set(['/perfil', '/carteiras'])

// The Figma mobile Login/Cadastro frames are dedicated full-screen pages (logo,
// form, CTA) with no search pill or bottom tab bar — unlike every other mobile
// screen, which opens with both. Desktop keeps the normal Header/Footer chrome
// there (the modal overlays the dimmed Home page), only mobile drops it.
const MOBILE_ROUTES_WITHOUT_TABS = new Set(['/login', '/cadastro'])

export function RootLayout({ children }: { children: ReactNode }) {
  useSessionExpiryRedirect()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showFooter = !ROUTES_WITHOUT_FOOTER.has(pathname)
  const showMobileTabs = !MOBILE_ROUTES_WITHOUT_TABS.has(pathname)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <div className="hidden md:block">
        <Header />
      </div>
      {showMobileTabs && <MobileTopBar />}

      <main
        id="main"
        className={cn(
          'mx-auto w-full max-w-[1200px] flex-1 px-4 pt-4 md:px-0 md:pb-0 md:pt-10',
          showMobileTabs ? 'pb-28' : 'pb-10',
        )}
      >
        {children}
      </main>

      {showFooter && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}
      {showMobileTabs && <MobileTabBar />}
      <Toaster />
    </div>
  )
}
