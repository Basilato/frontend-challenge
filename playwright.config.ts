import { defineConfig, devices } from '@playwright/test'

/**
 * E2E + visual regression. Runs against the demo build (mocks enabled).
 * Each spec resets the mock db + scenario in beforeEach (see e2e/support/app.ts).
 */
export default defineConfig({
  testDir: './e2e',
  // Tests in a file run serially; files run in parallel. Keeps peak load on the
  // single shared preview server sane so realtime/checkout timing stays stable.
  fullyParallel: false,
  workers: 3,
  forbidOnly: !!process.env.CI,
  retries: 2,
  reporter: [['html', { open: 'never' }], ['list']],
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:4173',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      grepInvert: /@visual/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-mobile',
      grepInvert: /@visual/,
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'visual-desktop',
      testMatch: /visual\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
      },
    },
    {
      name: 'visual-mobile',
      testMatch: /visual\.spec\.ts/,
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
      },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
