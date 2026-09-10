import { http, HttpResponse } from 'msw'

import type { LoginRequest, RegisterRequest, Session, User } from '@/contracts'

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
    db.wallets[id] = []
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
