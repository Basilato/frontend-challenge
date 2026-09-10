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
  await page.getByRole('button', { name: 'Em alta' }).click()
  await expect(page).toHaveURL(/tab=trending/)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Em alta' })).toHaveAttribute('aria-pressed', 'true')
})

test('unknown route shows the not-found page', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')
  await expect(page.getByRole('heading', { name: /não encontrada/i })).toBeVisible()
})
