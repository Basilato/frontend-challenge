import { createFileRoute } from '@tanstack/react-router'

import { CatalogToolbar } from '@/features/catalog/CatalogToolbar'
import { FeaturedNftBanner } from '@/features/catalog/FeaturedNftBanner'
import { FilterSidebar } from '@/features/catalog/FilterSidebar'
import { MobileFilters } from '@/features/catalog/MobileFilters'
import { NftGrid, Pagination } from '@/features/catalog/NftGrid'
import { facetsQuery, nftListQuery } from '@/features/catalog/api'
import { catalogSearchSchema, searchToParams } from '@/features/catalog/search'

/**
 * Same catalog browsing UI as Início's "#catalogo" section (identical search
 * schema, same filter/toolbar/grid components — see features/catalog/route.ts
 * for why those are route-agnostic) minus the hero/promo/blog marketing
 * sections, which belong to the home page, not the marketplace listing.
 */
export const Route = createFileRoute('/mercado')({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const params = searchToParams(deps)
    context.queryClient.ensureQueryData(nftListQuery(params)).catch(() => {})
    context.queryClient.ensureQueryData(facetsQuery(params)).catch(() => {})
  },
  component: MercadoPage,
})

function MercadoPage() {
  return (
    <div className="grid items-stretch gap-8 md:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
      <aside className="hidden md:block">
        <FilterSidebar />
        <FeaturedNftBanner className="mt-6" />
      </aside>

      <div className="min-w-0 min-h-0 space-y-5 md:space-y-0 md:flex md:flex-col md:gap-8 md:h-full">
        <MobileFilters />
        <CatalogToolbar />
        <div className="md:flex-1">
          <NftGrid />
        </div>
        <div className="hidden md:mt-14 md:block">
          <Pagination />
        </div>
      </div>
    </div>
  )
}
