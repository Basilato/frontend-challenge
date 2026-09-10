import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { CatalogFacets, Network } from '@/contracts'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

import { facetsQuery } from './api'
import { catalogRoute } from './route'
import { searchToParams } from './search'

const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export function FilterSidebar({ className }: { className?: string }) {
  const search = catalogRoute.useSearch()
  const navigate = catalogRoute.useNavigate()
  const { data: facets } = useQuery(facetsQuery(searchToParams(search)))

  const toggleCollection = (value: string) =>
    navigate({
      search: (p) => ({ ...p, collections: toggleValue(p.collections, value), page: 1 }),
    })

  const toggleNetwork = (value: string) =>
    navigate({
      search: (p) => ({ ...p, networks: toggleValue(p.networks, value) as Network[], page: 1 }),
    })

  return (
    <div className={cn('flex flex-col gap-10 bg-surface-card p-5', className)}>
      <FilterGroup title="Coleções">
        <ul className="px-3">
          {(facets?.collections ?? placeholderCounts(9)).map((c) => (
            <FilterRow
              key={c.value}
              label={c.value}
              count={c.count}
              selected={search.collections.includes(c.value)}
              onClick={() => toggleCollection(c.value)}
            />
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Faixa de preço">
        <PriceControls
          key={`${facets?.priceRangeEth.minEth ?? ''}:${facets?.priceRangeEth.maxEth ?? ''}:${search.priceMinEth ?? ''}:${search.priceMaxEth ?? ''}`}
          facets={facets}
        />
      </FilterGroup>

      <FilterGroup title="Rede">
        <ul className="px-3">
          {(facets?.networks ?? placeholderCounts(3)).map((n) => (
            <FilterRow
              key={n.value}
              label={NETWORK_LABELS[n.value as Network] ?? n.value}
              count={n.count}
              selected={search.networks.includes(n.value as Network)}
              onClick={() => toggleNetwork(n.value)}
            />
          ))}
        </ul>
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-3">
      <h3 className="text-lg font-bold leading-none text-fg">{title}</h3>
      {children}
    </section>
  )
}

function FilterRow({
  label,
  count,
  selected,
  onClick,
}: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className={cn(
          'flex w-full items-center justify-between gap-2 py-1.5 text-left text-[15px] leading-[28px] transition-colors',
          selected ? 'text-text-accent' : 'text-text-secondary hover:text-fg',
        )}
      >
        <span className={cn(selected && 'font-medium')}>{label}</span>
        <span className="font-bold">({count})</span>
      </button>
    </li>
  )
}

function PriceControls({ facets }: { facets: CatalogFacets | undefined }) {
  const search = catalogRoute.useSearch()
  const navigate = catalogRoute.useNavigate()

  const bounds = (() => {
    const min = Math.floor(Number(facets?.priceRangeEth.minEth ?? 0) * 100) / 100
    const max = Math.ceil(Number(facets?.priceRangeEth.maxEth ?? 10) * 100) / 100
    return { min, max: max > min ? max : min + 1 }
  })()

  // Initialised from the URL; the component is re-keyed by the parent when either changes.
  const [range, setRange] = useState<[number, number]>([
    search.priceMinEth ? Number(search.priceMinEth) : bounds.min,
    search.priceMaxEth ? Number(search.priceMaxEth) : bounds.max,
  ])

  const dirty =
    range[0] !== (search.priceMinEth ? Number(search.priceMinEth) : bounds.min) ||
    range[1] !== (search.priceMaxEth ? Number(search.priceMaxEth) : bounds.max)

  return (
    <div className="flex flex-col items-start gap-3 pl-3">
      <Slider
        value={range}
        min={bounds.min}
        max={bounds.max}
        step={0.01}
        minStepsBetweenThumbs={1}
        onValueChange={(v) => setRange([v[0] ?? bounds.min, v[1] ?? bounds.max])}
        aria-label="Faixa de preço em ETH"
        className="w-full max-w-[220px]"
      />
      <p className="text-[15px] text-fg">
        Preço: {fmt(range[0])} – {fmt(range[1])} ETH
      </p>
      <Button
        size="sm"
        disabled={!dirty}
        onClick={() => {
          const atMin = range[0] <= bounds.min
          const atMax = range[1] >= bounds.max
          navigate({
            search: (p) => ({
              ...p,
              priceMinEth: atMin ? undefined : range[0].toFixed(2),
              priceMaxEth: atMax ? undefined : range[1].toFixed(2),
              page: 1,
            }),
          })
        }}
      >
        Aplicar
      </Button>
    </div>
  )
}

const fmt = (n: number) => n.toFixed(2).replace('.', ',')
const placeholderCounts = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ value: `—${i}`, count: 0 }))

const toggleValue = (list: readonly string[], value: string): string[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
