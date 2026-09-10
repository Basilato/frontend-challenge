import { useState } from 'react'

import type { NftDetail } from '@/contracts'
import { cn } from '@/lib/utils'

const NETWORK_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export function NftDescription({ nft }: { nft: NftDetail }) {
  const [tab, setTab] = useState<'details' | 'reviews'>('details')

  return (
    <section className="space-y-5">
      <div
        role="tablist"
        className="flex gap-6 overflow-x-auto whitespace-nowrap border-b border-border sm:gap-8"
      >
        <TabButton active={tab === 'details'} onClick={() => setTab('details')}>
          Detalhes do NFT
        </TabButton>
        <TabButton active={tab === 'reviews'} onClick={() => setTab('reviews')}>
          Avaliações de colecionadores ({nft.reviewCount})
        </TabButton>
      </div>

      {tab === 'details' ? (
        <div className="max-w-3xl space-y-4 text-sm leading-6 text-text-secondary">
          {nft.longDescription.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p>
            <strong className="text-fg">Rede:</strong> Cunhado na{' '}
            {NETWORK_LABELS[nft.network] ?? nft.network} com procedência imutável e metadados
            armazenados no IPFS.
          </p>
          <p>
            <strong className="text-fg">Contrato:</strong> {nft.contractAddress} • Contrato
            inteligente ERC-721 verificado.
          </p>
          <p>
            <strong className="text-fg">Direitos autorais:</strong> Direitos autorais do criador:{' '}
            {nft.royaltiesPct}% nas vendas secundárias, pagos automaticamente pelos mercados
            compatíveis.
          </p>
        </div>
      ) : (
        <p className="max-w-3xl text-sm leading-6 text-text-secondary">
          {nft.reviewCount} colecionadores avaliaram esta obra com média de{' '}
          {nft.rating.toFixed(1)} de 5. As avaliações detalhadas ainda não estão disponíveis nesta
          demonstração.
        </p>
      )}
    </section>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        '-mb-px shrink-0 border-b-2 pb-2 text-sm transition-colors sm:text-[17px]',
        active ? 'border-primary font-bold text-text-accent' : 'border-transparent text-fg',
      )}
    >
      {children}
    </button>
  )
}
