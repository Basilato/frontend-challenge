import { expect, test } from '@playwright/test'

import { fillCheckout, login, resetState } from './support/app'

// Scenario 6 — full purchase from catalog to a confirmed receipt.

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop flow'))

test('catalog → cart → checkout → confirmed receipt (survives reload)', async ({ page }) => {
  await resetState(page)
  await login(page)

  await page.goto('/')
  await page.locator('li a[href^="/nft/"]').first().click()
  await page.getByRole('radio', { name: 'ABERTA' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page.getByText('Adicionado ao carrinho')).toBeVisible()

  await page.goto('/carrinho')
  await page.getByRole('button', { name: /Revisar e finalizar|Conectar e finalizar/ }).click()

  await fillCheckout(page)
  await expect(page.getByRole('button', { name: 'Desconectar' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page).toHaveURL(/\/pedido\/order_/)
  await expect(page.getByText(/agora estão na sua carteira/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/Detalhes da transação/i)).toBeVisible()
  await expect(page.getByText(/ID da transação/i)).toBeVisible()

  // the receipt is a snapshot — it survives a reload
  const url = page.url()
  await page.reload()
  await expect(page).toHaveURL(url)
  await expect(page.getByText(/agora estão na sua carteira/i)).toBeVisible()

  // cart is emptied
  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})
