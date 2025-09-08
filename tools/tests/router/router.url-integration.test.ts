/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {url} from '../../../src/modules/url'
import {createRouterTestEnv, createRouterContainer, cleanupRouterContainer} from '../fixtures/router'
import {waitForCondition} from '../fixtures/common'

describe('router: URL integration', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  // Очистка выполняется глобально в tools/tests/setup.ts

  it('starts router and subscribes to URL changes', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
    })

    const container = createRouterContainer()

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'test',
      render: () => 'test',
    })

    Router.start()

    // simulate url change via public API
    url.push('/test')
    await new Promise((r) => setTimeout(r, 0))

    expect((Router as any).currentRoute.get()?.name).to.equal('test')

    cleanupRouterContainer(container)
  })

  it('handles missing URL module gracefully', () => {
    const {adapter} = createRouterTestEnv({withUrl: false, initialPath: '/'})

    Router.configure(adapter, {withUrl: false})

    const container = createRouterContainer()

    Router.initRoot({
      container,
      render: () => 'root',
    })

    // Should not throw when URL module is not available
    expect(() => Router.start()).to.not.throw()

    cleanupRouterContainer(container)
  })

  it('handles file protocol URLs in start()', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {withUrl: true})

    const container = createRouterContainer()

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'test',
      render: () => 'test',
    })


    // эмулируем file: протокол через env url
    ;(url as any).constructor.configureEnv({
      get window() {
        return {
          addEventListener: () => {},
          removeEventListener: () => {},
        } as any
      },
      get location() {
        return {protocol: 'file:', hash: '#/test', pathname: '/'} as any
      },
      get history() {
        return {
          pushState: () => {},
          replaceState: () => {},
          back: () => {},
          go: () => {},
        } as any
      },
    })

    expect(() => Router.start()).to.not.throw()

    cleanupRouterContainer(container)
  })

  it('navigates on URL path changes', async () => {
    const {adapter, fakeHistory, historyRecords} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
    })

    Router.configure(adapter, {withUrl: true})

    const container = createRouterContainer()

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'page1',
      render: () => 'page1',
    })

    root.addChild({
      name: 'page2',
      render: () => 'page2',
    })

    // Simulate URL navigation
    await Router.navigate('/page1')
    expect(historyRecords.length).to.be.greaterThan(0)

    await Router.navigate('/page2')
    expect(historyRecords.length).to.be.greaterThan(1)

    cleanupRouterContainer(container)
  })

  it('handles URL query parameter changes', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {withUrl: true})

    const container = createRouterContainer()

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedQuery: any = {}
    root.addChild({
      name: 'search',
      render: (_outer, ctx) => {
        capturedQuery = ctx?.query || {}
        return 'search'
      },
    })

    await Router.navigate('/search?q=test&page=1')
    expect(capturedQuery.q).to.equal('test')
    expect(capturedQuery.page).to.equal('1')

    await Router.navigate('/search?q=new&page=2')
    expect(capturedQuery.q).to.equal('new')
    expect(capturedQuery.page).to.equal('2')

    cleanupRouterContainer(container)
  })

  it('synchronizes with browser history on navigation', async () => {
    const {adapter, fakeHistory, historyRecords} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
    })

    Router.configure(adapter, {withUrl: true})

    const container = createRouterContainer()

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'page',
      render: () => 'page',
    })

    await Router.navigate('/page')

    // Check that browser history was updated
    expect(historyRecords.length).to.be.greaterThan(0)
    expect(historyRecords[historyRecords.length - 1][0]).to.equal('push')
    expect(historyRecords[historyRecords.length - 1][1]).to.include('/page')

    cleanupRouterContainer(container)
  })

  it('uses replace for navigation when specified', async () => {
    const {adapter, fakeHistory, historyRecords} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
    })

    Router.configure(adapter, {withUrl: true})

    const container = createRouterContainer()

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'page',
      render: () => 'page',
    })

    await Router.replace('/page')

    // Check that replace was used instead of push
    expect(historyRecords.length).to.be.greaterThan(0)
    expect(historyRecords[historyRecords.length - 1][0]).to.equal('replace')
    expect(historyRecords[historyRecords.length - 1][1]).to.include('/page')

    cleanupRouterContainer(container)
  })

  it('handles back navigation', async () => {
    const {adapter, fakeHistory} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
    })

    Router.configure(adapter, {withUrl: true})

    const container = createRouterContainer()

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'page1',
      render: () => 'page1',
    })

    root.addChild({
      name: 'page2',
      render: () => 'page2',
    })

    // Подписываемся на изменения URL, чтобы back() корректно отражался в Router
    Router.start()

    // Navigate to create history
    await Router.navigate('/page1')
    await Router.navigate('/page2')

    // Go back
    await Router.back()
    await waitForCondition(() => (Router as any).currentRoute.get()?.name === 'page1', 500, 10)

    // Should be back to page1
    expect((Router as any).currentRoute.get()?.name).to.equal('page1')

    cleanupRouterContainer(container)
  })

  it('handles missing URL module gracefully', () => {
    const {adapter} = createRouterTestEnv({withUrl: false, initialPath: '/'})

    Router.configure(adapter, {withUrl: false})

    const container = createRouterContainer()

    Router.initRoot({
      container,
      render: () => 'root',
    })

    // Should not throw when URL module is not available
    expect(() => Router.start()).to.not.throw()

    cleanupRouterContainer(container)
  })

  it('handles URL subscription errors gracefully', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {withUrl: true})

    // Mock URL with failing subscription
    const mockUrl = {
      pathSignal: {
        subscribe: () => {
          throw new Error('Subscription failed')
        },
      },
      hashSignal: {
        subscribe: () => () => {},
      },
    }

    // Temporarily replace url properties
    const originalPathSignal = (url as any).pathSignal
    const originalHashSignal = (url as any).hashSignal

    ;(url as any).pathSignal = mockUrl.pathSignal
    ;(url as any).hashSignal = mockUrl.hashSignal

    const container = createRouterContainer()

    Router.initRoot({
      container,
      render: () => 'root',
    })

    // Should handle subscription error gracefully
    expect(() => Router.start()).to.not.throw()

    // Restore original url properties
    ;(url as any).pathSignal = originalPathSignal
    ;(url as any).hashSignal = originalHashSignal

    cleanupRouterContainer(container)
  })

  it('handles concurrent URL changes', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {withUrl: true})

    const container = createRouterContainer()

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'page1',
      render: () => 'page1',
    })

    root.addChild({
      name: 'page2',
      render: () => 'page2',
    })

    // Start multiple navigations
    const nav1 = Router.navigate('/page1')
    const nav2 = Router.navigate('/page2')

    await Promise.all([nav1, nav2])

    // Should end up at the last navigation
    expect((Router as any).currentRoute.get()?.name).to.equal('page2')

    cleanupRouterContainer(container)
  })

  it('preserves query parameters during URL navigation', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/?existing=param',
    })

    Router.configure(adapter, {withUrl: true})

    const container = createRouterContainer()

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedQuery: any = {}
    root.addChild({
      name: 'page',
      render: (_outer, ctx) => {
        capturedQuery = ctx?.query || {}
        return 'page'
      },
    })

    await Router.navigate('/page?new=param')

    expect(capturedQuery.new).to.equal('param')
    // Should not preserve old query unless explicitly passed
    expect(capturedQuery.existing).to.be.undefined

    cleanupRouterContainer(container)
  })
})
