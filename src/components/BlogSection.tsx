import { Link } from '@tanstack/react-router'

import blogHeadphones from '@/assets/figma/blog-headphones.webp'
import blogBucketHat from '@/assets/figma/blog-bucket-hat.webp'
import heroArt from '@/assets/figma/hero-art.webp'
import promoCurated from '@/assets/figma/promo-curated.webp'

const POSTS = [
  {
    image: promoCurated,
    alt: 'Ilustração de um macaco com casaco bege e gola rulê verde.',
    date: '12 de setembro',
    readTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    body: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    image: heroArt,
    alt: 'Ilustração de um macaco com óculos escuros e jaqueta universitária verde.',
    date: '13 de setembro',
    readTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    body: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    image: blogBucketHat,
    alt: 'Ilustração de um macaco com chapéu de balde e moletom roxo.',
    date: '15 de setembro',
    readTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    body: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    image: blogHeadphones,
    alt: 'Ilustração de um macaco com fones de ouvido verdes.',
    date: '15 de setembro',
    readTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    body: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]

/** Home page blog teaser — desktop-only in Figma (no mobile frame covers it). */
export function BlogSection() {
  return (
    <section aria-labelledby="blog-heading" className="hidden flex-col items-center gap-10 md:flex">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 id="blog-heading" className="text-[28px] font-bold text-text-primary">
          Diário da Cunhagem
        </h2>
        <p className="text-sm text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-6 lg:grid-cols-4">
        {POSTS.map((post, i) => (
          <article
            key={i}
            className="flex flex-col overflow-hidden rounded-lg bg-surface-card"
          >
            <img
              src={post.image}
              alt={post.alt}
              width={268}
              height={195}
              loading="lazy"
              className="h-[195px] w-full object-cover"
            />
            <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
              <p className="text-xs font-medium text-text-secondary">
                {post.date} &nbsp;|&nbsp; {post.readTime}
              </p>
              <p className="text-base font-bold text-text-primary">{post.title}</p>
              <p className="flex-1 text-xs font-medium text-text-secondary">{post.body}</p>
              <Link
                to="/aprenda"
                className="flex items-center gap-1 self-start rounded-sm text-xs font-bold text-text-accent outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Ler mais →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
