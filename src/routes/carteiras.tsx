import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import type { Network, Wallet, WalletRole } from '@/contracts'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'
import { sessionQuery } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { AccountLayout, fieldInputCls } from '@/features/account/AccountLayout'
import { useUpsertWallet, walletsQuery } from '@/features/wallets/api'

export const Route = createFileRoute('/carteiras')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (!session) throw redirect({ to: '/login', search: { redirect: location.pathname } })
  },
  component: WalletsPage,
})

const NETWORKS: { value: Network; label: string }[] = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
]

const walletSchema = z.object({
  label: z.string().trim().min(2, 'Informe um apelido.'),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço 0x inválido (40 caracteres hex).'),
  networks: z.array(z.enum(['ethereum', 'polygon', 'solana'])).min(1, 'Selecione ao menos uma rede.'),
})

function WalletsPage() {
  const { user } = useAuth()
  const { data: wallets, isLoading } = useQuery(walletsQuery(user?.id ?? null))

  const find = (role: WalletRole) => wallets?.find((w) => w.role === role)

  return (
    <AccountLayout title="Carteiras">
      {isLoading ? (
        <p className="text-text-secondary">Carregando…</p>
      ) : (
        <div className="space-y-10">
          <WalletCard role="primary" title="Carteira principal" wallet={find('primary')} userId={user!.id} />
          <WalletCard
            role="secondary"
            title="Carteira secundária (opcional)"
            wallet={find('secondary')}
            userId={user!.id}
          />
        </div>
      )}
    </AccountLayout>
  )
}

function WalletCard({
  role,
  title,
  wallet,
  userId,
}: {
  role: WalletRole
  title: string
  wallet: Wallet | undefined
  userId: string
}) {
  const upsert = useUpsertWallet(userId)
  const [values, setValues] = useState({
    label: wallet?.label ?? '',
    address: wallet?.address ?? '',
    networks: (wallet?.networks ?? []) as Network[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleNetwork = (n: Network) =>
    setValues((v) => ({
      ...v,
      networks: v.networks.includes(n) ? v.networks.filter((x) => x !== n) : [...v.networks, n],
    }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const parsed = walletSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])))
      return
    }
    upsert.mutate(
      { role, label: parsed.data.label, address: parsed.data.address, networks: parsed.data.networks },
      {
        onSuccess: () => toast.success(`${title} salva.`),
        onError: (error) => {
          if (error instanceof ApiError && error.fields) setErrors(error.fields)
          else toast.error('Não foi possível salvar a carteira.')
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[6px] border border-border p-5" noValidate>
      <h2 className="text-[15px] font-bold text-fg">{title}</h2>

      <label className="flex flex-col gap-2">
        <span className="text-[15px] text-fg">
          Apelido da carteira <span className="text-[#f0805f]">*</span>
        </span>
        <input
          className={fieldInputCls}
          value={values.label}
          aria-invalid={Boolean(errors.label)}
          onChange={(e) => setValues((v) => ({ ...v, label: e.target.value }))}
        />
        {errors.label && <span role="alert" className="text-xs text-destructive">{errors.label}</span>}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[15px] text-fg">
          Endereço da carteira <span className="text-[#f0805f]">*</span>
        </span>
        <input
          className={cn(fieldInputCls, 'font-mono')}
          placeholder="0x0000000000000000000000000000000000000000"
          value={values.address}
          aria-invalid={Boolean(errors.address)}
          onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
        />
        {errors.address && (
          <span role="alert" className="text-xs text-destructive">{errors.address}</span>
        )}
      </label>

      <fieldset className="space-y-2">
        <legend className="text-[15px] text-fg">
          Redes <span className="text-[#f0805f]">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {NETWORKS.map((n) => {
            const on = values.networks.includes(n.value)
            return (
              <button
                key={n.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggleNetwork(n.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  on
                    ? 'border-primary text-text-accent'
                    : 'border-border-soft text-text-secondary hover:border-primary',
                )}
              >
                {n.label}
              </button>
            )
          })}
        </div>
        {errors.networks && (
          <span role="alert" className="text-xs text-destructive">{errors.networks}</span>
        )}
      </fieldset>

      <Button type="submit" disabled={upsert.isPending} className="w-[160px] rounded-[3px]">
        {upsert.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}
