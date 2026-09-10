import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { CartIcon, LogoutIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cartItemCount, cartQuery } from '@/features/cart/api'
import { useAuth } from '@/features/auth/useAuth'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/mercado', label: 'Mercado' },
  { to: '/criadores', label: 'Criadores' },
  { to: '/aprenda', label: 'Aprenda' },
] as const

export function Header() {
  const { isAuthenticated, user } = useAuth()
  const { data: cart } = useQuery(cartQuery(user?.id ?? 'guest'))
  const count = cartItemCount(cart)

  return (
    <header>
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-0">
        <div className="flex items-center justify-between py-6">
          <Link
            to="/"
            className="text-sm font-bold tracking-[1.4px] text-fg"
            aria-label="Kurio — início"
          >
            KURIO
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-start gap-10 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === '/', includeSearch: false }}
                className="border-b-[3px] border-transparent pb-1.5 text-base transition-colors hover:text-text-accent [&.active]:border-primary [&.active]:font-bold [&.active]:text-text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-7">
            <button
              type="button"
              aria-label="Buscar"
              className="text-fg transition-colors hover:text-text-accent"
            >
              <SearchIcon className="size-5" />
            </button>

            <Link
              to="/carrinho"
              aria-label={`Carrinho${count ? `, ${count} ${count === 1 ? 'item' : 'itens'}` : ' vazio'}`}
              className="relative text-fg transition-colors hover:text-text-accent"
            >
              <CartIcon className="size-6" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1 flex size-4 items-center justify-center rounded-full border-2 border-ink bg-primary text-[10px] font-medium leading-none text-ink">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <Button asChild size="sm">
                <Link to="/perfil">{user?.name.split(' ')[0]}</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/login">
                  <LogoutIcon className="size-5" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="h-px w-full bg-primary/40" />
      </div>
    </header>
  )
}
