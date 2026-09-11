import { expect, test } from '@playwright/test'

import { addOpenEditionToCart, fillCheckout, login, resetState } from './support/app'

/**
 * @visual — regression baselines for Início, Detalhe, Carrinho, Pagamento.
 * Deterministic data (default scenario) + stubbed artwork so screenshots don't
 * depend on the network. Run with `pnpm test:visual`; update with
 * `pnpm test:e2e:update`.
 */
test.describe('@visual', () => {
  test.beforeEach(async ({ page }) => {
    // solid placeholder for all remote artwork → stable pixels
    await page.route(/picsum\.photos/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#2f1d15"/></svg>',
      }),
    )
    await resetState(page)
  })

  const shot = { animations: 'disabled', maxDiffPixelRatio: 0.02 } as const

  test('Início', async ({ page }) => {
    await page.goto('/')
    await page.locator('li a[href^="/nft/"]').first().waitFor()
    await expect(page).toHaveScreenshot('inicio.png', { ...shot, fullPage: true })
  })

  test('Detalhe do NFT', async ({ page }) => {
    await page.goto('/nft/nft_2')
    await page.getByText(/Sobre este NFT/i).waitFor()
    await expect(page).toHaveScreenshot('detalhe.png', { ...shot, fullPage: true })
  })

  test('Carrinho', async ({ page }) => {
    await addOpenEditionToCart(page, 'nft_5')
    await page.goto('/carrinho')
    await page.getByRole('listitem').first().waitFor()
    await expect(page).toHaveScreenshot('carrinho.png', { ...shot, fullPage: true })
  })

  test('Pagamento', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-mobile', 'covered on desktop')
    await login(page)
    await addOpenEditionToCart(page, 'nft_5')
    await fillCheckout(page)
    await page.getByRole('button', { name: 'Desconectar' }).waitFor()
    await expect(page).toHaveScreenshot('pagamento.png', { ...shot, fullPage: true })
  })
})
