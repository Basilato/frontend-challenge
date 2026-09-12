import { expect, type Page } from '@playwright/test'

export type ScenarioName =
  | 'default'
  | 'empty-catalog'
  | 'slow-network'
  | 'flaky-network'
  | 'offline'
  | 'coupon-expired'
  | 'price-changed-during-checkout'
  | 'order-timeout-then-recover'
  | 'payment-rejected'
  | 'wallet-connect-rejected'

type MockApi = {
  setScenario(name: ScenarioName): void
  resetDb(): void
  emitNftUpdated(id: string, patch: { priceEth?: string; available?: number }): void
  emitOrderUpdated(id: string, status: 'pending' | 'confirmed' | 'rejected'): void
}

declare global {
  interface Window {
    __mock: MockApi
    __socket?: { connected: boolean }
  }
}

/** Wait until the realtime socket has completed its handshake. */
export async function waitForSocket(page: Page) {
  await page.waitForFunction(() => window.__socket?.connected === true, null, { timeout: 15_000 })
}

/** Fresh mock db + no session + optional scenario. Call at the start of a test. */
export async function resetState(page: Page, scenario: ScenarioName = 'default') {
  await page.goto('/')
  await page.waitForFunction(() => Boolean(window.__mock), null, { timeout: 15_000 })
  await page.evaluate((s) => {
    window.__mock.resetDb()
    window.__mock.setScenario(s as ScenarioName)
    try {
      localStorage.removeItem('greenmint.session.token')
    } catch {
      /* ignore */
    }
  }, scenario)
}

export async function setScenario(page: Page, scenario: ScenarioName) {
  await page.evaluate((s) => window.__mock.setScenario(s as ScenarioName), scenario)
}

async function mockReady(page: Page) {
  await page.waitForFunction(() => Boolean(window.__mock?.emitNftUpdated), null, { timeout: 15_000 })
  await waitForSocket(page)
}

export async function emitNftUpdated(
  page: Page,
  id: string,
  patch: { priceEth?: string; available?: number },
) {
  await mockReady(page)
  await page.evaluate(({ id, patch }) => window.__mock.emitNftUpdated(id, patch), { id, patch })
}

export async function emitOrderUpdated(
  page: Page,
  id: string,
  status: 'pending' | 'confirmed' | 'rejected',
) {
  await mockReady(page)
  await page.evaluate(({ id, status }) => window.__mock.emitOrderUpdated(id, status), { id, status })
}

export async function login(page: Page, email = 'ada@greenmint.test', password = 'senha123') {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.locator('#auth-password').fill(password)
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/login') && r.ok()),
    page.getByRole('button', { name: 'Entrar' }).click(),
  ])
  await expect(page.getByRole('dialog')).toBeHidden() // modal closed = signed in
}

/** True when the desktop header user menu is present (skipped on mobile). */
export async function expectSignedIn(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /^(Ada|Bruno)/ }).or(page.getByRole('link', { name: 'Conta' }))).toBeVisible()
}

/** Add the given NFT's open ("ABERTA") edition to the cart from its detail page. */
export async function addOpenEditionToCart(page: Page, nftId: string) {
  await page.goto(`/nft/${nftId}`)
  await page.getByRole('radio', { name: 'ABERTA' }).click()
  await clickBuy(page)
  await expect(page.getByText('Adicionado ao carrinho')).toBeVisible()
}

/** Click the detail page's primary buy CTA — the desktop-only inline "COMPRAR"
 *  button, or the mobile "Comprar NFT" sticky Buy Bar that replaces it there. */
export async function clickBuy(page: Page) {
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
}

/** Click the detail page's favorite toggle — a "Favoritar"/"Favoritado" text
 *  button on desktop, or the heart icon on the hero image on mobile (the
 *  Figma mobile frame has no text favorite button, only that icon). */
export async function clickFavoriteToggle(page: Page) {
  const textButton = page.getByRole('button', { name: /^(Favoritar|Favoritado)$/ })
  if (await textButton.isVisible().catch(() => false)) {
    await textButton.click()
    return
  }
  await page.getByRole('button', { name: /^(Adicionar aos favoritos|Remover dos favoritos)$/ }).click()
}

/** Assert the detail page's favorite toggle is in the given state, on either layout. */
export async function expectFavoriteState(page: Page, favorited: boolean) {
  const textButton = page.getByRole('button', { name: favorited ? 'Favoritado' : 'Favoritar' })
  if (await textButton.isVisible().catch(() => false)) {
    await expect(textButton).toBeVisible()
    return
  }
  await expect(
    page.getByRole('button', {
      name: favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos',
    }),
  ).toBeVisible()
}

/** Fill the payment form and connect a wallet, ready to confirm. */
export async function fillCheckout(page: Page) {
  await page.goto('/pagamento')
  await page.getByRole('combobox').first().selectOption({ index: 1 }) // rede
  await page.getByRole('combobox').nth(1).selectOption({ index: 1 }) // carteira
  await page.getByRole('button', { name: 'MetaMask' }).click()
}
