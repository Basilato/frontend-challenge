import { Link, useNavigate } from '@tanstack/react-router'
import { Heart, LogOut, MapPin, User as UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'

import { useLogout } from '@/features/auth/api'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/perfil', label: 'Dados do perfil', Icon: UserIcon },
  { to: '/carteiras', label: 'Carteiras', Icon: MapPin },
  { to: '/favoritos', label: 'Lista de interesse', Icon: Heart },
] as const

export function AccountLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const logout = useLogout()

  return (
    <div className="grid gap-7 md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="h-max rounded-[6px] bg-surface-card py-2">
        <p className="p-3 text-lg font-bold text-fg">Meu perfil</p>
        <nav aria-label="Conta">
          {NAV.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ includeSearch: false }}
              className="flex items-center gap-3 border-l-[6px] border-transparent px-3 py-3 text-[15px] text-text-accent transition-colors hover:bg-surface-dark [&.active]:border-primary"
            >
              <Icon className="size-[18px]" />
              {label}
            </Link>
          ))}
        </nav>
        <hr className="my-1 border-border" />
        <button
          type="button"
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => {
                toast.success('Você saiu da conta.')
                navigate({ to: '/' })
              },
            })
          }
          className="flex w-full items-center gap-2 px-3 py-3 text-[15px] font-bold text-text-accent hover:bg-surface-dark"
        >
          <LogOut className="size-5" />
          Sair
        </button>
      </aside>

      <section className={cn('min-w-0 space-y-8')}>
        <h1 className="text-base font-bold text-fg">{title}</h1>
        {children}
      </section>
    </div>
  )
}

export const REQUIRED = <span className="text-[#f0805f]"> *</span>

export const fieldInputCls =
  'h-10 w-full max-w-[417px] rounded-[3px] border border-border bg-transparent px-3 text-sm text-fg focus:border-primary focus:outline-none aria-[invalid=true]:border-destructive'
