import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { FilterSidebar } from './FilterSidebar'
import { useCatalogNavigate, useCatalogSearch } from './route'

/**
 * Mobile filter panel. Has no trigger of its own — it is opened by the filter
 * button in the mobile top bar, which sets `filtersOpen` in the URL.
 */
export function MobileFilters() {
  const open = useCatalogSearch().filtersOpen
  const navigate = useCatalogNavigate()

  const setOpen = (next: boolean) =>
    navigate({ search: (p) => ({ ...p, filtersOpen: next || undefined }), replace: true })

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70 md:hidden" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[20px] border-t border-border bg-surface-card md:hidden"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <Dialog.Title className="text-lg font-bold text-fg">Filtros</Dialog.Title>
            <Dialog.Close aria-label="Fechar filtros" className="text-text-secondary hover:text-fg">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto pb-4">
            <FilterSidebar className="bg-transparent p-5 pt-0" />
          </div>
          <div className="border-t border-border p-4">
            <Dialog.Close asChild>
              <Button className="w-full">Ver resultados</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
