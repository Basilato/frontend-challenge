import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Compass } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

import { HeartIcon, HomeIcon, ShopIcon, UserIcon } from '@/components/icons'
import { cartItemCount, cartQuery } from '@/features/cart/api'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'

type Tab = {
  to: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  exact?: boolean
  badge?: number
}

/**
 * Mobile navigation — the Figma "Mobile / Início" leads with a bottom Tab Bar
 * (no top nav/hamburger). Center action is elevated; it opens the full market.
 */
export function MobileTabBar() {
  const { isAuthenticated, user } = useAuth()
  const { data: cart } = useQuery(cartQuery(user?.id ?? 'guest'))
  const count = cartItemCount(cart)

  const left: Tab[] = [
    { to: '/', label: 'Início', Icon: HomeIcon, exact: true },
    { to: '/favoritos', label: 'Favoritos', Icon: HeartIcon },
  ]
  const right: Tab[] = [
    { to: '/carrinho', label: 'Carrinho', Icon: ShopIcon, badge: count },
    { to: isAuthenticated ? '/perfil' : '/login', label: 'Conta', Icon: UserIcon },
  ]

  return (
    <nav
      aria-label="Navegação"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-[520px] items-end justify-between px-6">
        {left.map((tab) => (
          <TabLink key={tab.to} tab={tab} />
        ))}

        <li className="-mt-6">
          <Link
            to="/mercado"
            aria-label="Explorar o mercado"
            className="flex size-[56px] items-center justify-center rounded-full bg-[linear-gradient(137deg,rgba(210,138,76,0.55)_20%,var(--color-primary)_100%)] text-ink shadow-lg shadow-black/40 ring-4 ring-background"
          >
            <Compass className="size-6" strokeWidth={2.25} />
          </Link>
        </li>

        {right.map((tab) => (
          <TabLink key={tab.to} tab={tab} />
        ))}
      </ul>
    </nav>
  )
}

function TabLink({ tab }: { tab: Tab }) {
  const { Icon, badge } = tab
  return (
    <li>
      <Link
        to={tab.to}
        activeOptions={{ exact: Boolean(tab.exact), includeSearch: false }}
        aria-label={tab.label}
        className={cn(
          'flex flex-col items-center gap-1 py-2.5 text-[10px] text-text-secondary transition-colors',
          'data-[status=active]:text-text-accent',
        )}
      >
        <span className="relative">
          <Icon className="size-[22px]" />
          {badge != null && badge > 0 && (
            <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full border-2 border-surface-card bg-primary text-[9px] font-medium leading-none text-ink">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        {tab.label}
      </Link>
    </li>
  )
}
