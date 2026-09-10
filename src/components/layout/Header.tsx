import { Link } from '@tanstack/react-router'

import { useAuth } from '@/features/auth/useAuth'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/mercado', label: 'Mercado' },
  { to: '/criadores', label: 'Criadores' },
  { to: '/aprenda', label: 'Aprenda' },
] as const

export function Header() {
  const { isAuthenticated, user } = useAuth()

  return (
    <header className="border-b border-border bg-surface-card/60 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center gap-6 px-4 md:px-6">
        <Link to="/" className="font-bold tracking-widest text-text-accent">
          KURIO
        </Link>
        <nav aria-label="Principal" className="hidden gap-5 text-xs md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-text-secondary hover:text-foreground [&.active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <Link to="/carrinho" className="text-text-secondary hover:text-foreground">
            Carrinho
          </Link>
          {isAuthenticated ? (
            <Link to="/perfil" className="rounded bg-secondary px-3 py-1.5 text-foreground">
              {user?.name.split(' ')[0]}
            </Link>
          ) : (
            <Link to="/login" className="rounded bg-primary px-3 py-1.5 text-primary-foreground">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
