import { useNavigate, useSearch } from '@tanstack/react-router'

import type { CatalogSearch } from './search'

/**
 * Catalog filter/sort/pagination state lives in the URL (CLAUDE.md rule 3),
 * and both "/" (Início) and "/mercado" validate search with the identical
 * `catalogSearchSchema` so they can share one browsing experience. These
 * hooks are route-agnostic (`strict: false`, no `from`) on purpose — the
 * filter sidebar, toolbar, grid and mobile filters are mounted under either
 * route and must read/write whichever one is actually active, not a single
 * route pinned in advance the way `getRouteApi('/')` would.
 *
 * Because there's no single `from` route, TanStack Router can't statically
 * infer the search shape for an in-place `search` update — the cast below is
 * the one place that's contained, so every call site still gets a properly
 * typed `CatalogSearch` in and out.
 */
export function useCatalogSearch(): CatalogSearch {
  return useSearch({ strict: false }) as CatalogSearch
}

export function useCatalogNavigate() {
  const navigate = useNavigate()
  return (opts: { search: (prev: CatalogSearch) => Partial<CatalogSearch>; replace?: boolean }) =>
    navigate(opts as Parameters<typeof navigate>[0])
}
