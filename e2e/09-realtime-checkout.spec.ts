import { expect, test } from '@playwright/test'

import {
  addOpenEditionToCart,
  emitNftUpdated,
  fillCheckout,
  login,
  resetState,
  waitForSocket,
} from './support/app'

// Scenario 9 — price / availability change via Socket.IO during checkout.

test.beforeEach(({}, testInfo) =>
  test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop flow'),
)

test('an nft.updated for a cart item warns the collector', async ({ page }) => {
  await resetState(page)
  await login(page)
  await addOpenEditionToCart(page, 'nft_5')

  await page.goto('/carrinho')
  await expect(page.getByRole('listitem').filter({ hasText: 'Cosmic Bloom #005' })).toBeVisible()
  await waitForSocket(page)

  await emitNftUpdated(page, 'nft_5', { priceEth: '12.00' })
  await expect(page.getByText('Um item do seu carrinho mudou')).toBeVisible({ timeout: 15_000 })
})

test('a stale quote blocks confirmation until the collector re-confirms', async ({ page }) => {
  await resetState(page, 'price-changed-during-checkout')
  await login(page)
  await addOpenEditionToCart(page, 'nft_6')
  await fillCheckout(page)
  await expect(page.getByRole('button', { name: 'Desconectar' })).toBeVisible()

  // the scenario pushes an nft.updated ~2.5s after the checkout mounts
  await expect(page.getByText('Um item do seu carrinho mudou')).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText(/valor da sua compra mudou/i)).toBeVisible()
  await expect(page).not.toHaveURL(/\/pedido\//)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedido\/order_/)
})
