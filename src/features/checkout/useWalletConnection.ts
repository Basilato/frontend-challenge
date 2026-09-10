import { useState } from 'react'

import { ApiError, http } from '@/lib/http'

export type WalletProvider = 'MetaMask' | 'Coinbase Wallet' | 'WalletConnect'

export interface WalletConnection {
  provider: WalletProvider
  address: string
}

/**
 * Simulated wallet connection (README: connect / reject / disconnect). No real
 * extension — the mock backend approves or refuses based on the active scenario.
 */
export function useWalletConnection() {
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [isConnecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = async (provider: WalletProvider) => {
    setConnecting(true)
    setError(null)
    try {
      const { data } = await http.post<{ address: string }>('/wallets/connect', { provider })
      setConnection({ provider, address: data.address })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível conectar a carteira.')
      setConnection(null)
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = () => {
    setConnection(null)
    setError(null)
  }

  return { connection, isConnecting, error, connect, disconnect }
}
