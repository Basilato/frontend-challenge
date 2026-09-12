import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Image viewer opened by tapping the hero photo (mobile) or the zoom button
 * (desktop NftGallery). Full-screen on mobile — there's no room for a
 * centered card there — but on desktop it follows AuthModal's actual
 * pattern instead: a centered, size-capped card over a blurred overlay,
 * not an edge-to-edge sheet (which would cover nearly the whole screen at
 * desktop widths). Dark blurred overlay, surface-card panel, top-right
 * close X either way. The thumbnail strip reuses the exact button styling
 * from the desktop NftGallery rail for visual consistency.
 */
export function NftGalleryModal({
  images,
  name,
  active,
  onActiveChange,
  open,
  onOpenChange,
}: {
  images: string[]
  name: string
  active: number
  onActiveChange: (index: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const goTo = (index: number) => onActiveChange((index + images.length) % images.length)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/85 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-[24px] bg-surface-card outline-none md:inset-auto md:left-1/2 md:top-1/2 md:h-[min(720px,85vh)] md:w-[min(920px,90vw)] md:-translate-x-1/2 md:-translate-y-1/2"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="text-lg font-bold text-fg">Galeria</Dialog.Title>
            <Dialog.Close
              aria-label="Fechar galeria"
              className="rounded-sm text-text-secondary outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
            <img
              src={images[active]}
              alt={`${name} — imagem ${active + 1} de ${images.length}`}
              className="max-h-full max-w-full rounded-[16px] object-contain"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Imagem anterior"
                  onClick={() => goTo(active - 1)}
                  className="absolute left-6 flex size-10 items-center justify-center rounded-full bg-ink/70 text-fg outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Próxima imagem"
                  onClick={() => goTo(active + 1)}
                  className="absolute right-6 flex size-10 items-center justify-center rounded-full bg-ink/70 text-fg outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <ul
              className="flex shrink-0 items-center gap-3 overflow-x-auto border-t border-border px-5 py-4"
              aria-label="Miniaturas"
            >
              {images.map((src, i) => (
                <li key={src + i}>
                  <button
                    type="button"
                    aria-label={`Ver imagem ${i + 1}`}
                    aria-current={i === active}
                    onClick={() => onActiveChange(i)}
                    className={cn(
                      'block size-[56px] shrink-0 overflow-hidden rounded-[8px] border bg-surface-dark transition-colors',
                      i === active ? 'border-primary' : 'border-transparent hover:border-border-soft',
                    )}
                  >
                    <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
