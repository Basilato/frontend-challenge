import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/PagePlaceholder'
import { formatEth } from '@/lib/money'
import { nftDetailQuery } from '@/features/catalog/api'

export const Route = createFileRoute('/nft/$nftId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(nftDetailQuery(params.nftId)),
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { data, isLoading, isError } = useQuery(nftDetailQuery(nftId))

  if (isLoading) return <PagePlaceholder title="Carregando NFT…" />
  if (isError || !data)
    return <PagePlaceholder title="NFT não encontrado" note="Verifique o endereço e tente novamente." />

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <img
        src={data.gallery[0] ?? data.image}
        alt={data.name}
        width={600}
        height={600}
        className="aspect-square w-full rounded-card bg-surface-dark object-cover"
      />
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-text-secondary">{data.collection}</p>
        <h1 className="text-xl font-bold text-foreground">{data.name}</h1>
        <p className="text-text-accent">{formatEth(data.priceEth)}</p>
        <p className="text-sm text-text-secondary">{data.description}</p>
        <p className="text-xs text-text-secondary">
          {data.available > 0 ? `${data.available} disponíveis` : 'Esgotado'} · rede {data.network}
        </p>
        <PagePlaceholder
          title="Compra, quantidade e favoritos"
          note="Interações da tela de detalhe serão implementadas a partir do Figma."
        />
      </div>
    </section>
  )
}
