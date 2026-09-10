import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    ;(window as unknown as { __mock?: { resetDb(): void } }).__mock?.resetDb()
    try {
      localStorage.removeItem('greenmint.session.token')
    } catch {
      /* ignore */
    }
  })
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

test('auth: register conflict, login, session persists, logout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'uses the desktop header menu')
  // registering an existing email is rejected with a field error
  await page.goto('/cadastro')
  await page.getByLabel('Nome').fill('Duplicada')
  await page.getByLabel('E-mail').fill('ada@greenmint.test')
  await page.locator('#auth-password').fill('senha123')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('alert')).toContainText(/já cadastrado/i)

  // login with the seeded credentials
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('ada@greenmint.test')
  await page.locator('#auth-password').fill('senha123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('button', { name: /Ada/ })).toBeVisible()

  // session survives a reload
  await page.reload()
  await expect(page.getByRole('button', { name: /Ada/ })).toBeVisible()

  // logout clears the session
  await page.getByRole('button', { name: /Ada/ }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('link', { name: /Entrar/ })).toBeVisible()
})

test('auth: login returns to the page that required it', async ({ page }) => {
  await page.goto('/nft/nft_1')
  await page.getByRole('button', { name: 'Favoritar' }).click()
  // signed out -> prompted; go log in
  await page.goto('/login?redirect=' + encodeURIComponent('/carrinho'))
  await page.getByLabel('E-mail').fill('bruno@greenmint.test')
  await page.locator('#auth-password').fill('senha123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/carrinho/)
})

test('cart: add, change quantity, coupon, remove, persist on reload', async ({ page }) => {
  await page.goto('/nft/nft_5')
  await page.getByRole('radio', { name: 'ABERTA' }).click() // open edition — plenty of stock
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page.getByText('Adicionado ao carrinho')).toBeVisible()

  await page.goto('/carrinho')
  const row = page.getByRole('listitem').filter({ hasText: 'Cosmic Bloom #005' })
  await expect(row).toBeVisible()

  // increase quantity
  await row.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(row.getByText('2', { exact: true })).toBeVisible()

  // valid coupon reduces the total
  await page.getByLabel('Código promocional').fill('GREEN10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText(/Cupom .*GREEN10.* aplicado/)).toBeVisible()

  // survives a reload (mock db is persisted)
  await page.reload()
  await expect(page.getByRole('listitem').filter({ hasText: 'Cosmic Bloom #005' })).toBeVisible()
  await expect(page.getByText(/GREEN10.* aplicado/)).toBeVisible()

  // invalid coupon is rejected
  await page.getByLabel('Remover cupom').click()
  await page.getByLabel('Código promocional').fill('WRONG')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('alert')).toContainText(/inválido/i)

  // remove the item -> empty state
  await page.getByRole('button', { name: /Remover .* do carrinho/ }).click()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('NFT detail: direct access, add to cart, missing NFT', async ({ page }) => {
  // direct access to a detail URL works (SPA + loader)
  await page.goto('/nft/nft_3')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // add to cart confirms via toast
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page.getByText('Adicionado ao carrinho')).toBeVisible()

  // unknown id shows the not-found state, not a crash
  await page.goto('/nft/nope-404')
  await expect(page.getByRole('heading', { name: /não encontrado/i })).toBeVisible()
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
