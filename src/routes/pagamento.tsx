import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import type { CreateOrderRequest, Network } from '@/contracts'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'
import { sessionQuery } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { cartQuery, quoteQuery } from '@/features/cart/api'
import { useCreateOrder } from '@/features/checkout/api'
import { CheckoutReview } from '@/features/checkout/CheckoutReview'
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [staleWarning, setStaleWarning] = useState(false)
  const formId = useId()

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
    setStaleWarning(false)
    const parsed = formSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])))
      return
    }
    if (!wallet.connection) {
      setErrors({ wallet: 'Conecte uma carteira para continuar.' })
      return
    }

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
            toast.error(
              error instanceof ApiError ? error.message : 'Não foi possível concluir a compra.',
            )
          },
        },
      )
    }
    runCreate()
  }

  return (
    <div className="space-y-8">
      <nav aria-label="Trilha" className="text-sm font-bold text-fg">
        Início / Mercado / Pagamento
      </nav>

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
