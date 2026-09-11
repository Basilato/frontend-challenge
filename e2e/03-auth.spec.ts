import { expect, test } from '@playwright/test'

import { login, resetState } from './support/app'

// Scenario 3 — register, login, session expiry, logout, user switch.

test.beforeEach(({ page }) => resetState(page))
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop header menu'))

test('register conflict is a field error; a valid login lands and persists', async ({ page }) => {
  await page.goto('/cadastro')
  await page.getByLabel('Nome de usuário').fill('Duplicada')
  await page.getByLabel('E-mail').fill('ada@greenmint.test')
  await page.locator('#auth-password-register').fill('senha123')
  await page.getByLabel('Confirmar senha').fill('senha123')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('alert')).toContainText(/já cadastrado/i)

  await login(page)
  await page.reload()
  await expect(page.getByRole('button', { name: /Ada/ })).toBeVisible() // survived reload
})

test('session expiry redirects to login preserving the return path', async ({ page }) => {
  await login(page)
  // wipe the server-side session while signed in
  await page.evaluate(() => window.__mock.resetDb())
  await page.goto('/carteiras')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fcarteiras/)

  await page.getByLabel('E-mail').fill('ada@greenmint.test')
  await page.locator('#auth-password').fill('senha123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/carteiras/)
})

test('logout then switch users — no data leaks between sessions', async ({ page }) => {
  await login(page, 'ada@greenmint.test')
  await page.goto('/nft/nft_2')
  await page.getByRole('button', { name: 'Favoritar' }).click()
  await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible()

  await page.getByRole('button', { name: /Ada/ }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('link', { name: /Entrar/ })).toBeVisible()

  await login(page, 'bruno@greenmint.test')
  await page.goto('/nft/nft_2')
  await expect(page.getByRole('button', { name: 'Favoritar' })).toBeVisible() // not Bruno's favorite
})
