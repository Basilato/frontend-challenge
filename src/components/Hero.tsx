import heroArt from '@/assets/figma/hero-art.webp'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-[24px] bg-ink bg-[radial-gradient(120%_120%_at_78%_40%,rgba(90,50,22,0.45),transparent_60%)]"
    >
      <div className="flex flex-col items-center gap-8 px-6 py-10 md:h-[450px] md:flex-row md:justify-between md:gap-10 md:py-0 md:pl-10 md:pr-0">
        <div className="flex w-full flex-col items-start gap-8 md:w-[600px] md:items-end">
          <div className="flex w-full flex-col items-start gap-8">
            <div className="flex w-full flex-col gap-2 text-fg">
              <p className="text-sm font-medium tracking-[1.4px]">Bem-vindo à Kurio</p>
              <h1
                id="hero-title"
                className="text-[32px] font-bold leading-[1.15] md:text-[43px] md:leading-[70px]"
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
          <div className="hidden gap-2 md:flex" aria-hidden="true">
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
          className="aspect-square w-full max-w-[450px] rounded-[24px] object-cover md:h-[450px] md:w-[450px]"
        />
      </div>
    </section>
  )
}
