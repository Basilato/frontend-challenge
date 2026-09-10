import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Loader2, XCircle } from 'lucide-react'

import type { Order } from '@/contracts'
import thankYou from '@/assets/figma/thank-you.svg'
import { ApiError } from '@/lib/http'
import { formatEth } from '@/lib/money'
import { sessionQuery } from '@/features/auth/api'
import { orderQuery } from '@/features/checkout/api'

export const Route = createFileRoute('/pedido/$orderId')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (!session) throw redirect({ to: '/login', search: { redirect: location.pathname } })
  },
  component: OrderConfirmationPage,
})

function OrderConfirmationPage() {
  const { orderId } = Route.useParams()
  const { data: order, isLoading, isError, error } = useQuery(orderQuery(orderId))

  if (isLoading) return <Centered>Carregando pedido…</Centered>

  if ((isError && error instanceof ApiError && error.kind === 'not-found') || (!isLoading && !order)) {
    return (
      <Centered>
        <h1 className="text-xl font-bold text-text-accent">Pedido não encontrado</h1>
        <Link to="/" className="mt-3 inline-block text-sm font-bold text-text-accent underline">
          Voltar ao catálogo
        </Link>
      </Centered>
    )
  }
  if (isError || !order) {
    return <Centered>Não foi possível carregar o pedido.</Centered>
  }

  if (order.status === 'pending') return <PendingView />
  if (order.status === 'rejected') return <RejectedView order={order} />
  return <ConfirmedView order={order} />
}

function PendingView() {
  return (
    <Centered>
      <Loader2 className="mx-auto size-10 animate-spin text-primary" aria-hidden="true" />
      <h1 className="mt-4 text-lg font-bold text-fg">Processando seu pedido…</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Estamos confirmando a transação na rede. Isso leva alguns segundos — você pode
        atualizar a página com segurança, o pedido não será duplicado.
      </p>
    </Centered>
  )
}

function RejectedView({ order }: { order: Order }) {
  return (
    <Centered>
      <XCircle className="mx-auto size-10 text-destructive" aria-hidden="true" />
      <h1 className="mt-4 text-lg font-bold text-fg">Pagamento recusado</h1>
      <p className="mt-2 text-sm text-text-secondary">
        {order.rejectionReason ?? 'A transação não foi concluída.'} Seus itens continuam no
        carrinho.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        <Link
          to="/carrinho"
          className="rounded-[6px] bg-primary px-5 py-2.5 text-sm font-bold text-ink"
        >
          Voltar ao carrinho
        </Link>
        <Link
          to="/"
          className="rounded-[6px] border border-border px-5 py-2.5 text-sm text-fg"
        >
          Continuar explorando
        </Link>
      </div>
    </Centered>
  )
}

function ConfirmedView({ order }: { order: Order }) {
  const date = new Date(order.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return (
    <div className="mx-auto max-w-[600px] overflow-hidden rounded-[10px] border-b-[6px] border-primary bg-surface-card">
      <div className="flex flex-col items-center gap-4 px-6 py-10">
        <img src={thankYou} alt="" width={80} height={80} />
        <p className="text-center text-base font-bold text-text-secondary">
          Seus NFTs agora estão na sua carteira
        </p>
      </div>

      <div className="border-y border-primary px-6 py-4">
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-text-secondary">
          <Meta label="ID da transação" value={truncateMiddle(order.transactionRef ?? '—')} />
          <Meta label="Data" value={date} />
          <Meta label="Total" value={formatEth(order.totalEth)} />
          <Meta label="Carteira" value={order.walletLabel} />
        </dl>
      </div>

      <div className="space-y-4 px-6 py-6">
        <h2 className="text-[15px] font-bold text-fg">Detalhes da transação</h2>
        <div className="flex items-center justify-between border-b border-border pb-2 text-base text-fg">
          <span className="font-bold">NFTs</span>
          <span className="flex gap-10">
            <span className="font-bold">Edições</span>
            <span className="font-medium">Subtotal</span>
          </span>
        </div>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li
              key={item.editionId}
              className="flex items-center justify-between gap-3 rounded-[8px] bg-surface-card p-2 pr-3"
            >
              <span className="flex min-w-0 items-center gap-3">
                <img
                  src={item.image}
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 shrink-0 rounded-[8px] object-cover"
                />
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold text-fg">{item.name}</span>
                  <span className="block text-sm text-secondary">ID do token: {item.tokenId}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-6 text-right sm:gap-10">
                <span className="text-sm text-text-secondary">(x {item.quantity})</span>
                <span className="text-lg font-bold text-text-accent">
                  {formatEth(item.lineTotalEth)}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-border pt-3 text-right">
          <div className="flex justify-between text-[15px] text-fg">
            <dt>Taxa de rede</dt>
            <dd className="text-lg">{formatEth(order.networkFeeEth)}</dd>
          </div>
          <div className="flex justify-between font-bold">
            <dt className="text-base text-fg">Total</dt>
            <dd className="text-lg text-text-accent">{formatEth(order.totalEth)}</dd>
          </div>
        </dl>

        <p className="border-t border-border pt-4 text-center text-sm leading-6 text-text-secondary">
          Transação confirmada na {order.network}. A propriedade foi transferida para sua
          carteira conectada e registrada na rede.
        </p>
        <div className="flex justify-center pt-2">
          <a
            href={order.explorerUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="rounded-[5px] bg-primary px-6 py-3 text-base font-bold text-ink"
          >
            Ver no explorador
          </a>
        </div>
        <p className="text-center">
          <Link to="/" className="text-sm text-text-accent hover:underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-sm font-bold">{label}</dt>
      <dd className="text-[15px]">{value}</dd>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg rounded-[15px] bg-surface-card p-12 text-center">{children}</div>
  )
}

function truncateMiddle(s: string, head = 6, tail = 4) {
  return s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s
}
