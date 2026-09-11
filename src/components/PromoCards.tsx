import { Link } from '@tanstack/react-router'

import heroArt from '@/assets/figma/hero-art.webp'
import promoCurated from '@/assets/figma/promo-curated.webp'
import promoMask from '@/assets/figma/promo-mask.svg'
import { ArrowRightIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

const CARDS = [
  {
    image: heroArt,
    alt: 'Ilustração de um macaco com óculos escuros e jaqueta universitária verde.',
    title: (
      <>
        Lançamentos gênesis
        <br />
        de edição limitada
      </>
    ),
    body: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    search: { tab: 'new' as const, page: 1, collections: [] as string[] },
  },
  {
    image: promoCurated,
    alt: 'Ilustração de um macaco com casaco bege e gola rulê verde.',
    title: (
      <>
        Arte digital selecionada
        <br />e muito mais
      </>
    ),
    body: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    search: { tab: 'all' as const, page: 1, collections: ['Arte digital'] },
  },
]

/** Home page promo band — two CTA cards between the catalog and the blog section. Desktop-only in Figma (no mobile frame covers it). */
export function PromoCards() {
  return (
    <section
      aria-label="Destaques do mercado"
      className="hidden flex-col gap-6 md:flex lg:flex-row lg:gap-7"
    >
      {CARDS.map((card, i) => (
        <div
          key={i}
          className="relative flex min-h-[250px] w-full rounded-lg bg-surface-card lg:w-[586px]"
        >
          <img
            src={card.image}
            alt={card.alt}
            width={292}
            height={250}
            loading="lazy"
            className="w-[35%] shrink-0 self-stretch rounded-[18px] object-cover sm:w-[292px]"
          />
          <div className="flex min-w-0 flex-1 flex-col items-end justify-between gap-4 px-4 py-6 text-right sm:px-6 sm:py-9">
            <div className="flex flex-col gap-3">
              <p className="text-base font-bold leading-6 text-fg sm:text-lg">{card.title}</p>
              <p className="max-w-[260px] text-sm leading-6 text-text-secondary">{card.body}</p>
            </div>
            <Button asChild size="sm" className="w-[140px] justify-between gap-1 pr-1">
              <Link to="/" search={card.search} hash="catalogo">
                Explorar
                <ArrowRightIcon className="size-[18px] -rotate-90" />
              </Link>
            </Button>
          </div>
          <img
            src={promoMask}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full opacity-60"
          />
        </div>
      ))}
    </section>
  )
}
