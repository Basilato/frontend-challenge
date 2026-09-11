import { expect, test } from '@playwright/test'

import { resetState } from './support/app'

// Scenario 1 — search, combined filters, sorting, pagination, history restoration.

test.beforeEach(({ page }) => resetState(page))

test('search + filters compose in the URL and reset pagination', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'filter sidebar is desktop-only')
  await page.goto('/#catalogo')

  await page.getByRole('button', { name: /Ethereum/ }).click()
  await expect(page).toHaveURL(/networks=.*ethereum/)

  await page.getByRole('button', { name: /Fotografia/ }).click()
  await expect(page).toHaveURL(/collections=.*Fotografia/)
  await expect(page).toHaveURL(/networks=.*ethereum/) // combinable
  await expect(page).toHaveURL(/page=1/) // pagination reset

  const shown = await page.locator('li a[href^="/nft/"]').count()
  expect(shown).toBeLessThan(9)
})

test('sorting and tabs live in the URL', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Em alta' }).click()
  await expect(page).toHaveURL(/tab=trending/)

  await page.getByRole('combobox').first().selectOption('price-asc')
  await expect(page).toHaveURL(/sort=price-asc/)
})

test('catalog state survives reload and is restored by history', async ({ page }) => {
  await page.goto('/?tab=trending&sort=price-desc')
  await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'true')

  // reload keeps everything
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'true')
  await expect(page).toHaveURL(/sort=price-desc/)

  // changing a tab pushes history; back restores the previous state
  await page.getByRole('tab', { name: 'Todos os NFTs' }).click()
  await expect(page).toHaveURL(/tab=all/)
  await page.goBack()
  await expect(page).toHaveURL(/tab=trending/)
  await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'true')
})

test('empty result set is handled', async ({ page }) => {
  await resetState(page, 'empty-catalog')
  await page.goto('/')
  await expect(page.getByText(/Nenhum NFT encontrado/i)).toBeVisible()
})
