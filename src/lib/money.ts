/**
 * ETH values travel as decimal strings and must keep precision (CLAUDE.md rule 5).
 * Internally we work in wei (BigInt); we never parse an ETH amount into a JS float.
 */
const WEI_PER_ETH = 10n ** 18n

export function ethToWei(eth: string): bigint {
  const trimmed = eth.trim()
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid ETH amount: ${eth}`)
  }
  const parts = trimmed.split('.')
  const whole = parts[0] || '0'
  const frac = parts[1] ?? ''
  const fracPadded = (frac + '0'.repeat(18)).slice(0, 18)
  return BigInt(whole) * WEI_PER_ETH + BigInt(fracPadded)
}

export function weiToEth(wei: bigint): string {
  const negative = wei < 0n
  const abs = negative ? -wei : wei
  const whole = abs / WEI_PER_ETH
  const frac = (abs % WEI_PER_ETH).toString().padStart(18, '0').replace(/0+$/, '')
  return `${negative ? '-' : ''}${whole}${frac ? `.${frac}` : ''}`
}

export function addEth(...values: string[]): string {
  return weiToEth(values.reduce((sum, v) => sum + ethToWei(v), 0n))
}

export function mulEth(eth: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Quantity must be a non-negative integer: ${quantity}`)
  }
  return weiToEth(ethToWei(eth) * BigInt(quantity))
}

/** Display helper — fixed decimals for the UI, still derived from the exact wei value. */
export function formatEth(eth: string, maxDecimals = 4): string {
  const parts = weiToEth(ethToWei(eth)).split('.')
  const whole = parts[0] || '0'
  const shownFrac = (parts[1] ?? '').slice(0, maxDecimals).replace(/0+$/, '')
  return `${whole}${shownFrac ? `.${shownFrac}` : ''} ETH`
}
