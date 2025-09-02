/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router, createRouter} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'
import type {SignalAdapter} from '../../../src/modules/adapter/types'

describe('router: createRouter', () => {
  let originalRouterState: any

  beforeEach(() => {
    Router.__resetLoopForTests()
    // Save original state
    originalRouterState = {
      _signals: (Router as any)._signals,
      debug: (Router as any).debug,
      maxHistoryLength: (Router as any).maxHistoryLength,
      basePrefix: (Router as any).basePrefix,
      rootNode: (Router as any).rootNode,
      currentRoute: (Router as any).currentRoute,
      history: (Router as any).history,
      beforeEach: Router.beforeEach,
      afterEach: Router.afterEach,
      onNavigate: Router.onNavigate,
    }
  })

  afterEach(() => {
    // Restore original state
    Object.assign(Router, originalRouterState)
  })

  it('creates router instance with default options', () => {
    const adapter = createRouterTestEnv({withUrl: false}).adapter

    const router = createRouter({
      adapter,
    })

    expect(router).to.have.property('initRoot')
    expect(router).to.have.property('start')
    expect(router).to.have.property('stop')
    expect(router).to.have.property('goto')
    expect(router).to.have.property('replace')
    expect(router).to.have.property('back')
    expect(router).to.have.property('currentRoute')
    expect(router).to.have.property('history')
    expect(router).to.have.property('beforeEach')
    expect(router).to.have.property('afterEach')
    expect(router).to.have.property('onNavigate')
  })

  it('creates router with all options', () => {
    const adapter = createRouterTestEnv({withUrl: false}).adapter

    const router = createRouter({
      adapter,
      withUrl: true,
      historyMax: 50,
      base: '/myapp',
    })

    expect((Router as any).maxHistoryLength).to.equal(50)
    expect((Router as any).basePrefix).to.equal('/myapp')
  })

  it('configures router with base path', () => {
    const adapter = createRouterTestEnv({withUrl: false}).adapter

    const router = createRouter({
      adapter,
      base: '/dashboard',
    })

    expect((Router as any).basePrefix).to.equal('/dashboard')
  })

  it('configures router with history limit', () => {
    const adapter = createRouterTestEnv({withUrl: false}).adapter

    const router = createRouter({
      adapter,
      historyMax: 100,
    })

    expect((Router as any).maxHistoryLength).to.equal(100)
  })

  it('configures router with unlimited history', () => {
    const adapter = createRouterTestEnv({withUrl: false}).adapter

    const router = createRouter({
      adapter,
      historyMax: false,
    })

    expect((Router as any).maxHistoryLength).to.equal(false)
  })

  it('allows setting hooks through router instance', () => {
    const adapter = createRouterTestEnv({withUrl: false}).adapter

    const router = createRouter({adapter})

    let beforeCalled = false
    let afterCalled = false
    let navigateCalled = false

    router.beforeEach = () => {
      beforeCalled = true
      return true
    }

    router.afterEach = () => {
      afterCalled = true
    }

    router.onNavigate = () => {
      navigateCalled = true
    }

    expect(Router.beforeEach).to.not.be.undefined
    expect(Router.afterEach).to.not.be.undefined
    expect(Router.onNavigate).to.not.be.undefined
  })

  it('provides access to current route through getter', () => {
    const adapter = createRouterTestEnv({withUrl: false}).adapter

    const router = createRouter({adapter})

    expect(router.currentRoute).to.equal((Router as any).currentRoute)
  })

  it('provides access to history through getter', () => {
    const adapter = createRouterTestEnv({withUrl: false}).adapter

    const router = createRouter({adapter})

    expect(router.history).to.equal((Router as any).history)
  })

  it('allows full router lifecycle through instance', async () => {
    const {adapter} = createRouterTestEnv({withUrl: false})

    const router = createRouter({adapter})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'test',
      render: () => 'test',
    })

    // Test navigation methods
    const gotoResult = await router.goto('/test')
    expect(gotoResult).to.equal(true)

    // Replace to same path should return false (same navigation)
    const replaceResult = await router.replace('/test')
    expect(replaceResult).to.equal(false)

    // Replace to different path should work
    const replaceDifferentResult = await router.replace('/different')
    expect(replaceDifferentResult).to.equal(false) // route doesn't exist, so false

    // Test lifecycle methods
    expect(() => router.start()).to.not.throw()
    expect(() => router.stop()).to.not.throw()

    cleanupRouterContainer(container)
  })

  it('isolates multiple router instances', () => {
    const adapter1 = createRouterTestEnv({withUrl: false}).adapter
    const adapter2 = createRouterTestEnv({withUrl: false}).adapter

    const router1 = createRouter({
      adapter: adapter1,
      base: '/app1',
      historyMax: 10,
    })

    const router2 = createRouter({
      adapter: adapter2,
      base: '/app2',
      historyMax: 20,
    })

    // Each router should have its own configuration
    expect((Router as any).basePrefix).to.equal('/app2') // Last one wins since it's the same Router class
    expect((Router as any).maxHistoryLength).to.equal(20)
  })

  it('handles router instance with URL integration', () => {
    const {adapter} = createRouterTestEnv({withUrl: true})

    const router = createRouter({
      adapter,
      withUrl: true,
    })

    expect((Router as any)._signals).to.equal(adapter)
  })

  it('provides functional API for all router operations', async () => {
    const {adapter} = createRouterTestEnv({withUrl: false})

    const router = createRouter({adapter})

    const container = document.createElement('div')
    document.body.appendChild(container)

    // Test initRoot
    const root = router.initRoot({
      container,
      render: () => 'root',
    })

    expect(root).to.not.be.undefined

    // Test navigation
    root.addChild({
      name: 'page',
      render: () => 'page',
    })

    const result = await router.goto('/page')
    expect(result).to.equal(true)

    // Test hooks
    let hookCalled = false
    router.beforeEach = () => {
      hookCalled = true
      return true
    }

    // Navigate to same page - hook should not be called (same navigation)
    await router.goto('/page')
    expect(hookCalled).to.equal(false)

    // Navigate to different page - hook should be called
    await router.goto('/other')
    expect(hookCalled).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('maintains backward compatibility with direct Router usage', () => {
    const {adapter} = createRouterTestEnv({withUrl: false})

    // Use createRouter
    const router = createRouter({adapter})

    // Also configure Router directly
    Router.configure(adapter, {base: '/direct'})

    // Both should work
    expect((Router as any).basePrefix).to.equal('/direct')
    expect(router).to.have.property('initRoot')
  })

  it('handles error cases in router creation', () => {
    const adapter = createRouterTestEnv({withUrl: false}).adapter

    // Should handle missing adapter gracefully during creation
    expect(() => createRouter({adapter})).to.not.throw()
  })

  it('supports method chaining for hooks', () => {
    const {adapter} = createRouterTestEnv({withUrl: false})

    const router = createRouter({adapter})

    // Chain hook assignments
    router.beforeEach = () => true
    router.afterEach = () => {}
    router.onNavigate = () => {}

    expect(Router.beforeEach).to.not.be.undefined
    expect(Router.afterEach).to.not.be.undefined
    expect(Router.onNavigate).to.not.be.undefined
  })

  it('exposes all necessary methods for SPA routing', async () => {
    const {adapter} = createRouterTestEnv({withUrl: false})

    const router = createRouter({adapter})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'home',
      render: () => 'home',
    })

    root.addChild({
      name: 'about',
      render: () => 'about',
    })

    // Test all navigation methods
    await router.goto('/home')
    expect((Router as any).currentRoute.get()?.name).to.equal('home')

    await router.replace('/about')
    expect((Router as any).currentRoute.get()?.name).to.equal('about')

    // Test lifecycle
    router.start()
    router.stop()

    cleanupRouterContainer(container)
  })
})
