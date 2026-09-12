import { http, HttpResponse } from 'msw'

import type { FacebookAuthRequest, GoogleOAuthRequest, LoginRequest, RegisterRequest, Session, User } from '@/contracts'

import { db, getSessionUser, getUserByEmail, persistDb } from '../db'
import { applyLatency, scenario } from '../scenario'

const API = (path: string) => `${import.meta.env.VITE_API_URL ?? '/api'}${path}`
const SESSION_TTL = 30 * 60_000

function publicUser(u: { id: string; name: string; email: string; avatar: string | null }): User {
  return { id: u.id, name: u.name, email: u.email, avatar: u.avatar }
}

function issueSession(userId: string): Session & { token: string } {
  const token = `tok_${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const expiresAt = Date.now() + SESSION_TTL
  db.sessions[token] = { userId, expiresAt }

  // Preserve the visitor's cart when they authenticate.
  const guestCart = db.carts['guest']
  if (guestCart && guestCart.items.length) {
    const userCart = (db.carts[userId] ??= {
      id: `cart_${userId}`,
      items: [],
      couponCode: null,
      updatedAt: new Date().toISOString(),
    })
    for (const item of guestCart.items) {
      const existing = userCart.items.find((i) => i.editionId === item.editionId)
      if (existing) existing.quantity += item.quantity
      else userCart.items.push({ ...item })
    }
    userCart.couponCode ??= guestCart.couponCode
    db.carts['guest'] = { ...guestCart, items: [], couponCode: null }
  }

  persistDb()
  const user = db.users.find((u) => u.id === userId)!
  return { token, user: publicUser(user), expiresAt: new Date(expiresAt).toISOString() }
}

function tokenFrom(request: Request): string | undefined {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.match(/greenmint_session=([^;]+)/)?.[1]
}

export const authHandlers = [
  http.post(API('/auth/register'), async ({ request }) => {
    await applyLatency()
    if (scenario().offline) return HttpResponse.error()
    const body = (await request.json()) as RegisterRequest
    const fields: Record<string, string> = {}
    if (!body.name?.trim()) fields.name = 'Informe seu nome.'
    if (!/^\S+@\S+\.\S+$/.test(body.email ?? '')) fields.email = 'E-mail inválido.'
    if ((body.password ?? '').length < 6) fields.password = 'Mínimo de 6 caracteres.'
    if (Object.keys(fields).length) {
      return HttpResponse.json({ message: 'Dados inválidos', fields }, { status: 422 })
    }
    if (getUserByEmail(body.email)) {
      return HttpResponse.json({ message: 'E-mail já cadastrado', code: 'email_taken' }, { status: 409 })
    }
    const id = `user_${Math.random().toString(36).slice(2, 8)}`
    db.users.push({ id, name: body.name.trim(), email: body.email, password: body.password, avatar: null })
    // New accounts start with a default Ethereum wallet already registered,
    // so checkout has somewhere to pay from without a trip to /carteiras first.
    db.wallets[id] = [
      {
        id: `${id}_w_primary`,
        role: 'primary',
        label: 'Carteira principal',
        address: `0x${id.replace(/[^a-f0-9]/gi, '0').padEnd(40, '0').slice(0, 40)}`,
        networks: ['ethereum'],
      },
    ]
    const session = issueSession(id)
    return HttpResponse.json(session, {
      status: 201,
      headers: { 'set-cookie': `greenmint_session=${session.token}; Path=/; SameSite=Lax` },
    })
  }),

  http.post(API('/auth/login'), async ({ request }) => {
    await applyLatency()
    if (scenario().offline) return HttpResponse.error()
    const body = (await request.json()) as LoginRequest
    const user = getUserByEmail(body.email ?? '')
    if (!user || user.password !== body.password) {
      return HttpResponse.json({ message: 'Credenciais inválidas' }, { status: 401 })
    }
    const session = issueSession(user.id)
    return HttpResponse.json(session, {
      headers: { 'set-cookie': `greenmint_session=${session.token}; Path=/; SameSite=Lax` },
    })
  }),

  http.post(API('/auth/google'), async ({ request }) => {
    await applyLatency()
    if (scenario().offline) return HttpResponse.error()
    const body = (await request.json()) as GoogleOAuthRequest
    const fields: Record<string, string> = {}
    if (!body.credential?.trim()) fields.credential = 'Credencial do Google não informada.'
    if (!body.clientId?.trim()) fields.clientId = 'Client ID não informado.'
    if (Object.keys(fields).length) {
      return HttpResponse.json({ message: 'Dados inválidos', fields }, { status: 422 })
    }
    const parts = body.credential.split('.')
    if (parts.length !== 3) {
      return HttpResponse.json(
        { message: 'Formato de credencial inválido.' },
        { status: 422 },
      )
    }
    let payload: { email?: string; name?: string; picture?: string; email_verified?: boolean }
    try {
      const base64 = (parts[1] as string).replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
      const decoded = atob(padded)
      payload = JSON.parse(decoded)
    } catch {
      return HttpResponse.json(
        { message: 'Não foi possível decodificar a credencial do Google.' },
        { status: 422 },
      )
    }
    if (!payload.email || !payload.email_verified) {
      return HttpResponse.json(
        { message: 'O Google não retornou um e-mail verificado.' },
        { status: 422 },
      )
    }
    const email = payload.email.trim()
    const name = (payload.name ?? (email.split('@')[0] ?? 'user')).trim()
    const avatar = payload.picture?.trim() ?? null
    let user = getUserByEmail(email)
    if (!user) {
      const id = `user_${Math.random().toString(36).slice(2, 8)}`
      user = { id, name, email, password: `oauth::google::${Math.random().toString(36).slice(2)}`, avatar }
      db.users.push(user)
      db.wallets[id] = []
      persistDb()
    } else if (avatar && !user.avatar) {
      user.avatar = avatar
      persistDb()
    }
    const session = issueSession(user.id)
    return HttpResponse.json(session, {
      status: 200,
      headers: { 'set-cookie': `greenmint_session=${session.token}; Path=/; SameSite=Lax` },
    })
  }),

  http.post(API('/auth/facebook'), async ({ request }) => {
    await applyLatency()
    if (scenario().offline) return HttpResponse.error()
    const body = (await request.json()) as FacebookAuthRequest
    const fields: Record<string, string> = {}
    if (!body.accessToken?.trim()) fields.accessToken = 'Access Token do Facebook não informado.'
    if (!body.appId?.trim()) fields.appId = 'App ID não informado.'
    if (Object.keys(fields).length) {
      return HttpResponse.json({ message: 'Dados inválidos', fields }, { status: 422 })
    }
    let profile: { id?: string; email?: string; name?: string; picture?: { data?: { url?: string } } }
    try {
      const params = new URLSearchParams({
        input_token: body.accessToken,
        access_token: `${body.appId}|debug_token_fallback`,
      })
      void params
      const parts = body.accessToken.split('|')
      if (parts.length >= 3) {
        const maybePayload = parts[2]
        try {
          const base64 = (maybePayload ?? '').replace(/-/g, '+').replace(/_/g, '/')
          const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
          const decoded = atob(padded)
          profile = JSON.parse(decoded)
        } catch {
          profile = {}
        }
      } else {
        profile = {
          id: `fb_${body.accessToken.slice(-8)}`,
          email: `fb_user_${body.accessToken.slice(-6)}@facebook.com`,
          name: `Usuário ${body.accessToken.slice(-4)}`,
          picture: { data: { url: null as unknown as string } },
        }
      }
    } catch {
      return HttpResponse.json(
        { message: 'Não foi possível validar o Access Token do Facebook.' },
        { status: 422 },
      )
    }
    const email = (profile.email ?? `fb_${profile.id ?? body.accessToken.slice(-8)}@facebook.com`).trim()
    const name = (profile.name ?? email.split('@')[0] ?? 'Usuário Facebook').trim()
    const avatar = profile.picture?.data?.url?.trim() ?? null
    let user = getUserByEmail(email)
    if (!user) {
      const id = `user_${Math.random().toString(36).slice(2, 8)}`
      user = { id, name, email, password: `oauth::facebook::${Math.random().toString(36).slice(2)}`, avatar }
      db.users.push(user)
      db.wallets[id] = []
      persistDb()
    } else if (avatar && !user.avatar) {
      user.avatar = avatar
      persistDb()
    }
    const session = issueSession(user.id)
    return HttpResponse.json(session, {
      status: 200,
      headers: { 'set-cookie': `greenmint_session=${session.token}; Path=/; SameSite=Lax` },
    })
  }),

  http.get(API('/auth/session'), async ({ request }) => {
    await applyLatency()
    const user = getSessionUser(tokenFrom(request))
    if (!user) return HttpResponse.json({ message: 'Sessão inválida' }, { status: 401 })
    const token = tokenFrom(request)!
    return HttpResponse.json({
      user: publicUser(user),
      expiresAt: new Date(db.sessions[token]!.expiresAt).toISOString(),
    } satisfies Session)
  }),

  http.post(API('/auth/logout'), async ({ request }) => {
    const token = tokenFrom(request)
    if (token) delete db.sessions[token]
    persistDb()
    return HttpResponse.json(
      { ok: true },
      { headers: { 'set-cookie': 'greenmint_session=; Path=/; Max-Age=0' } },
    )
  }),
]

export { tokenFrom, publicUser }
