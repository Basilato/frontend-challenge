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

test('/favoritos is a guarded route that returns here after login', async ({ page }) => {
  await resetState(page)
  await page.goto('/favoritos')
  await expect(page).toHaveURL(/\/login\?redirect=%2Ffavoritos/)

  await page.getByLabel('E-mail').fill('ada@greenmint.test')
  await page.locator('#auth-password').fill('senha123')
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/login') && r.ok()),
    page.getByRole('button', { name: 'Entrar' }).click(),
  ])
  await expect(page).toHaveURL(/\/favoritos$/)
})

test('favorites list shows favorited NFTs and removing one drops it from the list', async ({
  page,
}) => {
  await resetState(page)
  await login(page)

  await page.goto('/nft/nft_4', { waitUntil: 'networkidle' })
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/favorites/nft_4') && r.request().method() === 'PUT' && r.ok(),
    ),
    page.getByRole('button', { name: /^Favoritar$/ }).click(),
  ])

  await page.goto('/favoritos', { waitUntil: 'networkidle' })
  await expect(page.locator('main ul li')).toHaveCount(1)

  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/favorites/nft_4') && r.request().method() === 'DELETE' && r.ok(),
    ),
    page.getByRole('button', { name: /Remover .+ da lista de interesse/ }).click(),
  ])
  await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
})
