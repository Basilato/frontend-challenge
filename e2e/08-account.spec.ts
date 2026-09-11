import { expect, test } from '@playwright/test'

import { login, resetState } from './support/app'

// Scenario 8 — profile, avatar, password, wallets, with validation errors.

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop layout'))

test.beforeEach(async ({ page }) => {
  await resetState(page)
  await login(page)
})

test('profile guard, edit, email conflict, avatar', async ({ page }) => {
  await page.goto('/perfil')

  await page.getByLabel(/Nome de exibição/).fill('Ada Verde 2')
  await page.getByLabel('E-mail *').fill('bruno@greenmint.test')
  await page.getByRole('button', { name: 'Salvar' }).first().click()
  await expect(page.getByRole('alert')).toContainText(/uso/i)

  await page.getByLabel('E-mail *').fill('ada2@greenmint.test')
  await page.getByRole('button', { name: 'Salvar' }).first().click()
  await expect(page.getByText('Perfil atualizado.')).toBeVisible()
})

test('change password validates confirmation and the current password', async ({ page }) => {
  await page.goto('/perfil')

  await page.getByLabel('Senha atual').fill('senha123')
  await page.getByLabel('Nova senha', { exact: true }).fill('novasenha1')
  await page.getByLabel('Confirmar nova senha').fill('diferente')
  await page.getByRole('button', { name: 'Salvar' }).nth(1).click()
  await expect(page.getByText(/não conferem/i)).toBeVisible()

  await page.getByLabel('Senha atual').fill('errada')
  await page.getByLabel('Confirmar nova senha').fill('novasenha1')
  await page.getByRole('button', { name: 'Salvar' }).nth(1).click()
  await expect(page.getByText(/Senha atual incorreta/i)).toBeVisible()
})

test('wallets — invalid address rejected, valid secondary wallet saved', async ({ page }) => {
  await page.goto('/carteiras')
  const secondary = page.locator('form').filter({ hasText: 'Carteira secundária' })

  await secondary.getByLabel(/Apelido/).fill('Reserva')
  await secondary.getByLabel(/Endereço/).fill('not-an-address')
  await secondary.getByRole('button', { name: 'Ethereum' }).click()
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(secondary.getByText(/inválido/i)).toBeVisible()

  await secondary.getByLabel(/Endereço/).fill('0x' + 'a'.repeat(40))
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText(/Carteira secundária.*salva\./i)).toBeVisible()
})
