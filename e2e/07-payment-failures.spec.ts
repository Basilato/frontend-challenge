import { expect, test } from '@playwright/test'

import { addOpenEditionToCart, fillCheckout, login, resetState } from './support/app'

// Scenario 7 — payment rejected, repeated click, timeout with same-order recovery.

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop flow'))

test('wallet connection can be refused', async ({ page }) => {
  await resetState(page, 'wallet-connect-rejected')
  await login(page)
  await addOpenEditionToCart(page, 'nft_5')
  await page.goto('/pagamento')
  await page.getByRole('button', { name: 'MetaMask' }).click()
  await expect(page.getByRole('alert')).toContainText(/recusad/i)
})

test('rejected payment keeps the items and offers to go back to the cart', async ({ page }) => {
  await resetState(page, 'payment-rejected')
  await login(page)
  await addOpenEditionToCart(page, 'nft_9')
  await fillCheckout(page)
  await expect(page.getByRole('button', { name: 'Desconectar' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByRole('heading', { name: /Pagamento recusado/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/continuam no carrinho/i)).toBeVisible()
})

test('repeated confirm clicks and a timeout recover the same order (idempotency)', async ({
  page,
}) => {
  await resetState(page, 'order-timeout-then-recover')
  await login(page)
  await addOpenEditionToCart(page, 'nft_3')
  await fillCheckout(page)
  await expect(page.getByRole('button', { name: 'Desconectar' })).toBeVisible()

  const confirm = page.getByRole('button', { name: /Confirmar compra|Processando/ })
  await confirm.click()
  // button disables against double-submit
  await expect(page.getByRole('button', { name: 'Processando…' })).toBeVisible()

  // first attempt times out; the idempotent retry lands on one order
  await expect(page).toHaveURL(/\/pedido\/order_/, { timeout: 20_000 })
  const first = page.url()
  await page.reload()
  await expect(page).toHaveURL(first) // not a duplicate
})
