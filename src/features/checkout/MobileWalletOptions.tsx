import { Wallet as WalletIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { WalletProvider } from './useWalletConnection'

const PROVIDERS: WalletProvider[] = ['WalletConnect', 'MetaMask', 'Coinbase Wallet']
const MARK: Record<WalletProvider, string> = { WalletConnect: 'W', MetaMask: 'M', 'Coinbase Wallet': '' }

/**
 * Mobile-only wallet-provider connection list (Figma "Wallet Options" —
 * WalletConnect / MetaMask / Coinbase, each a letter-mark avatar + name +
 * radio). Same connect/disconnect logic as the desktop provider buttons,
 * just styled as selectable rows instead of a plain button list.
 */
export function MobileWalletOptions({
  connectedProvider,
  isConnecting,
  onSelect,
}: {
  connectedProvider: WalletProvider | undefined
  isConnecting: boolean
  onSelect: (provider: WalletProvider) => void
}) {
  return (
    <ul className="flex flex-col gap-4">
      {PROVIDERS.map((provider) => {
        const selected = provider === connectedProvider
        return (
          <li key={provider}>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={isConnecting}
              onClick={() => onSelect(provider)}
              className="flex h-[65px] w-full items-center gap-3 rounded-[15px] bg-surface-card px-3.5 shadow-[0_0_20px_rgba(10,6,4,0.45)] outline-none disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-sm font-bold text-text-accent">
                {provider === 'Coinbase Wallet' ? <WalletIcon className="size-5" /> : MARK[provider]}
              </span>
              <span className="min-w-0 flex-1 truncate text-left text-sm text-fg">{provider}</span>
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border-[1.2px]',
                  selected ? 'border-primary' : 'border-border-soft',
                )}
              >
                {selected && <span className="size-2 rounded-full bg-primary" />}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
