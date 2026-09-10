import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { CartIcon, LogoutIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cartItemCount, cartQuery } from '@/features/cart/api'
import { useLogout } from '@/features/auth/api'
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
  const navigate = useNavigate()
  const logout = useLogout()

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
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded bg-secondary px-3 py-1.5 text-sm text-fg"
                  >
                    {user?.name.split(' ')[0]}
                    <ChevronDown className="size-3.5" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 min-w-[160px] rounded-[8px] border border-border bg-surface-card p-1 text-sm shadow-lg"
                  >
                    {[
                      { label: 'Meu perfil', to: '/perfil' as const },
                      { label: 'Carteiras', to: '/carteiras' as const },
                      { label: 'Favoritos', to: '/favoritos' as const },
                    ].map((item) => (
                      <DropdownMenu.Item
                        key={item.to}
                        onSelect={() => navigate({ to: item.to })}
                        className="cursor-pointer rounded px-3 py-2 text-fg outline-none data-[highlighted]:bg-surface-dark"
                      >
                        {item.label}
                      </DropdownMenu.Item>
                    ))}
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                      onSelect={() =>
                        logout.mutate(undefined, {
                          onSuccess: () => {
                            toast.success('Você saiu da conta.')
                            navigate({ to: '/' })
                          },
                        })
                      }
                      className="cursor-pointer rounded px-3 py-2 text-text-accent outline-none data-[highlighted]:bg-surface-dark"
                    >
                      Sair
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
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
