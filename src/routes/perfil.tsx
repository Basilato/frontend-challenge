import { createFileRoute, redirect } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { sessionQuery } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { AccountLayout, fieldInputCls } from '@/features/account/AccountLayout'
import { useChangePassword, useUpdateProfile } from '@/features/profile/api'

export const Route = createFileRoute('/perfil')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (!session) throw redirect({ to: '/login', search: { redirect: location.pathname } })
  },
  component: ProfilePage,
})

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome de exibição.'),
  email: z.string().email('E-mail inválido.'),
})
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z.string().min(6, 'Mínimo de 6 caracteres.'),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ['confirm'],
    message: 'As senhas não conferem.',
  })

function ProfilePage() {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const fileInput = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    avatar: user?.avatar ?? null,
  })
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileErrors({})
    const parsed = profileSchema.safeParse(profile)
    if (!parsed.success) {
      setProfileErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])))
      return
    }
    updateProfile.mutate(
      { name: parsed.data.name, email: parsed.data.email, avatar: profile.avatar },
      {
        onSuccess: () => toast.success('Perfil atualizado.'),
        onError: (error) => {
          if (error instanceof ApiError && error.fields) setProfileErrors(error.fields)
          else toast.error('Não foi possível salvar o perfil.')
        },
      },
    )
  }

  const savePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPwErrors({})
    const parsed = passwordSchema.safeParse(pw)
    if (!parsed.success) {
      setPwErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])))
      return
    }
    changePassword.mutate(
      { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword },
      {
        onSuccess: () => {
          toast.success('Senha alterada.')
          setPw({ currentPassword: '', newPassword: '', confirm: '' })
        },
        onError: (error) => {
          if (error instanceof ApiError && error.fields) setPwErrors(error.fields)
          else toast.error('Não foi possível alterar a senha.')
        },
      },
    )
  }

  const onPickAvatar = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfile((p) => ({ ...p, avatar: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  return (
    <AccountLayout title="Perfil do colecionador">
      <form onSubmit={saveProfile} className="space-y-6" noValidate>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Nome de exibição" required error={profileErrors.name}>
            <input
              className={fieldInputCls}
              value={profile.name}
              autoComplete="name"
              aria-invalid={Boolean(profileErrors.name)}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </Field>
          <Field label="E-mail" required error={profileErrors.email}>
            <input
              type="email"
              className={fieldInputCls}
              value={profile.email}
              autoComplete="email"
              aria-invalid={Boolean(profileErrors.email)}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
          </Field>
        </div>

        <div className="space-y-2">
          <span className="text-[15px] text-fg">Avatar</span>
          <div className="flex items-center gap-5">
            <span className="flex size-[50px] items-center justify-center overflow-hidden rounded-full border border-border bg-surface-dark text-text-secondary">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="size-full object-cover" />
              ) : (
                (profile.name[0] ?? '?').toUpperCase()
              )}
            </span>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickAvatar(e.target.files?.[0])}
            />
            <Button type="button" size="sm" onClick={() => fileInput.current?.click()}>
              Alterar
            </Button>
            {profile.avatar && (
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, avatar: null }))}
                className="text-sm text-fg hover:text-text-accent"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        <Button type="submit" disabled={updateProfile.isPending} className="w-[131px] rounded-[3px]">
          {updateProfile.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>

      <form onSubmit={savePassword} className="space-y-5 border-t border-border pt-8" noValidate>
        <h2 className="text-base font-medium text-fg">Alterar senha</h2>
        <PasswordField
          label="Senha atual"
          value={pw.currentPassword}
          onChange={(v) => setPw((p) => ({ ...p, currentPassword: v }))}
          error={pwErrors.currentPassword}
          autoComplete="current-password"
        />
        <PasswordField
          label="Nova senha"
          value={pw.newPassword}
          onChange={(v) => setPw((p) => ({ ...p, newPassword: v }))}
          error={pwErrors.newPassword}
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirmar nova senha"
          value={pw.confirm}
          onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
          error={pwErrors.confirm}
          autoComplete="new-password"
        />
        <Button type="submit" disabled={changePassword.isPending} className="w-[131px] rounded-[3px]">
          {changePassword.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </AccountLayout>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[15px] text-fg">
        {label}
        {required && <span className="text-[#f0805f]"> *</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </label>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  autoComplete: string
}) {
  const [show, setShow] = useState(false)
  const id = `pw-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] text-fg">
        {label}
      </label>
      <span className="relative block max-w-[417px]">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldInputCls} pr-10`}
        />
        <button
          type="button"
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-fg"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  )
}
