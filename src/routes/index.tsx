import { createFileRoute } from '@tanstack/react-router'

import { Hero } from '@/components/Hero'
import { CatalogToolbar } from '@/features/catalog/CatalogToolbar'
import { FeaturedNftBanner } from '@/features/catalog/FeaturedNftBanner'
import { FilterSidebar } from '@/features/catalog/FilterSidebar'
import { MobileFilters } from '@/features/catalog/MobileFilters'
import { NftGrid } from '@/features/catalog/NftGrid'
import { facetsQuery, nftListQuery } from '@/features/catalog/api'
import { catalogSearchSchema, searchToParams } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    const params = searchToParams(deps)
    void context.queryClient.ensureQueryData(nftListQuery(params))
    void context.queryClient.ensureQueryData(facetsQuery(params))
  },
  component: CatalogPage,
})

function CatalogPage() {
  return (
    <div className="space-y-10">
      <Hero />

      <section id="catalogo" className="scroll-mt-6">
        <div className="grid gap-8 md:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
          <aside className="hidden md:block">
            <FilterSidebar />
            <FeaturedNftBanner className="mt-6" />
          </aside>

          <div className="min-w-0 space-y-6">
            <MobileFilters />
            <CatalogToolbar />
            <NftGrid />
          </div>
        </div>
      </section>
    </div>
  )
}
