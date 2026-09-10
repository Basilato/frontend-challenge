import { useNavigate } from '@tanstack/react-router'
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

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        navigate({ to: '/', search: (prev) => ({ ...prev, q: term, page: 1 }) })
      }}
      className="flex items-center gap-3 px-4 pb-2 pt-4 md:hidden"
    >
      <label className="flex h-[45px] flex-1 items-center gap-2 rounded-[10px] bg-surface-card px-3">
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
        onClick={() => navigate({ to: '/', search: (prev) => ({ ...prev, filtersOpen: true }) })}
        className="flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(137deg,rgba(210,138,76,0.45)_25%,var(--color-primary)_100%)] text-ink"
      >
        <FilterIcon className="size-[22px]" />
      </button>
    </form>
  )
}
