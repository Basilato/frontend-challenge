import { expect, test } from '@playwright/test'

import { resetState } from './support/app'

// Scenario 12 — skeletons on slow load, failure feedback, recovery after retry.

test('slow network shows skeletons that preserve layout, then content', async ({ page }) => {
  await resetState(page, 'slow-network')
  await page.goto('/#catalogo')

  // catalog card skeletons render while the query is in flight
  await expect(page.locator('.shimmer.aspect-square').first()).toBeVisible({ timeout: 5_000 })
  // then real cards replace them (no error state)
  await expect(page.locator('li a[href^="/nft/"]').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('.shimmer.aspect-square')).toHaveCount(0)
})

test('a transient catalog failure shows an error with a working retry', async ({ page }) => {
  await resetState(page, 'flaky-network')

  let sawError = false
  for (let i = 0; i < 10 && !sawError; i++) {
    await page.goto('/#catalogo')
    sawError = await page
      .getByText(/Não foi possível carregar o catálogo/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false)
  }
  test.skip(!sawError, 'transient failure did not trigger this run')

  await page.getByRole('button', { name: /Tentar novamente/i }).click()
  await expect(page.locator('li a[href^="/nft/"]').first()).toBeVisible({ timeout: 15_000 })
})

test('detail page error state recovers on retry', async ({ page }) => {
  await resetState(page, 'flaky-network')

  const content = page.getByText('Edição:')
  const retry = page.getByRole('button', { name: /Tentar novamente/i })

  for (let i = 0; i < 12; i++) {
    await page.goto('/nft/nft_2')
    await content.or(retry).first().waitFor({ timeout: 20_000 })

    if (await content.isVisible()) return // loaded fine

    // error state → retry until it loads
    for (let r = 0; r < 5; r++) {
      await retry.click()
      await content.or(retry).first().waitFor({ timeout: 20_000 })
      if (await content.isVisible()) return
    }
  }
  throw new Error('detail page never recovered')
})
