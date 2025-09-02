/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'
import type {SignalAdapter} from '../../../src/modules/adapter/types'

describe('router: navigation', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  it('navigates to simple route successfully', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'test',
      render: () => 'test page',
    })

    const result = await Router.navigate('/test')
    expect(result.ok).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('navigates with query parameters', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    let capturedQuery: any = {}
    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'search',
      render: (_outer, ctx) => {
        capturedQuery = ctx?.query
        return 'search'
      },
    })

    const result = await Router.navigate('/search?q=test&page=1')
    expect(result.ok).to.equal(true)
    expect(capturedQuery.q).to.equal('test')
    expect(capturedQuery.page).to.equal('1')

    cleanupRouterContainer(container)
  })

  it('short-circuits when path and query are the same', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/test'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'test',
      render: () => 'test',
    })

    // First navigation
    await Router.navigate('/test?q=1')

    // Second navigation to same path - should short-circuit
    const result = await Router.navigate('/test?q=1')
    expect(result.ok).to.equal(false)
    expect(result.reason).to.equal('same')

    cleanupRouterContainer(container)
  })

  it('goto works as navigate wrapper', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'page',
      render: () => 'page',
    })

    const result = await Router.goto('/page')
    expect(result).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('replace navigates without pushing to history', async () => {
    const {adapter, fakeHistory, historyRecords} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'page',
      render: () => 'page',
    })

    const result = await Router.replace('/page')
    expect(result).to.equal(true)

    // Check that replace was called instead of push
    expect(historyRecords.some(([method]) => method === 'replace')).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('handles file protocol paths', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    // Mock file protocol
    const originalWindow = globalThis.window
    ;(globalThis as any).window = {
      ...originalWindow,
      location: {protocol: 'file:', hash: '#/test'},
    }

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'test',
      render: () => 'test',
    })

    const result = await Router.navigate('#/test')
    expect(result.ok).to.equal(true)

    // Restore
    ;(globalThis as any).window = originalWindow

    cleanupRouterContainer(container)
  })

  it('blocks navigation when beforeEach returns false', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.beforeEach = () => false

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'blocked',
      render: () => 'blocked',
    })

    const result = await Router.navigate('/blocked')
    expect(result.ok).to.equal(false)
    expect(result.reason).to.equal('blocked')

    cleanupRouterContainer(container)
  })

  it('redirects when beforeEach returns string', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.beforeEach = () => '/redirected'

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'original',
      render: () => 'original',
    })

    root.addChild({
      name: 'redirected',
      render: () => 'redirected',
    })

    const result = await Router.navigate('/original')
    expect(result.ok).to.equal(false)
    expect(result.reason).to.equal('redirected')
    expect(result.redirectedTo).to.equal('/redirected')

    cleanupRouterContainer(container)
  })

  it('calls afterEach hook after successful navigation', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    let afterEachCalled = false
    Router.afterEach = () => {
      afterEachCalled = true
    }

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'test',
      render: () => 'test',
    })

    await Router.navigate('/test')
    expect(afterEachCalled).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('calls onNavigate callback for different events', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const events: any[] = []
    Router.onNavigate = (event) => {
      events.push(event)
    }

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'test',
      render: () => 'test',
    })

    await Router.navigate('/test')
    expect(events.length).to.equal(1)
    expect(events[0].status).to.equal('success')
    expect(events[0].to).to.equal('/test')

    cleanupRouterContainer(container)
  })

  it('handles navigation when root is not initialized', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})
    ;(Router as any).rootNode = undefined

    const result = await Router.navigate('/test')
    expect(result.ok).to.equal(false)
  })

  it('prevents concurrent navigations', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'test',
      render: () => 'test',
    })

    // Start first navigation
    const firstNav = Router.navigate('/test')

    // Try second navigation - should be blocked
    const secondNav = Router.navigate('/test')
    const secondResult = await secondNav
    expect(secondResult.ok).to.equal(false)
    expect(secondResult.reason).to.equal('same')

    // Wait for first to complete
    await firstNav

    cleanupRouterContainer(container)
  })
})
