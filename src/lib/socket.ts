import { io, type Socket } from 'socket.io-client'

/**
 * Real socket.io-client. Realtime scenarios MUST exercise this client
 * (CLAUDE.md rule 2) — never simulate events by poking the cache directly.
 * In dev/demo the connection is intercepted by MSW's socket.io binding.
 */
export interface SocketAuth {
  userId: string
  token?: string
}

let socket: Socket | null = null

export function connectSocket(auth: SocketAuth): Socket {
  disconnectSocket()
  socket = io(import.meta.env.VITE_WS_URL ?? '/', {
    path: '/socket.io',
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    auth,
  })
  // The mock reads identity from an event, not the handshake auth.
  socket.on('connect', () => socket?.emit('identify', { userId: auth.userId }))
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    ;(window as unknown as { __socket?: Socket }).__socket = socket
  }
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

/** Emit now if connected, otherwise once the socket connects (and on reconnect). */
export function emitWhenConnected(event: string, ...args: unknown[]): () => void {
  const send = () => socket?.emit(event, ...args)
  if (socket?.connected) send()
  socket?.on('connect', send)
  return () => socket?.off('connect', send)
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}
