/**
 * Mocks are activated by configuration and ship in the demo build (CLAUDE.md).
 * Enabled unless VITE_ENABLE_MOCKS === 'false'.
 *
 * Memoized: `main.tsx` kicks this off in the background without blocking the
 * initial render (so first paint isn't gated behind a service-worker round
 * trip), and `lib/http.ts`'s request interceptor awaits the same promise
 * before letting any request leave — calling it more than once just returns
 * the in-flight/settled promise instead of re-registering the worker.
 */
let started: Promise<void> | undefined

export function enableMocking(): Promise<void> {
  if (!started) started = doEnableMocking()
  return started
}

async function doEnableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false') return

  const { worker } = await import('./browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    quiet: true,
  })

  const { startSocketMock } = await import('./socket')
  startSocketMock()

  const { setScenario, scenario, scenarioNames } = await import('./scenario')
  const { resetDb } = await import('./db')
  const { emitNftUpdated, emitOrderUpdated } = await import('./socket')

  // Test + dev-panel control surface for the deterministic scenarios.
  Object.assign(window, {
    __mock: {
      setScenario,
      scenario,
      scenarioNames,
      resetDb,
      emitNftUpdated,
      emitOrderUpdated,
    },
  })
}
