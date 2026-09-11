import { expect, test } from '@playwright/test'

import { login, resetState } from './support/app'

// Scenario 4 — favorites, including a mutation failure with state recovery.

test('favoriting requires auth; toggle persists for the signed-in user', async ({ page }) => {
  await resetState(page)
  await page.goto('/nft/nft_4')
  await page.getByRole('button', { name: 'Favoritar' }).click()
  await expect(page.getByText(/Entre para salvar favoritos/i)).toBeVisible()

  await login(page)
  await page.goto('/nft/nft_4', { waitUntil: 'networkidle' })

  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/favorites/nft_4') && r.request().method() === 'PUT' && r.ok(),
    ),
    page.getByRole('button', { name: /^Favoritar$/ }).click(),
  ])
  await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible()

  await page.goto('/nft/nft_4', { waitUntil: 'networkidle' })
  await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible()
})

test('optimistic favorite rolls back when the mutation fails', async ({ page }) => {
  await resetState(page, 'favorite-write-fails')
  await login(page)
  await page.goto('/nft/nft_6', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: /^Favoritar$/ }).click()
  // optimistic flip, then rollback + error feedback
  await expect(page.getByText(/Não foi possível atualizar seus favoritos/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /^Favoritar$/ })).toBeVisible()
})
