import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { FacebookMarkIcon, GoogleIcon } from '@/components/icons'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'
import { useIsDesktopViewport } from '@/lib/viewport'

import { useLogin, useRegister, useGoogleOAuth, useFacebookAuth } from './api'

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
  const googleOAuth = useGoogleOAuth()
  const facebookAuth = useFacebookAuth()

  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const pending = login.isPending || register.isPending

  const close = () => navigate({ to: '/' })
  const switchMode = (next: Mode) => {
    setErrors({})
    navigate({ to: next === 'login' ? '/login' : '/cadastro', search: redirect ? { redirect } : undefined })
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
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const schema = mode === 'login' ? loginSchema : registerSchema
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])))
      return
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

  const googlePending = googleOAuth.isPending
  const onGoogleAuth = (credential: string, clientId: string) => {
    setErrors({})
    googleOAuth.mutate(
      { credential, clientId },
      {
        onSuccess: () => {
          toast.success('Bem-vindo!')
          navigate({ to: redirect ?? '/' })
        },
        onError: (error) => {
          if (error instanceof ApiError && error.fields) setErrors(error.fields)
          else if (error instanceof ApiError) setErrors({ form: error.message })
          else setErrors({ form: 'Não foi possível continuar com o Google. Tente novamente.' })
        },
      },
    )
  }

  const facebookPending = facebookAuth.isPending
  const onFacebookAuth = (accessToken: string, appId: string) => {
    setErrors({})
    facebookAuth.mutate(
      { accessToken, appId },
      {
        onSuccess: () => {
          toast.success('Bem-vindo!')
          navigate({ to: redirect ?? '/' })
        },
        onError: (error) => {
          if (error instanceof ApiError && error.fields) setErrors(error.fields)
          else if (error instanceof ApiError) setErrors({ form: error.message })
          else setErrors({ form: 'Não foi possível continuar com o Facebook. Tente novamente.' })
        },
      },
    )
  }

  return {
    values,
    setValues,
    errors,
    showPassword,
    setShowPassword,
    pending,
    close,
    switchMode,
    onSubmit,
    googlePending,
    onGoogleAuth,
    facebookPending,
    onFacebookAuth,
  }
}

/**
 * Which of the two very different Figma auth layouts to render — see
 * useIsDesktopViewport for why this can't just be two CSS-toggled variants.
 */
/** Entry point routes render — desktop tabbed modal vs. the mobile full-screen page. */
export function AuthScreen({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const isDesktop = useIsDesktopViewport('(min-width: 768px)')
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
            <SocialButtons googlePending={form.googlePending} facebookPending={form.facebookPending} onGoogleAuth={form.onGoogleAuth} onFacebookAuth={form.onFacebookAuth} />
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
        <SocialButtons googlePending={form.googlePending} facebookPending={form.facebookPending} onGoogleAuth={form.onGoogleAuth} onFacebookAuth={form.onFacebookAuth} />
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

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string; clientId: string }) => void
            auto_select?: boolean
            use_fedcm_for_prompt?: boolean
          }) => void
          prompt: (
            callback?: (notification: { isSkippedMoment?: () => boolean; isNotDisplayed?: () => boolean }) => void,
          ) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              logo_alignment?: 'left' | 'center'
              width?: string | number
              locale?: string
              click_listener?: () => void
            },
          ) => void
        }
      }
    }
    FB?: {
      init: (config: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }) => void
      login: (
        callback: (response: {
          status: 'connected' | 'not_authorized' | 'unknown'
          authResponse?: { accessToken?: string; userID?: string; expiresIn?: number }
        }) => void,
        options?: { scope: string; return_scopes?: boolean; enable_profile_selector?: boolean; auth_type?: string },
      ) => void
      logout: (callback?: () => void) => void
      api: <T = unknown>(path: string, callback: (response: T) => void) => void
      getLoginStatus: (
        callback: (response: {
          status: 'connected' | 'not_authorized' | 'unknown'
          authResponse?: { accessToken?: string }
        }) => void,
        force?: boolean,
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined

let googleScriptPromise: Promise<void> | null = null
function loadGoogleSdk(): Promise<void> {
  if (googleScriptPromise) return googleScriptPromise
  googleScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'))
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-gsi]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google SDK')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.setAttribute('data-google-gsi', 'true')
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google SDK'))
    document.head.appendChild(script)
  })
  return googleScriptPromise
}

let facebookScriptPromise: Promise<void> | null = null
function loadFacebookSdk(): Promise<void> {
  if (facebookScriptPromise) return facebookScriptPromise
  facebookScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'))
    if (window.FB) return resolve()
    if (window.fbAsyncInit) {
      window.fbAsyncInit = () => {
        try {
          window.fbAsyncInit?.()
        } catch {
          // noop
        }
        if (window.FB) resolve()
        else reject(new Error('Failed to initialize Facebook SDK'))
      }
      return
    }
    window.fbAsyncInit = () => {
      if (!window.FB) return
      try {
        window.FB.init({
          appId: FACEBOOK_APP_ID ?? '',
          cookie: true,
          xfbml: true,
          version: 'v23.0',
        })
      } catch {
        // noop
      }
      resolve()
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-facebook-sdk]')
    if (existing) {
      existing.addEventListener('load', () => {
        const guard = window.setInterval(() => {
          if (window.FB) {
            window.clearInterval(guard)
            resolve()
          }
        }, 50)
        window.setTimeout(() => {
          window.clearInterval(guard)
          if (!window.FB) reject(new Error('Facebook SDK load timeout'))
        }, 10000)
      })
      existing.addEventListener('error', () => reject(new Error('Failed to load Facebook SDK')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js'
    script.async = true
    script.defer = true
    script.setAttribute('data-facebook-sdk', 'true')
    script.setAttribute('crossorigin', 'anonymous')
    script.onload = () => {
      const guard = window.setInterval(() => {
        if (window.FB) {
          window.clearInterval(guard)
          resolve()
        }
      }, 50)
      window.setTimeout(() => {
        window.clearInterval(guard)
        if (!window.FB) reject(new Error('Facebook SDK load timeout'))
      }, 10000)
    }
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'))
    document.head.appendChild(script)
  })
  return facebookScriptPromise
}

interface SocialButtonsProps {
  googlePending: boolean
  facebookPending: boolean
  onGoogleAuth: (credential: string, clientId: string) => void
  onFacebookAuth: (accessToken: string, appId: string) => void
}

function SocialButtons({ googlePending, facebookPending, onGoogleAuth, onFacebookAuth }: SocialButtonsProps) {
  const googleInitializedRef = useRef(false)
  const googleFallbackBtnRef = useRef<HTMLDivElement | null>(null)
  const promptTimeoutRef = useRef<number | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [facebookLoading, setFacebookLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!GOOGLE_CLIENT_ID) return
    const ensureRenderedFallback = () => {
      if (!window.google?.accounts?.id) return false
      if (!googleFallbackBtnRef.current) return false
      googleFallbackBtnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleFallbackBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        locale: 'pt-BR',
      })
      return true
    }
    loadGoogleSdk()
      .then(() => {
        if (cancelled || googleInitializedRef.current || !window.google?.accounts?.id) return
        googleInitializedRef.current = true
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID!,
          callback: (response) => {
            if (promptTimeoutRef.current) {
              window.clearTimeout(promptTimeoutRef.current)
              promptTimeoutRef.current = null
            }
            setGoogleLoading(false)
            onGoogleAuth(response.credential, response.clientId ?? GOOGLE_CLIENT_ID!)
          },
          auto_select: false,
          use_fedcm_for_prompt: true,
        })
        ensureRenderedFallback()
      })
      .catch(() => {
        // silently ignore — button click will show a fallback toast
      })
    return () => {
      cancelled = true
      if (promptTimeoutRef.current) {
        window.clearTimeout(promptTimeoutRef.current)
        promptTimeoutRef.current = null
      }
    }
  }, [onGoogleAuth])

  const clearPromptTimeout = () => {
    if (promptTimeoutRef.current) {
      window.clearTimeout(promptTimeoutRef.current)
      promptTimeoutRef.current = null
    }
  }

  const triggerFallbackPopup = () => {
    const fallbackBtn = googleFallbackBtnRef.current?.querySelector('div[role="button"], iframe') as HTMLElement | null
    if (fallbackBtn) {
      fallbackBtn.click()
    } else {
      setGoogleLoading(false)
      toast.error(
        'O seletor de contas do Google não abriu. Verifique se o domínio está autorizado no Google Cloud Console.',
      )
    }
  }

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.info('Google OAuth não configurado neste ambiente. Configure VITE_GOOGLE_CLIENT_ID.')
      return
    }
    const run = () => {
      if (!window.google?.accounts?.id) {
        setGoogleLoading(false)
        toast.error('Não foi possível carregar o login do Google.')
        return
      }
      if (!googleInitializedRef.current) {
        googleInitializedRef.current = true
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID!,
          callback: (response) => {
            clearPromptTimeout()
            setGoogleLoading(false)
            onGoogleAuth(response.credential, response.clientId ?? GOOGLE_CLIENT_ID!)
          },
          auto_select: false,
          use_fedcm_for_prompt: true,
        })
      }
      setGoogleLoading(true)
      clearPromptTimeout()
      promptTimeoutRef.current = window.setTimeout(() => {
        promptTimeoutRef.current = null
        setGoogleLoading(false)
        triggerFallbackPopup()
      }, 3000)
      window.google.accounts.id.prompt((notification) => {
        if (notification?.isSkippedMoment?.() || notification?.isNotDisplayed?.()) {
          clearPromptTimeout()
          setGoogleLoading(false)
          triggerFallbackPopup()
        }
      })
    }
    if (window.google?.accounts?.id) {
      run()
    } else {
      setGoogleLoading(true)
      loadGoogleSdk()
        .then(run)
        .catch(() => {
          setGoogleLoading(false)
          toast.error('Não foi possível carregar o login do Google.')
        })
    }
  }

  const googleBusy = googlePending || googleLoading

  const handleFacebookClick = () => {
    if (!FACEBOOK_APP_ID) {
      toast.info('Facebook OAuth não configurado neste ambiente. Configure VITE_FACEBOOK_APP_ID.')
      return
    }
    const run = () => {
      if (!window.FB) {
        setFacebookLoading(false)
        toast.error('Não foi possível carregar o login do Facebook.')
        return
      }
      setFacebookLoading(true)
      window.FB.login(
        (response) => {
          setFacebookLoading(false)
          if (response.status === 'connected' && response.authResponse?.accessToken) {
            onFacebookAuth(response.authResponse.accessToken, FACEBOOK_APP_ID!)
          } else {
            toast.error('Login com Facebook cancelado ou não autorizado.')
          }
        },
        { scope: 'public_profile,email', return_scopes: true },
      )
    }
    if (window.FB) {
      run()
    } else {
      setFacebookLoading(true)
      loadFacebookSdk()
        .then(run)
        .catch(() => {
          setFacebookLoading(false)
          toast.error('Não foi possível carregar o login do Facebook.')
        })
    }
  }

  const facebookBusy = facebookPending || facebookLoading

  return (
    <>
      <div ref={googleFallbackBtnRef} className="pointer-events-none absolute -z-10 h-0 w-0 overflow-hidden opacity-0" aria-hidden="true" />
      {(
        [
          { provider: 'Google', Icon: GoogleIcon, onClick: handleGoogleClick, loading: googleBusy },
          {
            provider: 'Facebook',
            Icon: FacebookMarkIcon,
            onClick: handleFacebookClick,
            loading: facebookBusy,
          },
        ] as const
      ).map(({ provider, Icon, onClick, loading }) => (
        <button
          key={provider}
          type="button"
          onClick={onClick}
          disabled={loading}
          className="flex h-10 items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] font-medium text-text-secondary hover:text-fg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon className="size-5 shrink-0" />
          {loading ? 'Aguarde…' : `Continuar com ${provider}`}
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
