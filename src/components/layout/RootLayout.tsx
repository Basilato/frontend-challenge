import type { ReactNode } from 'react'

import { Footer } from './Footer'
import { Header } from './Header'
import { MobileTabBar } from './MobileTabBar'
import { MobileTopBar } from './MobileTopBar'

export function RootLayout({ children }: { children: ReactNode }) {
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
      <MobileTopBar />

      <main
        id="main"
        className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-28 pt-4 md:px-0 md:pb-0 md:pt-10"
      >
        {children}
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileTabBar />
    </div>
  )
}
