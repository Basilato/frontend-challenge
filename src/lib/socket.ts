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
    auth,
  })
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}
