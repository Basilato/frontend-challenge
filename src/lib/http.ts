import axios, { AxiosError, type AxiosInstance } from 'axios'

/**
 * Single Axios instance. Every REST call goes through here (CLAUDE.md).
 * MSW intercepts at the network layer, so there is no mock branch in this file.
 */
export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  // Arrays as repeated keys (`collections=a&collections=b`) so the MSW handlers
  // can read them with `searchParams.getAll(...)`. Must match on both sides.
  paramsSerializer: { indexes: null },
})

export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'transient'
  | 'timeout'
  | 'network'
  | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly fields?: Record<string, string>
  readonly payload?: unknown

  constructor(
    kind: ApiErrorKind,
    message: string,
    opts: { status?: number; fields?: Record<string, string>; payload?: unknown } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = opts.status
    this.fields = opts.fields
    this.payload = opts.payload
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') return new ApiError('timeout', 'A requisição expirou.')
    const status = error.response?.status
    const data = error.response?.data as { message?: string; fields?: Record<string, string> } | undefined
    const message = data?.message ?? error.message
    switch (status) {
      case 400:
      case 422:
        return new ApiError('validation', message, { status, fields: data?.fields, payload: data })
      case 401:
        return new ApiError('unauthorized', message, { status })
      case 403:
        return new ApiError('forbidden', message, { status })
      case 404:
        return new ApiError('not-found', message, { status })
      case 409:
        return new ApiError('conflict', message, { status, fields: data?.fields, payload: data })
      default:
        if (status && status >= 500) return new ApiError('transient', message, { status })
        if (!error.response) return new ApiError('network', 'Sem conexão com o servidor.')
        return new ApiError('unknown', message, { status })
    }
  }
  return new ApiError('unknown', error instanceof Error ? error.message : 'Erro desconhecido.')
}

/**
 * Session token. The mock backend also sets a cookie, but service-worker
 * responses don't reliably persist cookies across reloads, so we keep the token
 * in localStorage and send it as a Bearer header.
 */
const TOKEN_KEY = 'greenmint.session.token'

export function setSessionToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

http.interceptors.request.use((config) => {
  const token = getSessionToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)

/** Listeners (e.g. the auth store) subscribe to 401s to trigger session-expiry handling. */
const unauthorizedListeners = new Set<() => void>()

export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

http.interceptors.response.use(undefined, (error) => {
  if (error instanceof ApiError && error.kind === 'unauthorized') {
    setSessionToken(null)
    unauthorizedListeners.forEach((l) => l())
  }
  return Promise.reject(error)
})
