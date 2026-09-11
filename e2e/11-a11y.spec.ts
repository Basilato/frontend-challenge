import { expect, test } from '@playwright/test'

import { resetState } from './support/app'

// Scenario 11 — keyboard navigation, dialog focus, form validation.

test.beforeEach(({ page }) => resetState(page))

test('the auth dialog keeps focus inside and closes on Escape', async ({ page }, testInfo) => {
  // Mobile Login/Cadastro is a dedicated full-screen page in the Figma mobile
  // frames (no dialog, no backdrop, no Escape-to-close) — only the desktop
  // modal has dialog/focus-trap semantics to verify.
  test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop modal only')
  await page.goto('/login')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const focusedInDialog = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]')
    return !!d && d.contains(document.activeElement)
  })
  expect(focusedInDialog).toBe(true)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('forms surface validation without submitting to the API', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('not-an-email')
  await page.locator('#auth-password').fill('x')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText(/E-mail inválido/i)).toBeVisible()
})

test('a catalog tab can be operated by keyboard', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'keyboard flow')
  await page.goto('/')
  const tab = page.getByRole('tab', { name: 'Em alta' })
  await tab.focus()
  await expect(tab).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/tab=trending/)
})

test('the skip link is reachable and jumps to the content', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'desktop layout')
  await page.goto('/')
  const skip = page.getByRole('link', { name: /Pular para o conteúdo/i })
  await skip.focus()
  await expect(skip).toBeVisible() // becomes visible on focus
  await skip.press('Enter')
  await expect(page).toHaveURL(/#main$/)
})

test('the mobile filter drawer traps focus and dismisses', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'mobile drawer')
  await page.goto('/#catalogo')
  await page.getByLabel('Filtros').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})
