import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ComponentType, SVGProps } from 'react'

import { HeartIcon, HomeIcon, MarketMarkIcon, ShopIcon, UserIcon } from '@/components/icons'
import { cartItemCount, cartQuery } from '@/features/cart/api'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'

type Tab = {
  to: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  iconClassName: string
  left: string
  exact?: boolean
  badge?: number
}

/**
 * Mobile navigation — the Figma "Mobile / Início" leads with a bottom Tab Bar
 * (no top nav/hamburger, no text labels). The bar itself isn't a plain
 * rectangle: it's a single silhouette with a scalloped notch cut into its top
 * edge so the elevated center button can sit recessed into it (node
 * 70395:245, "Tab Bar", path traced from the exported background vector).
 * Icon positions below are the exact x/y from that same frame (414×126),
 * expressed as percentages so the bar stays faithful at any mobile width.
 */
export function MobileTabBar() {
  const { isAuthenticated, user } = useAuth()
  const { data: cart } = useQuery(cartQuery(user?.id ?? 'guest'))
  const count = cartItemCount(cart)

  const left: Tab[] = [
    { to: '/', label: 'Início', Icon: HomeIcon, iconClassName: 'h-[16.7px] w-[15.8px]', left: '11.11%', exact: true },
    { to: '/favoritos', label: 'Favoritos', Icon: HeartIcon, iconClassName: 'h-[17.8px] w-5', left: '28.5%' },
  ]
  const right: Tab[] = [
    { to: '/carrinho', label: 'Carrinho', Icon: ShopIcon, iconClassName: 'size-5', left: '72.95%', badge: count },
    {
      to: isAuthenticated ? '/perfil' : '/login',
      label: 'Conta',
      Icon: UserIcon,
      iconClassName: 'size-5',
      left: '87.92%',
    },
  ]

  return (
    <nav aria-label="Navegação" className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="relative mx-auto w-full max-w-[520px]">
        <div className="relative h-[126px] w-full">
          <svg
            aria-hidden="true"
            viewBox="0 0 414 126"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full [filter:drop-shadow(0_-10px_15px_rgba(10,6,4,0.45))]"
          >
            <path
              fill="var(--color-surface-card)"
              d="M282.85 31C269.09 31 256.87 39.2 251.02 51.65C243.26 68.17 226.46 79.62 207 79.62C187.54 79.62 170.74 68.18 162.98 51.65C157.13 39.2 144.9 31 131.15 31H28.93C12.95 31 0 43.95 0 59.93V125.95H414V59.93C414 43.95 401.05 31 385.07 31H282.85Z"
            />
          </svg>

          <ul className="contents">
            {[...left, ...right].map((tab) => (
              <TabLink key={tab.to} tab={tab} />
            ))}

            <li className="absolute left-1/2 top-0 flex size-[65px] -translate-x-1/2 list-none items-center justify-center">
              <Link
                to="/mercado"
                aria-label="Explorar o mercado"
                className="flex size-full items-center justify-center rounded-full text-foreground shadow-lg shadow-black/40 outline-none ring-4 ring-background [background:linear-gradient(180deg,rgba(210,138,76,0.4)_0%,#D28A4C_100%)] focus-visible:ring-ring"
              >
                <MarketMarkIcon className="h-6 w-[26.8px]" />
              </Link>
            </li>
          </ul>
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-surface-card" />
      </div>
    </nav>
  )
}

function TabLink({ tab }: { tab: Tab }) {
  const { Icon, badge } = tab
  return (
    <li
      className="absolute top-[64.3%] -translate-x-1/2 -translate-y-1/2 list-none"
      style={{ left: tab.left }}
    >
      <Link
        to={tab.to}
        activeOptions={{ exact: Boolean(tab.exact), includeSearch: false }}
        aria-label={tab.label}
        className={cn(
          'flex size-11 items-center justify-center rounded-full text-text-secondary outline-none transition-colors',
          'focus-visible:ring-2 focus-visible:ring-ring',
          'data-[status=active]:text-text-accent',
        )}
      >
        <span className="relative flex items-center justify-center">
          <Icon className={tab.iconClassName} />
          {badge != null && badge > 0 && (
            <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full border-2 border-surface-card bg-primary text-[9px] font-medium leading-none text-ink">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}
