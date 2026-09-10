import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => (window as unknown as { __mock?: { resetDb(): void } }).__mock?.resetDb())
})

test('catalog lists NFTs from the mock backend', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /seja dono do futuro/i })).toBeVisible()
  await expect(page.getByRole('listitem').first()).toBeVisible()
})

test('catalog state lives in the URL and survives reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Em alta' }).click()
  await expect(page).toHaveURL(/tab=trending/)
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'true')
})

test('combined filters compose in the URL and reset pagination', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'sidebar is desktop-only')
  await page.goto('/')
  await page.getByRole('button', { name: /Ethereum/ }).click()
  await expect(page).toHaveURL(/networks=.*ethereum/)
  await page.getByRole('button', { name: /Fotografia/ }).click()
  await expect(page).toHaveURL(/collections=.*Fotografia/)
  await expect(page).toHaveURL(/networks=.*ethereum/)
  await expect(page.getByRole('button', { name: /Ethereum/ })).toHaveAttribute('aria-pressed', 'true')
  // the grid actually reflects the query
  const shown = await page.locator('li a[href^="/nft/"]').count()
  expect(shown).toBeLessThan(9)
})

test('unknown route shows the not-found page', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')
  await expect(page.getByRole('heading', { name: /não encontrada/i })).toBeVisible()
})

test('mobile shows the bottom tab bar and can navigate', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'mobile only')
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Navegação' })
  await expect(nav).toBeVisible()
  await nav.getByRole('link', { name: 'Carrinho' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
})

test('desktop hides the mobile tab bar', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop only')
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Navegação' })).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
})
