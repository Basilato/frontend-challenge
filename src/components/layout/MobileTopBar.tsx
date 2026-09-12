import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'

import { FilterIcon, SearchIcon } from '@/components/icons'

/**
 * Mobile top bar — the Figma "Mobile / Início" opens with a search pill plus a
 * gradient filter button (no logo/nav row on mobile). Submitting navigates to
 * the catalog with the query in the URL.
 */
export function MobileTopBar() {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  // Both "/" and "/mercado" are real catalog listings with the same search
  // schema (see features/catalog/route.ts) — search/filter from here should
  // stay on whichever one is already open instead of always bouncing to
  // home, which used to be the only catalog page.
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const catalogTarget = pathname === '/mercado' ? '/mercado' : '/'

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        navigate({ to: catalogTarget, search: (prev) => ({ ...prev, q: term, page: 1 }) })
      }}
      className="flex items-center gap-3 px-4 pb-2 pt-4 md:hidden"
    >
      <label className="flex h-[45px] flex-1 items-center gap-2 rounded-[10px] bg-surface-card px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
        <SearchIcon className="size-[22px] shrink-0 text-secondary" />
        <span className="sr-only">Buscar coleções</span>
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Explorar coleções"
          className="w-full bg-transparent text-sm font-bold text-fg placeholder:font-bold placeholder:text-secondary focus:outline-none"
        />
      </label>
      <button
        type="button"
        aria-label="Filtros"
        onClick={() => navigate({ to: catalogTarget, search: (prev) => ({ ...prev, filtersOpen: true }) })}
        className="flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(137deg,rgba(210,138,76,0.45)_25%,var(--color-primary)_100%)] text-ink"
      >
        <FilterIcon className="size-[22px]" />
      </button>
    </form>
  )
}
