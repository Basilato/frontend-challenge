import { Link } from '@tanstack/react-router'
import { MoreVertical } from 'lucide-react'

import type { Network, Wallet } from '@/contracts'
import { cn } from '@/lib/utils'

const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Rede principal Ethereum',
  polygon: 'Rede Polygon',
  solana: 'Rede Solana',
}

const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

/**
 * Mobile-only registered-wallet picker (Figma "Wallet Cards" — the two
 * cards, e.g. "Reserva"/"Principal") replacing the desktop "Carteira"
 * select. Tapping a card sets both the wallet and its first network, since
 * the mobile design shows one network per card rather than a separate field.
 */
export function MobileWalletCards({
  wallets,
  selectedId,
  onSelect,
}: {
  wallets: Wallet[]
  selectedId: string
  onSelect: (walletId: string, network: Network) => void
}) {
  if (wallets.length === 0) {
    return (
      <p className="rounded-[14px] border border-border bg-surface-card p-4 text-sm text-text-secondary">
        Você ainda não tem carteiras cadastradas.{' '}
        <Link to="/carteiras" className="font-bold text-text-accent underline">
          Cadastrar carteira
        </Link>
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-5">
      {wallets.map((w) => {
        const selected = w.id === selectedId
        return (
          <li key={w.id}>
            <div
              className={cn(
                'flex items-center gap-3 rounded-[14px] bg-surface-card p-4 shadow-[0_6px_20px_rgba(10,6,4,0.45)]',
                selected && 'shadow-[0_20px_20px_rgba(10,6,4,0.45)]',
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Usar ${w.label}`}
                onClick={() => onSelect(w.id, w.networks[0]!)}
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border-[1.2px] outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected ? 'border-primary' : 'border-border-soft',
                )}
              >
                {selected && <span className="size-2 rounded-full bg-primary" />}
              </button>
              <button
                type="button"
                onClick={() => onSelect(w.id, w.networks[0]!)}
                className="min-w-0 flex-1 text-left outline-none"
              >
                <p className="text-md font-bold text-fg">{w.label}</p>
                <p className="text-sm leading-[22px] text-text-secondary">
                  {short(w.address)}
                  <br />
                  {NETWORK_LABELS[w.networks[0]!]}
                </p>
              </button>
              <Link
                to="/carteiras"
                aria-label={`Gerenciar ${w.label}`}
                className="shrink-0 text-secondary outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreVertical className="size-4" />
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
