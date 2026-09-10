import { ChevronDown } from 'lucide-react'

import type { CatalogTab, SortKey } from '@/contracts'
import { cn } from '@/lib/utils'

import { catalogRoute } from './route'

const TABS: { value: CatalogTab; label: string }[] = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lançamentos' },
  { value: 'trending', label: 'Em alta' },
]

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'name', label: 'Nome (A–Z)' },
]

export function CatalogToolbar() {
  const search = catalogRoute.useSearch()
  const navigate = catalogRoute.useNavigate()

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="tablist"
        aria-label="Filtrar catálogo"
        className="-mb-px flex gap-4 overflow-x-auto whitespace-nowrap text-sm font-medium sm:gap-5 sm:text-[15px]"
      >
        {TABS.map((t) => {
          const active = search.tab === t.value
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => navigate({ search: (p) => ({ ...p, tab: t.value, page: 1 }) })}
              className={cn(
                'shrink-0 border-b-2 border-transparent pb-2 transition-colors',
                active ? 'border-primary text-text-accent' : 'text-fg hover:text-text-accent',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <label className="flex items-center gap-2 text-[15px] text-fg">
        <span className="shrink-0">Ordenar por:</span>
        <span className="relative">
          <select
            value={search.sort}
            onChange={(e) =>
              navigate({ search: (p) => ({ ...p, sort: e.target.value as SortKey, page: 1 }) })
            }
            className="cursor-pointer appearance-none rounded bg-transparent py-1 pr-6 text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-surface-card">
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-text-accent"
            aria-hidden="true"
          />
        </span>
      </label>
    </div>
  )
}
