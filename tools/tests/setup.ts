// Mocha global hooks for more stable teardown in browser
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

afterEach(async () => {
  // flush timers/microtasks between tests to help Playwright close pages cleanly
  await wait(0)
})
