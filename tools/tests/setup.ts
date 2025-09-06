// Mocha global hooks for more stable teardown in browser
import {Router} from '../../src/modules/router/router'
import {url} from '../../src/modules/url'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

afterEach(async () => {
  // flush timers/microtasks between tests to help Playwright close pages cleanly
  try {
    // Ensure router subscriptions and listeners are removed if started in a test
    Router.stop()
  } catch {
    // ignore teardown errors
  }
  try {
    // Remove URL popstate/hashchange listeners created during tests
    ;(url as any).dispose?.()
    ;(url as any).__resetForTests?.()
  } catch {
    // ignore teardown errors
  }
  await wait(0)
})
