/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router, Routes} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'

describe('router: history management', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  afterEach(() => {
    Routes.history = []
    Router.maxHistoryLength = 10
    Router.beforeEach = undefined
    Router.afterEach = undefined
    Router.onNavigate = undefined
  })

  it('tracks navigation history', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    const home = root.addChild({
      name: 'home',
      render: () => 'home',
    })

    const about = root.addChild({
      name: 'about',
      render: () => 'about',
    })

    const contact = root.addChild({
      name: 'contact',
      render: () => 'contact',
    })

    await Router.navigate('/home')
    expect((Router as any).history.length).to.equal(1)
    expect((Router as any).history[0]).to.equal(home)

    await Router.navigate('/about')
    expect((Router as any).history.length).to.equal(2)
    expect((Router as any).history[1]).to.equal(about)

    await Router.navigate('/contact')
    expect((Router as any).history.length).to.equal(3)
    expect((Router as any).history[2]).to.equal(contact)

    cleanupRouterContainer(container)
  })

  it('limits history when maxHistoryLength is set', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
      historyMax: 3,
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    // Add multiple routes
    for (let i = 1; i <= 5; i++) {
      root.addChild({
        name: `page${i}`,
        render: () => `page${i}`,
      })
    }

    // Navigate to fill history beyond limit
    await Router.navigate('/page1')
    await Router.navigate('/page2')
    await Router.navigate('/page3')
    await Router.navigate('/page4')
    await Router.navigate('/page5')

    expect(Routes.history.length).to.equal(3)
    expect(Routes.history[0].name).to.equal('page3')
    expect(Routes.history[1].name).to.equal('page4')
    expect(Routes.history[2].name).to.equal('page5')

    cleanupRouterContainer(container)
  })

  it('does not limit history when maxHistoryLength is false', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
      historyMax: false,
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    // Add multiple routes
    for (let i = 1; i <= 15; i++) {
      root.addChild({
        name: `page${i}`,
        render: () => `page${i}`,
      })
    }

    // Navigate multiple times
    for (let i = 1; i <= 15; i++) {
      await Router.navigate(`/page${i}`)
    }

    expect((Router as any).history.length).to.equal(15)

    cleanupRouterContainer(container)
  })

  it('respects history length changes dynamically', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
      historyMax: 5,
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    // Add routes
    for (let i = 1; i <= 8; i++) {
      root.addChild({
        name: `page${i}`,
        render: () => `page${i}`,
      })
    }

    // Navigate to fill history
    for (let i = 1; i <= 8; i++) {
      await Router.navigate(`/page${i}`)
    }

    expect(Routes.history.length).to.equal(5)

    // Change max length - this should trim existing history
    Router.maxHistoryLength = 3
    expect(Routes.history.length).to.equal(3) // Should be trimmed immediately

    // Next navigation should maintain the limit
    await Router.navigate('/page1')
    expect(Routes.history.length).to.equal(3)

    cleanupRouterContainer(container)
  })

  it('maintains history order correctly', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    const routes = ['home', 'about', 'contact', 'blog', 'portfolio']
    routes.forEach((name) => {
      root.addChild({
        name,
        render: () => name,
      })
    })

    // Navigate in specific order
    const navigationOrder = ['home', 'about', 'contact', 'blog', 'about', 'portfolio']
    for (const route of navigationOrder) {
      await Router.navigate(`/${route}`)
    }

    expect((Router as any).history.length).to.equal(6)
    expect((Router as any).history.map((r: any) => r.name)).to.deep.equal(navigationOrder)

    cleanupRouterContainer(container)
  })

  it('handles navigation to same route without duplicating history', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'same',
      render: () => 'same',
    })

    await Router.navigate('/same')
    await Router.navigate('/same') // Same route, should not add to history
    await Router.navigate('/same') // Same route again

    expect((Router as any).history.length).to.equal(1)
    expect((Router as any).history[0].name).to.equal('same')

    cleanupRouterContainer(container)
  })

  it('handles failed navigation without adding to history', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'valid',
      render: () => 'valid',
    })

    const initialHistoryLength = (Router as any).history.length

    await Router.navigate('/valid')
    expect((Router as any).history.length).to.equal(initialHistoryLength + 1)

    // Try to navigate to non-existent route
    await Router.navigate('/invalid')
    expect((Router as any).history.length).to.equal(initialHistoryLength + 1) // Should not increase

    cleanupRouterContainer(container)
  })

  it('handles blocked navigation without adding to history', async () => {
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

    const initialHistoryLength = (Router as any).history.length

    await Router.navigate('/blocked')
    expect((Router as any).history.length).to.equal(initialHistoryLength) // Should not increase

    cleanupRouterContainer(container)
  })

  it('clears history when root is reinitialized', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root1 = Router.initRoot({
      container,
      render: () => 'root1',
    })

    root1.addChild({
      name: 'page1',
      render: () => 'page1',
    })

    await Router.navigate('/page1')
    expect((Router as any).history.length).to.equal(1)

    // Reinitialize root
    const root2 = Router.initRoot({
      container,
      render: () => 'root2',
    })

    expect((Router as any).history.length).to.equal(0) // Should be cleared
    expect((Router as any).rootNode).to.equal(root2)

    cleanupRouterContainer(container)
  })

  it('exposes history through getter', async () => {
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

    const result = await Router.navigate('/test')
    expect(result).to.equal(true) // Ensure navigation succeeded

    // Access through getter
    const history = (Router as any).history
    expect(Array.isArray(history)).to.equal(true)
    console.log('History length:', history.length, 'History:', history.map(h => h.name))
    expect(history.length).to.equal(1)
    expect(history[0].name).to.equal('test')

    cleanupRouterContainer(container)
  })

  it('handles navigation with redirects in history', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'redirect',
      render: () => 'redirect',
      entry: () => '/target',
    })

    root.addChild({
      name: 'target',
      render: () => 'target',
    })

    await Router.navigate('/redirect')

    // Should only have the final target in history, not the redirect
    expect((Router as any).history.length).to.equal(1)
    expect((Router as any).history[0].name).to.equal('target')

    cleanupRouterContainer(container)
  })
})
