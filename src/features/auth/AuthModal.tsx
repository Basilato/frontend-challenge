import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'

import { useLogin, useRegister } from './api'

type Mode = 'login' | 'register'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Mínimo de 6 caracteres.'),
})

export function AuthModal({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const navigate = useNavigate()
  const login = useLogin()
  const register = useRegister()

  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const pending = login.isPending || register.isPending

  const close = () => navigate({ to: '/' })
  const switchMode = (next: Mode) => {
    setErrors({})
    navigate({ to: next === 'login' ? '/login' : '/cadastro', search: redirect ? { redirect } : undefined })
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const schema = mode === 'login' ? loginSchema : registerSchema
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])))
      return
    }
    const onError = (error: unknown) => {
      if (error instanceof ApiError && error.fields) setErrors(error.fields)
      else if (error instanceof ApiError && error.kind === 'conflict')
        setErrors({ email: 'E-mail já cadastrado.' })
      else if (error instanceof ApiError && error.kind === 'unauthorized')
        setErrors({ form: 'E-mail ou senha incorretos.' })
      else setErrors({ form: 'Não foi possível continuar. Tente novamente.' })
    }
    const onSuccess = () => {
      toast.success(mode === 'login' ? 'Bem-vindo de volta!' : 'Conta criada!')
      navigate({ to: redirect ?? '/' })
    }
    if (mode === 'login') {
      login.mutate({ email: values.email, password: values.password }, { onSuccess, onError })
    } else {
      register.mutate(values, { onSuccess, onError })
    }
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/85 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex w-[min(500px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[10px] border-b-[6px] border-primary bg-surface-card"
          aria-describedby="auth-subtitle"
        >
          <div className="flex flex-col items-center gap-6 px-6 pb-2 pt-10 sm:px-12">
            <div role="tablist" aria-label="Modo de acesso" className="flex items-center gap-3 text-xl">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => switchMode('login')}
                className={cn(mode === 'login' ? 'font-medium text-text-accent' : 'text-text-secondary')}
              >
                Entrar
              </button>
              <span className="h-5 w-px bg-[#f0805f]" />
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => switchMode('register')}
                className={cn(mode === 'register' ? 'font-medium text-text-accent' : 'text-text-secondary')}
              >
                Criar conta
              </button>
            </div>
            <p id="auth-subtitle" className="text-center text-[13px] text-fg">
              {mode === 'login'
                ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
                : 'Crie sua conta para colecionar, favoritar e finalizar compras.'}
            </p>
          </div>

          <Dialog.Title className="sr-only">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Dialog.Title>

          <form onSubmit={onSubmit} className="flex flex-col gap-3 px-6 pt-6 sm:px-20" noValidate>
            {mode === 'register' && (
              <Field label="Nome" error={errors.name}>
                <input
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            )}
            <Field label="E-mail" error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                placeholder="contato@email.com"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-sm text-fg">
                Senha <span className="text-[#f0805f]">*</span>
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={values.password}
                  onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
                  aria-invalid={Boolean(errors.password)}
                  className={cn(inputCls, 'border-primary pr-10')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-fg"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <span role="alert" className="text-xs text-destructive">
                  {errors.password}
                </span>
              )}
            </div>

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => toast.info('Recuperação de senha não está disponível nesta demonstração.')}
                className="self-end text-sm text-text-accent hover:underline"
              >
                Esqueceu a senha?
              </button>
            )}
            {errors.form && (
              <p role="alert" className="text-sm text-destructive">
                {errors.form}
              </p>
            )}

            <Button type="submit" disabled={pending} className="mt-3 h-11 w-full rounded-[5px]">
              {pending ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <div className="flex flex-col gap-3 px-6 pb-8 pt-6 sm:px-20">
            <div className="flex items-center gap-3 text-[13px] text-fg">
              <span className="h-px flex-1 bg-border" />
              Ou continue com
              <span className="h-px flex-1 bg-border" />
            </div>
            {(['Google', 'Facebook'] as const).map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => toast.info(`Login com ${provider} não está disponível nesta demonstração.`)}
                className="flex h-10 items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] font-medium text-text-secondary hover:text-fg"
              >
                Continuar com {provider}
              </button>
            ))}
          </div>

          <Dialog.Close
            aria-label="Fechar"
            className="absolute right-4 top-4 text-text-secondary hover:text-fg"
          >
            <X className="size-[18px]" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const inputCls =
  'h-10 w-full rounded-[5px] border border-border bg-transparent px-4 text-sm text-fg placeholder:text-secondary focus:border-primary focus:outline-none'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-fg">
        {label} <span className="text-[#f0805f]">*</span>
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
