import heroArt from '@/assets/figma/hero-art.webp'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-[24px] bg-ink bg-[radial-gradient(120%_120%_at_78%_40%,rgba(90,50,22,0.45),transparent_60%)]"
    >
      <div className="flex flex-col items-center gap-8 px-6 py-10 lg:min-h-[450px] lg:flex-row lg:justify-between lg:gap-10 lg:py-0 lg:pl-10 lg:pr-0">
        <div className="flex w-full flex-col items-start gap-8 lg:w-[600px] lg:items-end">
          <div className="flex w-full flex-col items-start gap-8">
            <div className="flex w-full flex-col gap-2 text-fg">
              <p className="text-sm font-medium tracking-[1.4px]">Bem-vindo à Kurio</p>
              <h1
                id="hero-title"
                className="text-[32px] font-bold leading-[1.15] lg:text-[43px] lg:leading-[70px]"
              >
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </h1>
            </div>
            <p className="max-w-[557px] text-sm leading-6 text-text-secondary">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>
            <Button asChild className="w-[140px]">
              <a href="#catalogo">EXPLORAR</a>
            </Button>
          </div>
          <div className="hidden gap-2 lg:flex" aria-hidden="true">
            <span className="size-2 rounded-full bg-primary/50" />
            <span className="size-2 rounded-full bg-primary" />
            <span className="size-2 rounded-full bg-primary/50" />
          </div>
        </div>

        <img
          src={heroArt}
          alt="Ilustração de um macaco usando óculos escuros e jaqueta universitária verde — obra em destaque da coleção."
          width={450}
          height={450}
          // This is the page's LCP element (only Hero image above the fold) —
          // hint the browser to fetch it ahead of lower-priority requests. No
          // static <link rel=preload> in index.html: that's shared by every
          // route, and this image isn't used outside Início, so it would just
          // cost the other audited page (Detalhe) bandwidth for nothing.
          fetchPriority="high"
          className="aspect-square w-full max-w-[450px] rounded-[24px] object-cover lg:h-[450px] lg:w-[450px]"
        />
      </div>
    </section>
  )
}
