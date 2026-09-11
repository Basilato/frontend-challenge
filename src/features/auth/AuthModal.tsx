import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { FacebookMarkIcon, GoogleIcon } from '@/components/icons'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'

import { useLogin, useRegister } from './api'

type Mode = 'login' | 'register'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})
const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome de usuário.'),
    email: z.string().email('E-mail inválido.'),
    password: z.string().min(6, 'Mínimo de 6 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

/** Shared login/register state + submit logic behind the desktop modal and the mobile full-page screen. */
function useAuthForm(mode: Mode, redirect?: string) {
  const navigate = useNavigate()
  const login = useLogin()
  const register = useRegister()

  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
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
      register.mutate(
        { name: values.name, email: values.email, password: values.password },
        { onSuccess, onError },
      )
    }
  }

  return { values, setValues, errors, showPassword, setShowPassword, pending, close, switchMode, onSubmit }
}

/**
 * Which of the two very different Figma auth layouts to render — a real
 * viewport check (not a CSS breakpoint), because the desktop version is a
 * Radix dialog: mounting it "hidden" on mobile still leaves it `open`, and
 * Radix sets the rest of the page inert while a modal is open, which would
 * block every tap on the mobile screen underneath. Only one layout ever
 * mounts at a time.
 */
function useIsDesktopViewport() {
  const query = '(min-width: 768px)'
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setIsDesktop(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

/** Entry point routes render — desktop tabbed modal vs. the mobile full-screen page. */
export function AuthScreen({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const isDesktop = useIsDesktopViewport()
  return isDesktop ? (
    <AuthModal mode={mode} redirect={redirect} />
  ) : (
    <MobileAuthScreen mode={mode} redirect={redirect} />
  )
}

/** Desktop — a tabbed modal over the dimmed Home page (Figma "Sign In/Up Modal"). */
function AuthModal({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const form = useAuthForm(mode, redirect)

  return (
    <Dialog.Root open onOpenChange={(o) => !o && form.close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/85 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex w-[min(500px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[10px] border-b-[6px] border-primary bg-surface-card"
          aria-describedby="auth-subtitle"
        >
          <div className="flex flex-col items-center gap-10 px-6 pb-2 pt-10 sm:px-12">
            <div role="tablist" aria-label="Modo de acesso" className="flex items-center gap-2 text-[20px] font-medium">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => form.switchMode('login')}
                className={cn(mode === 'login' ? 'text-text-accent' : 'text-fg')}
              >
                Entrar
              </button>
              <span className="h-5 w-px bg-[#f0805f]" />
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => form.switchMode('register')}
                className={cn(mode === 'register' ? 'text-text-accent' : 'text-fg')}
              >
                Criar conta
              </button>
            </div>
            <p id="auth-subtitle" className="text-center text-[13px] text-fg">
              {mode === 'login'
                ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
                : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
            </p>
          </div>

          <Dialog.Title className="sr-only">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Dialog.Title>

          <AuthFields
            mode={mode}
            form={form}
            inputCls={inputCls}
            gapCls="gap-3 px-6 pt-6 sm:px-20"
            submitLabel={mode === 'login' ? 'Entrar' : 'Criar conta'}
          />

          <div className="flex flex-col gap-3 px-6 pb-8 pt-6 sm:px-20">
            <SocialDivider />
            <SocialButtons />
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

/** Mobile — a dedicated full-screen page (Figma "Mobile / Login" + "Mobile / Cadastro"): no dialog, no backdrop, no header/tab bar chrome, just logo → title → form → CTA → social → switch-mode link. */
function MobileAuthScreen({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const form = useAuthForm(mode, redirect)

  return (
    <div className="flex flex-col gap-10">
      <p className="text-center text-[32px] font-bold tracking-[3.2px] text-fg">KURIO</p>
      <h1 className="text-center text-[20px] font-bold text-fg">
        {mode === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
      </h1>

      <AuthFields
        mode={mode}
        form={form}
        inputCls={mobileInputCls}
        gapCls="gap-3"
        submitLabel={mode === 'login' ? 'Entrar' : 'Criar perfil'}
      />

      <div className="flex flex-col gap-3">
        <SocialDivider />
        <SocialButtons />
      </div>

      <button type="button" onClick={() => form.switchMode(mode === 'login' ? 'register' : 'login')} className="text-[15px] text-text-secondary">
        {mode === 'login' ? 'Novo na Kurio? Crie uma conta' : 'Já tem uma conta? Entre'}
      </button>
    </div>
  )
}

type AuthForm = ReturnType<typeof useAuthForm>

/** Field list + submit CTA shared by the desktop modal and the mobile screen — only sizing/spacing differ. */
function AuthFields({
  mode,
  form,
  inputCls,
  gapCls,
  submitLabel,
}: {
  mode: Mode
  form: AuthForm
  inputCls: string
  gapCls: string
  submitLabel: string
}) {
  const passwordFieldId = mode === 'login' ? 'auth-password' : 'auth-password-register'
  return (
    <form onSubmit={form.onSubmit} className={cn('flex flex-col', gapCls)} noValidate>
      {mode === 'register' && (
        <Field label="Nome de usuário" error={form.errors.name}>
          <input
            type="text"
            autoComplete="name"
            value={form.values.name}
            onChange={(e) => form.setValues((v) => ({ ...v, name: e.target.value }))}
            className={inputCls}
          />
        </Field>
      )}
      <Field label="E-mail" error={form.errors.email}>
        <input
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          value={form.values.email}
          onChange={(e) => form.setValues((v) => ({ ...v, email: e.target.value }))}
          className={inputCls}
        />
      </Field>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={passwordFieldId} className="text-sm text-fg">
          Senha <span className="text-[#f0805f]">*</span>
        </label>
        <div className="relative">
          <input
            id={passwordFieldId}
            type={form.showPassword ? 'text' : 'password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={form.values.password}
            onChange={(e) => form.setValues((v) => ({ ...v, password: e.target.value }))}
            aria-invalid={Boolean(form.errors.password)}
            className={cn(inputCls, 'border-primary pr-10 text-md')}
          />
          <button
            type="button"
            aria-label={form.showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => form.setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-fg"
          >
            {form.showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {form.errors.password && (
          <span role="alert" className="text-xs text-destructive">
            {form.errors.password}
          </span>
        )}
      </div>

      {mode === 'register' && (
        <Field label="Confirmar senha" error={form.errors.confirmPassword}>
          <input
            type={form.showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.values.confirmPassword}
            onChange={(e) => form.setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
            aria-invalid={Boolean(form.errors.confirmPassword)}
            className={inputCls}
          />
        </Field>
      )}

      {mode === 'login' && (
        <button
          type="button"
          onClick={() => toast.info('Recuperação de senha não está disponível nesta demonstração.')}
          className="self-end text-sm text-text-accent hover:underline"
        >
          Esqueceu a senha?
        </button>
      )}
      {form.errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {form.errors.form}
        </p>
      )}

      <Button
        type="submit"
        disabled={form.pending}
        className="mt-7 h-[60px] w-full rounded-[10px] md:mt-3 md:h-11 md:rounded-[5px]"
      >
        {form.pending ? 'Aguarde…' : submitLabel}
      </Button>
    </form>
  )
}

function SocialDivider() {
  return (
    <div className="flex items-center gap-3 text-[13px] text-fg">
      <span className="h-px flex-1 bg-border" />
      Ou continue com
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function SocialButtons() {
  return (
    <>
      {(
        [
          { provider: 'Google', Icon: GoogleIcon },
          { provider: 'Facebook', Icon: FacebookMarkIcon },
        ] as const
      ).map(({ provider, Icon }) => (
        <button
          key={provider}
          type="button"
          onClick={() => toast.info(`Login com ${provider} não está disponível nesta demonstração.`)}
          className="flex h-10 items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] font-medium text-text-secondary hover:text-fg"
        >
          <Icon className="size-5 shrink-0" />
          Continuar com {provider}
        </button>
      ))}
    </>
  )
}

const inputCls =
  'h-10 w-full rounded-[5px] border border-border bg-transparent px-4 text-sm text-fg placeholder:text-secondary focus:border-primary focus:outline-none'

const mobileInputCls =
  'h-[50px] w-full rounded-[10px] border border-border bg-transparent px-4 text-sm text-fg placeholder:text-secondary focus:border-primary focus:outline-none'

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
