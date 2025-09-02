/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'

describe('router: error handling', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  afterEach(() => {
    // Reset error fallback
    Router.errorFallback = () => 'Oops, page dont exist'
  })

  it('shows 404 page for non-existent routes', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    Router.initRoot({
      container,
      render: () => 'root',
    })

    let renderedContent = ''
    Router.errorFallback = () => {
      renderedContent = '404 - Page Not Found'
      return '404 - Page Not Found'
    }

    const result = await Router.navigate('/nonexistent')
    expect(result.ok).to.equal(false)
    expect(renderedContent).to.equal('404 - Page Not Found')

    cleanupRouterContainer(container)
  })

  it('redirects from errorFallback', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'home',
      render: () => 'home',
    })

    Router.errorFallback = () => ({redirectTo: '/home'})

    const result = await Router.navigate('/nonexistent')
    expect(result.ok).to.equal(false)
    expect(result.redirectedTo).to.equal('/home')

    cleanupRouterContainer(container)
  })

  it('handles errorFallback that returns string', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    Router.initRoot({
      container,
      render: () => 'root',
    })

    Router.errorFallback = ({path}) => `Custom 404 for ${path}`

    const result = await Router.navigate('/missing')
    expect(result.ok).to.equal(false)

    cleanupRouterContainer(container)
  })

  it('handles errorFallback that returns object with redirect', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'fallback',
      render: () => 'fallback page',
    })

    Router.errorFallback = ({path}) => {
      if (path.startsWith('/api/')) {
        return {redirectTo: '/fallback'}
      }
      return 'Standard 404'
    }

    const result = await Router.navigate('/api/test')
    expect(result.ok).to.equal(false)
    expect(result.redirectedTo).to.equal('/fallback')

    cleanupRouterContainer(container)
  })

  it('passes correct context to errorFallback', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedContext: any = null
    Router.errorFallback = (ctx) => {
      capturedContext = ctx
      return '404'
    }

    await Router.navigate('/missing?q=search&page=1')

    expect(capturedContext).to.not.be.null
    expect(capturedContext.path).to.equal('/missing')
    expect(capturedContext.query.q).to.equal('search')
    expect(capturedContext.query.page).to.equal('1')

    cleanupRouterContainer(container)
  })

  it('handles navigation to malformed paths', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    Router.initRoot({
      container,
      render: () => 'root',
    })

    let errorFallbackCalled = false
    Router.errorFallback = () => {
      errorFallbackCalled = true
      return '404'
    }

    // Test with empty path segments
    const result = await Router.navigate('//')
    // This might succeed if it normalizes to root path
    expect(errorFallbackCalled).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('handles navigation when root element is not available', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    // Initialize without container
    Router.initRoot({
      render: () => 'root',
    })

    // Mock console.warn to avoid output
    const originalWarn = console.warn
    let warningCalled = false
    console.warn = () => {
      warningCalled = true
    }

    const result = await Router.navigate('/nonexistent')
    expect(result.ok).to.equal(false)
    expect(warningCalled).to.equal(true)

    console.warn = originalWarn
  })

  it('handles navigation with complex query parameters', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedQuery: any = {}
    Router.errorFallback = (ctx) => {
      capturedQuery = ctx.query
      return '404'
    }

    await Router.navigate('/missing?a=1&b=2&c=3&d=complex%20value&e=another+value')

    expect(capturedQuery.a).to.equal('1')
    expect(capturedQuery.b).to.equal('2')
    expect(capturedQuery.c).to.equal('3')
    expect(capturedQuery.d).to.equal('complex value')
    expect(capturedQuery.e).to.equal('another value')

    cleanupRouterContainer(container)
  })

  it('handles navigation with hash in path', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedPath = ''
    Router.errorFallback = (ctx) => {
      capturedPath = ctx.path
      return '404'
    }

    const result = await Router.navigate('/test#section')
    expect(result.ok).to.equal(false)
    // Hash might be stripped or kept depending on implementation
    expect(capturedPath).to.be.oneOf(['/test', '/test#section'])

    cleanupRouterContainer(container)
  })

  it('handles default errorFallback when not set', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    Router.initRoot({
      container,
      render: () => 'root',
    })

    // Reset to default
    Router.errorFallback = () => 'Oops, page dont exist'

    const result = await Router.navigate('/nonexistent')
    expect(result.ok).to.equal(false)

    cleanupRouterContainer(container)
  })

  it('sets current route to undefined on 404', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    Router.initRoot({
      container,
      render: () => 'root',
    })

    // First navigate to a valid route
    const users = Router.initRoot({
      container,
      render: () => 'root',
    }).addChild({
      name: 'users',
      render: () => 'users',
    })

    await Router.navigate('/users')
    expect((Router as any).currentRoute.get()).to.equal(users)

    // Then navigate to invalid route
    await Router.navigate('/invalid')
    expect((Router as any).currentRoute.get()).to.be.undefined

    cleanupRouterContainer(container)
  })
})
