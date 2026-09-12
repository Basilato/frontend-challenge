import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import type { CreateOrderRequest, Network } from '@/contracts'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { formatEth } from '@/lib/money'
import { emitWhenConnected, getSocket } from '@/lib/socket'
import { cn } from '@/lib/utils'
import { useIsDesktopViewport } from '@/lib/viewport'
import { sessionQuery } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { cartQuery, quoteQuery } from '@/features/cart/api'
import { useCreateOrder } from '@/features/checkout/api'
import { CheckoutReview } from '@/features/checkout/CheckoutReview'
import { MobileCheckoutHeader } from '@/features/checkout/MobileCheckoutHeader'
import { MobileWalletCards } from '@/features/checkout/MobileWalletCards'
import { MobileWalletOptions } from '@/features/checkout/MobileWalletOptions'
import {
  useWalletConnection,
  type WalletProvider,
} from '@/features/checkout/useWalletConnection'
import { walletsQuery } from '@/features/wallets/api'

export const Route = createFileRoute('/pagamento')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.pathname } })
    }
  },
  component: PaymentPage,
})

const PROVIDERS: WalletProvider[] = ['MetaMask', 'Coinbase Wallet', 'WalletConnect']
const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

const formSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome de exibição.'),
  email: z.string().email('E-mail inválido.'),
  network: z.enum(['ethereum', 'polygon', 'solana'], { message: 'Selecione uma rede.' }),
  walletId: z.string().min(1, 'Selecione uma carteira.'),
})

function PaymentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const ownerKey = user?.id ?? 'guest'
  // The Figma mobile frame drops the collector name/email/notes fields
  // entirely (the account's own profile covers them) and replaces the
  // "Rede"/"Carteira" selects with tappable cards — different enough from
  // the desktop form that, like the cart page, mounting only one avoids two
  // elements sharing the same label ("Total", a provider name...).
  const isDesktop = useIsDesktopViewport()

  const { data: cart, isLoading: cartLoading } = useQuery(cartQuery(ownerKey))
  const { data: quote } = useQuery(quoteQuery(ownerKey, (cart?.items.length ?? 0) > 0))
  const { data: wallets } = useQuery(walletsQuery(user?.id ?? null))

  const wallet = useWalletConnection()
  const createOrder = useCreateOrder()
  const queryClient = useQueryClient()
  const nonce = useRef(crypto.randomUUID())

  const [values, setValues] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    network: (wallets?.[0]?.networks[0] ?? '') as Network | '',
    walletId: wallets?.[0]?.id ?? '',
    notes: '',
  })
  // `wallets` is still undefined on the first render (the query hasn't
  // resolved yet), so the useState initializer above almost always misses
  // it — fill in the first registered wallet once it loads, same as a
  // freshly connected wallet arriving pre-selected.
  useEffect(() => {
    if (values.walletId || !wallets?.length) return
    setValues((s) => ({ ...s, walletId: wallets[0]!.id, network: wallets[0]!.networks[0]! }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [staleWarning, setStaleWarning] = useState(false)
  // Set when a cart item changes on the wire while the checkout is open — the
  // next confirm click is blocked so the collector reviews the updated total.
  const [priceChanged, setPriceChanged] = useState(false)
  const cartNftIds = (cart?.items ?? []).map((i) => i.nftId)
  const formId = useId()

  // Tell the mock the checkout is open (drives the price-change scenario).
  useEffect(() => emitWhenConnected('subscribe:checkout'), [])

  // Watch the wire for changes to items in this cart.
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onNft = (event: { nftId?: string }) => {
      if (event?.nftId && cartNftIds.includes(event.nftId)) setPriceChanged(true)
    }
    socket.on('nft.updated', onNft)
    return () => {
      socket.off('nft.updated', onNft)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartNftIds.join(',')])

  if (cartLoading) return <p className="py-16 text-center text-text-secondary">Carregando…</p>
  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-[8px] bg-surface-card p-12 text-center">
        <p className="text-lg text-fg">Não há nada para pagar.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-bold text-text-accent underline">
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  const submit = async () => {
    setErrors({})
    const parsed = formSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])))
      return
    }
    if (!wallet.connection) {
      setErrors({ wallet: 'Conecte uma carteira para continuar.' })
      return
    }
    // A price/availability change arrived while the checkout was open — force a
    // deliberate re-confirmation against the updated summary.
    if (priceChanged) {
      setPriceChanged(false)
      setStaleWarning(true)
      return
    }
    setStaleWarning(false)

    // Revalidate the quote right before confirming (README).
    const fresh = await queryClient
      .fetchQuery(quoteQuery(ownerKey, true))
      .catch(() => null)
    if (!fresh) {
      toast.error('Não foi possível revalidar a cotação. Tente novamente.')
      return
    }
    if (quote && fresh.quoteHash !== quote.quoteHash) {
      setStaleWarning(true)
      return // show the new total; the user confirms again
    }

    const body: CreateOrderRequest = {
      quoteHash: fresh.quoteHash,
      cartId: cart.id,
      walletId: parsed.data.walletId,
      network: parsed.data.network,
      collector: { name: parsed.data.name, email: parsed.data.email },
    }
    const idempotencyKey = `${nonce.current}:${fresh.quoteHash}`

    const runCreate = (attempt = 1): void => {
      createOrder.mutate(
        { body, idempotencyKey },
        {
          onSuccess: (order) => navigate({ to: '/pedido/$orderId', params: { orderId: order.id } }),
          onError: (error) => {
            if (error instanceof ApiError && error.kind === 'timeout' && attempt < 2) {
              // idempotent retry recovers the same order
              toast.message('Confirmação demorou; tentando recuperar o pedido…')
              runCreate(attempt + 1)
              return
            }
            if (error instanceof ApiError && error.kind === 'conflict') {
              setStaleWarning(true)
              return
            }
            if (error instanceof ApiError && error.kind === 'unauthorized') {
              // useAuth's onUnauthorized handler redirects to /login?redirect=/pagamento;
              // this toast just explains why the checkout was interrupted.
              toast.error('Sua sessão expirou. Faça login novamente para concluir a compra.')
              return
            }
            toast.error(
              error instanceof ApiError ? error.message : 'Não foi possível concluir a compra.',
            )
          },
        },
      )
    }
    runCreate()
  }

  if (!isDesktop) {
    return (
      // Figma's "Content" frame is a flex-col filling the whole screen with
      // justify-between: the form fields sit at their natural height and
      // "Confirmar compra" is pinned to the very bottom of the viewport
      // whenever there's short content (e.g. a single wallet, no warnings)
      // — not fixed/docked, just pushed down by the remaining space, so it
      // still scrolls normally once content is taller than the screen. The
      // negative margin/dvh combo cancels <main>'s own padding so this box
      // can measure the real viewport instead of main's shrunk content box.
      <div className="-mx-4 -mt-4 -mb-10 flex min-h-dvh flex-col justify-between px-4 pb-10 pt-4">
        <div className="space-y-6">
          <MobileCheckoutHeader />

          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold text-fg">Carteira conectada</h2>
            {wallet.connection && (
              <button
                type="button"
                onClick={wallet.disconnect}
                className="text-sm font-bold text-text-accent outline-none hover:underline"
              >
                Trocar carteira
              </button>
            )}
          </div>

          <MobileWalletCards
            wallets={wallets ?? []}
            selectedId={values.walletId}
            onSelect={(walletId, network) => setValues((s) => ({ ...s, walletId, network }))}
          />
          {errors.walletId && (
            <p role="alert" className="text-sm text-destructive">
              {errors.walletId}
            </p>
          )}

          <h2 className="text-md font-bold text-fg">Carteira e rede</h2>
          <MobileWalletOptions
            connectedProvider={wallet.connection?.provider}
            isConnecting={wallet.isConnecting}
            onSelect={(provider) => wallet.connect(provider)}
          />
          {wallet.error && (
            <p role="alert" className="text-sm text-destructive">
              {wallet.error}
            </p>
          )}
          {errors.wallet && (
            <p role="alert" className="text-sm text-destructive">
              {errors.wallet}
            </p>
          )}

          {staleWarning && (
            <p role="alert" className="rounded-[6px] border border-primary bg-primary/10 p-3 text-sm text-fg">
              O valor da sua compra mudou. Revise o total abaixo e confirme novamente.
            </p>
          )}

          <div className="flex items-center justify-end gap-7 font-bold">
            <span className="text-md text-fg">Total:</span>
            <span className="text-lg text-text-accent">{quote ? formatEth(quote.totalEth) : '—'}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={createOrder.isPending}
          onClick={() => void submit()}
          className="mt-6 flex h-[60px] w-full shrink-0 items-center justify-center rounded-[40px] text-[15px] font-bold text-ink disabled:opacity-50 [background:linear-gradient(108deg,#D28A4C_4%,rgba(210,138,76,0.8)_122%)]"
        >
          {createOrder.isPending ? 'Processando…' : 'Confirmar compra'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/mercado' }, { label: 'Pagamento' }]} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_405px]">
        {/* Collector form */}
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
          className="space-y-6"
          noValidate
        >
          <h1 className="text-[17px] font-bold text-fg">Perfil do colecionador</h1>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Nome de exibição"
              value={values.name}
              onChange={(v) => setValues((s) => ({ ...s, name: v }))}
              error={errors.name}
              autoComplete="name"
            />
            <TextField
              label="E-mail"
              type="email"
              value={values.email}
              onChange={(v) => setValues((s) => ({ ...s, email: v }))}
              error={errors.email}
              autoComplete="email"
            />
            <SelectField
              label="Rede"
              value={values.network}
              onChange={(v) => setValues((s) => ({ ...s, network: v as Network }))}
              error={errors.network}
              placeholder="Selecione uma rede"
              options={[...new Set((wallets ?? []).flatMap((w) => w.networks))].map((n) => ({
                value: n,
                label: NETWORK_LABELS[n],
              }))}
            />
            <SelectField
              label="Carteira"
              value={values.walletId}
              onChange={(v) => setValues((s) => ({ ...s, walletId: v }))}
              error={errors.walletId}
              placeholder="Selecione uma carteira"
              options={(wallets ?? []).map((w) => ({ value: w.id, label: `${w.label} · ${w.address.slice(0, 10)}…` }))}
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[15px] text-fg">Observação do colecionador (opcional)</span>
            <textarea
              value={values.notes}
              onChange={(e) => setValues((s) => ({ ...s, notes: e.target.value }))}
              rows={4}
              className="w-full rounded-[3px] border border-border bg-transparent p-3 text-sm text-fg focus:border-primary focus:outline-none"
            />
          </label>

          {(wallets ?? []).length === 0 && (
            <p className="rounded-[6px] border border-border bg-surface-card p-3 text-sm text-text-secondary">
              Você ainda não tem carteiras cadastradas.{' '}
              <Link to="/carteiras" className="font-bold text-text-accent underline">
                Cadastrar carteira
              </Link>
            </p>
          )}
        </form>

        {/* Order review + wallet connection + confirm */}
        <aside className="space-y-6">
          <CheckoutReview cart={cart} quote={quote} />

          <section className="space-y-3">
            <h2 className="text-center text-[17px] font-bold text-fg">Carteira e rede</h2>
            {wallet.connection ? (
              <div className="flex items-center justify-between rounded-[3px] border border-primary p-3 text-sm">
                <span className="text-fg">
                  {wallet.connection.provider} · {wallet.connection.address.slice(0, 12)}…
                </span>
                <button
                  type="button"
                  onClick={wallet.disconnect}
                  className="text-text-accent hover:underline"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    disabled={wallet.isConnecting}
                    onClick={() => wallet.connect(provider)}
                    className="flex w-full items-center justify-between rounded-[3px] border border-border p-3 text-sm text-fg transition-colors hover:border-primary disabled:opacity-50"
                  >
                    {provider}
                    <span className="text-xs text-text-secondary">
                      {wallet.isConnecting ? 'Conectando…' : 'Conectar'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {wallet.error && (
              <p role="alert" className="text-sm text-destructive">
                {wallet.error}
              </p>
            )}
            {errors.wallet && (
              <p role="alert" className="text-sm text-destructive">
                {errors.wallet}
              </p>
            )}
          </section>

          {staleWarning && (
            <p role="alert" className="rounded-[6px] border border-primary bg-primary/10 p-3 text-sm text-fg">
              O valor da sua compra mudou. Revise o total acima e confirme novamente.
            </p>
          )}

          <Button
            type="submit"
            form={formId}
            disabled={createOrder.isPending}
            className={cn('h-11 w-full rounded-[8px]')}
          >
            {createOrder.isPending ? 'Processando…' : 'Confirmar compra'}
          </Button>
          <button
            type="button"
            onClick={() => navigate({ to: '/carrinho' })}
            className="w-full text-center text-[15px] text-text-accent hover:underline"
          >
            Voltar ao carrinho
          </button>
        </aside>
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[15px] text-fg">
        {label} <span className="text-[#f0805f]">*</span>
      </span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className="h-10 w-full rounded-[3px] border border-border bg-transparent px-3 text-sm text-fg focus:border-primary focus:outline-none aria-[invalid=true]:border-destructive"
      />
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  error,
  placeholder,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[15px] text-fg">
        {label} <span className="text-[#f0805f]">*</span>
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className="h-10 w-full rounded-[3px] border border-border bg-transparent px-3 text-sm text-fg focus:border-primary focus:outline-none aria-[invalid=true]:border-destructive"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-card">
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </label>
  )
}
