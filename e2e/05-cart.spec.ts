import { expect, test } from '@playwright/test'

import { addOpenEditionToCart, login, resetState } from './support/app'

// Scenario 5 — quantities, removal, coupon, persistence after refresh / login.

test.beforeEach(({ page }) => resetState(page))

test('add, change quantity, coupon apply/reject, remove, reload persistence', async ({ page }) => {
  await addOpenEditionToCart(page, 'nft_5')
  await page.goto('/carrinho')

  const row = page.getByRole('listitem').filter({ hasText: 'Cosmic Bloom #005' })
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(row.getByText('2', { exact: true })).toBeVisible()

  await page.getByLabel('Código promocional').fill('GREEN10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText(/GREEN10.* aplicado/)).toBeVisible()

  await page.reload()
  await expect(page.getByRole('listitem').filter({ hasText: 'Cosmic Bloom #005' })).toBeVisible()
  await expect(page.getByText(/GREEN10.* aplicado/)).toBeVisible()

  await page.getByLabel('Remover cupom').click()
  await page.getByLabel('Código promocional').fill('WRONG')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('alert')).toContainText(/inválido/i)

  await page.getByRole('button', { name: /Remover .* do carrinho/ }).click()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('a visitor cart is preserved after signing in', async ({ page }) => {
  await addOpenEditionToCart(page, 'nft_7')
  await login(page)
  await page.goto('/carrinho')
  await expect(page.locator('li').filter({ has: page.locator('a[href="/nft/nft_7"]') })).toBeVisible()
})

test('coupon expired scenario is reported', async ({ page }) => {
  await resetState(page, 'coupon-expired')
  await addOpenEditionToCart(page, 'nft_8')
  await page.goto('/carrinho')
  await page.getByLabel('Código promocional').fill('GREEN10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('alert')).toContainText(/expirado/i)
})
