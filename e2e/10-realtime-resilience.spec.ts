import { expect, test } from '@playwright/test'

import {
  addOpenEditionToCart,
  emitOrderUpdated,
  fillCheckout,
  login,
  resetState,
} from './support/app'

// Scenario 10 — duplicate / old events, disconnect, resume a pending order.

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop flow'))

test('order.updated settles the confirmation instantly; stale events are ignored', async ({
  page,
}) => {
  await resetState(page)
  await login(page)
  await addOpenEditionToCart(page, 'nft_3')
  await fillCheckout(page)
  await expect(page.getByRole('button', { name: 'Desconectar' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedido\/order_/)
  const orderId = page.url().split('/pedido/')[1]

  await emitOrderUpdated(page, orderId, 'confirmed')
  await expect(page.getByText(/agora estão na sua carteira/i)).toBeVisible()

  // an out-of-order "pending" event must not roll the UI back
  await emitOrderUpdated(page, orderId, 'pending')
  await page.waitForTimeout(500)
  await expect(page.getByText(/agora estão na sua carteira/i)).toBeVisible()
})

test('a dropped connection while an order is pending recovers on reload', async ({ page }) => {
  await resetState(page)
  await login(page)
  await addOpenEditionToCart(page, 'nft_9')
  await fillCheckout(page)
  await expect(page.getByRole('button', { name: 'Desconectar' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedido\/order_/)

  // drop the network briefly, then restore
  await page.context().setOffline(true)
  await page.waitForTimeout(300)
  await page.context().setOffline(false)

  // reload — the pending order is reconciled from REST, no duplicate purchase
  const url = page.url()
  await page.reload()
  await expect(page).toHaveURL(url)
  await expect(page.getByText(/agora estão na sua carteira/i)).toBeVisible({ timeout: 15_000 })
})
