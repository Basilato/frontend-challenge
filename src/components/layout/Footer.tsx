import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/icons'

/** A footer link that has a real destination in the app. Falls back to plain text otherwise
 *  (rule 3 — no dead-end business paths dressed up as navigation). */
function FooterLink({ to, children }: { to?: string; children: ReactNode }) {
  if (!to) {
    return <span className="text-fg/70">{children}</span>
  }
  return (
    <Link
      to={to}
      className="rounded-sm text-fg/70 outline-none transition-colors hover:text-text-accent focus-visible:text-text-accent focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  )
}

function FooterCollectionLink({ collection }: { collection: string }) {
  return (
    <Link
      to="/"
      search={(prev) => ({ ...prev, collections: [collection], page: 1 })}
      className="rounded-sm text-fg/70 outline-none transition-colors hover:text-text-accent focus-visible:text-text-accent focus-visible:ring-2 focus-visible:ring-ring"
    >
      {collection}
    </Link>
  )
}

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    body: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    body: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    body: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

const SOCIALS = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'Twitter', Icon: TwitterIcon },
  { label: 'LinkedIn', Icon: LinkedinIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
] as const

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="flex flex-wrap items-stretch gap-y-8 bg-surface-card px-8 py-8">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.letter}
              className={
                i === 0
                  ? 'flex min-w-[220px] flex-1 flex-col items-start gap-3 px-4'
                  : 'flex min-w-[220px] flex-1 flex-col items-start gap-3 border-l border-primary/40 px-4'
              }
            >
              <span className="flex size-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-ink">
                {feature.letter}
              </span>
              <p className="text-[17px] font-bold leading-4 text-fg">{feature.title}</p>
              <p className="max-w-[204px] text-sm leading-[22px] text-text-secondary">
                {feature.body}
              </p>
            </div>
          ))}

          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex min-w-[280px] flex-1 flex-col gap-4 border-l border-primary/40 px-4"
          >
            <p className="text-lg font-bold leading-4 text-fg">Antecipe-se ao próximo lançamento</p>
            <div className="flex h-10 items-center justify-between rounded-[6px] bg-surface-dark pl-3 shadow-[0_0_10px_rgba(10,6,4,0.45)]">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Endereço para receber novidades da Kurio
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                placeholder="digite seu e-mail..."
                className="h-full w-full bg-transparent text-sm text-fg placeholder:text-secondary focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-br-[6px] rounded-tr-[6px] bg-primary px-4 text-lg font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
              >
                Enviar
              </button>
            </div>
            <p className="text-[13px] leading-[22px] text-text-secondary">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 bg-surface-dark px-8 py-8">
          <p className="flex-1 text-sm font-bold tracking-[1.4px] text-fg">KURIO</p>
          <p className="flex-1 text-sm leading-[22px] text-fg">
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
          <a
            href="mailto:contato@email.com"
            className="flex-1 rounded-sm text-sm text-fg outline-none hover:text-text-accent focus-visible:text-text-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            contato@email.com
          </a>
          <a
            href="tel:+551140028922"
            className="flex-1 rounded-sm text-sm text-fg outline-none hover:text-text-accent focus-visible:text-text-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            +55 11 4002 8922
          </a>
        </div>

        <div className="flex flex-col gap-6 bg-surface-card px-8 py-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
            <nav aria-label="Meu perfil" className="flex flex-col gap-2 text-sm">
              <p className="text-lg font-bold leading-4 text-fg">Meu perfil</p>
              <FooterLink to="/perfil">Meu perfil</FooterLink>
              <FooterLink>Minha coleção</FooterLink>
              <FooterLink>Atividade</FooterLink>
              <FooterLink>Estúdio do criador</FooterLink>
              <FooterLink to="/favoritos">Lista de interesse</FooterLink>
            </nav>

            <nav aria-label="Central de ajuda" className="flex flex-col gap-2 text-sm">
              <p className="text-lg font-bold leading-4 text-fg">Central de ajuda</p>
              <FooterLink>Central de ajuda</FooterLink>
              <FooterLink>Como comprar NFTs</FooterLink>
              <FooterLink to="/carteiras">Carteira e segurança</FooterLink>
              <FooterLink>Política do mercado</FooterLink>
              <FooterLink>Denunciar item</FooterLink>
            </nav>

            <nav aria-label="Coleções" className="flex flex-col gap-2 text-sm">
              <p className="text-lg font-bold leading-4 text-fg">Coleções</p>
              <FooterCollectionLink collection="Arte digital" />
              <FooterCollectionLink collection="Fotografia" />
              <FooterCollectionLink collection="Música" />
              <FooterCollectionLink collection="Arte 3D" />
              <FooterCollectionLink collection="Utilidade" />
            </nav>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                <p className="text-lg font-bold leading-4 text-fg">Redes sociais</p>
                <div className="flex items-center gap-2.5">
                  {SOCIALS.map(({ label, Icon }) => (
                    <Icon key={label} aria-label={label} className="size-[30px]" />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-lg font-bold leading-4 text-fg">Carteiras compatíveis</p>
                <div className="flex h-[26px] items-center justify-center rounded-[6px] border border-border-soft bg-surface-dark px-2">
                  <p className="whitespace-nowrap text-[9px] font-bold tracking-[0.1px] text-text-accent">
                    METAMASK&nbsp;&nbsp;•&nbsp;&nbsp;WALLETCONNECT&nbsp;&nbsp;•&nbsp;&nbsp;COINBASE
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm leading-[30px] text-fg">
            © {new Date().getFullYear()} Kurio. Propriedade digital para todos.
          </p>
        </div>
      </div>
    </footer>
  )
}
