/**
 * Mocks are activated by configuration and ship in the demo build (CLAUDE.md).
 * Enabled unless VITE_ENABLE_MOCKS === 'false'.
 */
export async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false') return

  const { worker } = await import('./browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    quiet: true,
  })

  // expose scenario + db reset for the dev panel and Playwright
  const { setScenario, scenarioNames } = await import('./scenario')
  const { resetDb } = await import('./db')
  Object.assign(window, {
    __mock: { setScenario, scenarioNames, resetDb },
  })
}
