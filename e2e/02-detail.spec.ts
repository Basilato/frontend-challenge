import { expect, test } from '@playwright/test'

import { resetState } from './support/app'

// Scenario 2 — direct access to a detail URL, unknown resource.

test.beforeEach(({ page }) => resetState(page))

test('direct access to a detail URL renders (SPA + loader)', async ({ page }) => {
  await page.goto('/nft/nft_3')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('Edição:')).toBeVisible()
})

test('unknown NFT id shows the not-found state, not a crash', async ({ page }) => {
  await page.goto('/nft/does-not-exist')
  await expect(page.getByRole('heading', { name: /não encontrado/i })).toBeVisible()
  await page.getByRole('link', { name: /Voltar ao catálogo/i }).click()
  await expect(page).toHaveURL(/\/(\?|$)/)
})

test('unknown route shows the router not-found page', async ({ page }) => {
  await page.goto('/rota-inexistente')
  await expect(page.getByRole('heading', { name: /não encontrada/i })).toBeVisible()
})
