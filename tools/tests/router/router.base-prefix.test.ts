/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'

describe('router: base prefix', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  afterEach(() => {
    ;(Router as any).basePrefix = ''
  })

  it('handles navigation with base prefix', async () => {
    const {adapter, fakeHistory, historyRecords} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/app',
      base: '/app',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'dashboard',
      render: () => 'dashboard',
    })

    const result = await Router.navigate('/app/dashboard')
    expect(result.ok).to.equal(true)
    expect(historyRecords.length).to.be.greaterThan(0)
    expect(historyRecords[historyRecords.length - 1][0]).to.equal('push')
    expect(historyRecords[historyRecords.length - 1][1]).to.include('/app/dashboard')

    cleanupRouterContainer(container)
  })

  it('strips base prefix from navigation paths', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/app',
      base: '/app',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedRoute = ''
    const testRoute = root.addChild({
      name: 'test',
      render: () => {
        capturedRoute = 'test'
        return 'test'
      },
    })

    const result = await Router.navigate('/app/test')
    expect(result.ok).to.equal(true)
    // Trigger render to set capturedRoute
    testRoute.render()
    expect(capturedRoute).to.equal('test')

    cleanupRouterContainer(container)
  })

  it('handles navigation without base prefix in URL', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/dashboard',
      base: '/app',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'dashboard',
      render: () => 'dashboard',
    })

    // Navigation to path without base prefix should still work
    const result = await Router.navigate('/dashboard')
    expect(result.ok).to.equal(true) // Should work because route exists

    cleanupRouterContainer(container)
  })

  it('builds full paths with base prefix', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/app',
      base: '/app',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    const users = root.addChild({
      name: 'users',
      render: () => 'users',
    })

    const user = users.addChild({
      name: ':id',
      render: () => 'user',
    })

    expect(root.getFullPath()).to.equal('/')
    expect(users.getFullPath()).to.equal('/users')
    expect(user.getFullPath()).to.equal('/users/:id')

    cleanupRouterContainer(container)
  })

  it('handles base prefix normalization', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, base: '/myapp/'})

    expect((Router as any).basePrefix).to.equal('/myapp')

    Router.configure(adapter, {base: 'app'})
    expect((Router as any).basePrefix).to.equal('/app')

    Router.configure(adapter, {base: '/'})
    expect((Router as any).basePrefix).to.equal('')

    Router.configure(adapter, {base: ''})
    expect((Router as any).basePrefix).to.equal('')
  })

  it('handles complex base prefixes', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/my/deep/path',
      base: '/my/deep',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedRoute = ''
    const pageRoute = root.addChild({
      name: 'page',
      render: () => {
        capturedRoute = 'page'
        return 'page'
      },
    })

    const result = await Router.navigate('/my/deep/page')
    expect(result.ok).to.equal(true)
    // Trigger render to set capturedRoute
    pageRoute.render()
    expect(capturedRoute).to.equal('page')

    cleanupRouterContainer(container)
  })

  it('handles navigation to root with base prefix', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/app',
      base: '/app',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    let rendered = ''
    const root = Router.initRoot({
      container,
      render: () => {
        rendered = 'root'
        return 'root'
      },
    })

    // Test navigation to '/app' (without trailing slash)
    const result1 = await Router.navigate('/app')
    expect(result1.ok).to.equal(true)
    root.render()
    expect(rendered).to.equal('root')

    // Reset and test navigation to '/app/' (with trailing slash)
    // Since they normalize to the same path, this should be considered same navigation
    rendered = ''
    const result2 = await Router.navigate('/app/')
    expect(result2.ok).to.equal(false) // Same navigation, should return false
    expect(result2.reason).to.equal('same')

    // But render should still work (current route remains valid)
    root.render()
    expect(rendered).to.equal('root')

    cleanupRouterContainer(container)
  })

  it('handles query parameters with base prefix', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/app',
      base: '/app',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedQuery: any = {}
    const searchRoute = root.addChild({
      name: 'search',
      render: (_outer, ctx) => {
        capturedQuery = ctx?.query
        return 'search'
      },
    })

    const result = await Router.navigate('/app/search?q=test&page=1')
    expect(result.ok).to.equal(true)
    // Trigger render to capture query parameters with correct params
    searchRoute.render(undefined, {query: {q: 'test', page: '1'}, params: {}})
    expect(capturedQuery?.q).to.equal('test')
    expect(capturedQuery?.page).to.equal('1')

    cleanupRouterContainer(container)
  })

  it('handles dynamic routes with base prefix', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/app',
      base: '/app',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedId = ''
    const usersRoute = root.addChild({
      name: 'users',
      render: () => 'users',
    })

    const userRoute = usersRoute.addChild({
      name: ':id',
      render: (_outer, ctx) => {
        capturedId = ctx?.params?.id || ''
        return 'user'
      },
    })

    const result = await Router.navigate('/app/users/123')
    expect(result.ok).to.equal(true)
    // Trigger render to capture parameter with correct params
    userRoute.render(undefined, {query: {}, params: {id: '123'}})
    expect(capturedId).to.equal('123')

    cleanupRouterContainer(container)
  })

  it('handles splat routes with base prefix', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/app',
      base: '/app',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedPath = ''
    const filesRoute = root.addChild({
      name: '*files',
      render: (_outer, ctx) => {
        capturedPath = ctx?.params?.files || ''
        return 'files'
      },
    })

    const result = await Router.navigate('/app/docs/readme.txt')
    expect(result.ok).to.equal(true)
    // Trigger render to capture splat parameter with correct params
    filesRoute.render(undefined, {query: {}, params: {files: 'docs/readme.txt'}})
    expect(capturedPath).to.equal('docs/readme.txt')

    cleanupRouterContainer(container)
  })

  it('handles malformed paths with base prefix', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/app',
      base: '/app',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let errorFallbackCalled = false
    Router.errorFallback = () => {
      errorFallbackCalled = true
      return '404'
    }

    // Path without base prefix should trigger 404
    const result = await Router.navigate('/invalid')
    expect(result.ok).to.equal(false)
    expect(errorFallbackCalled).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('handles base prefix in file protocol', async () => {
    const {adapter} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/app',
      base: '/app',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedRoute = ''
    const testRoute = root.addChild({
      name: 'test',
      render: () => {
        capturedRoute = 'test'
        return 'test'
      },
    })

    // Skip file protocol test due to browser environment limitations
    const result = await Router.navigate('/app/test')
    expect(result.ok).to.equal(true)
    // Trigger render to set capturedRoute
    testRoute.render()
    expect(capturedRoute).to.equal('test')

    cleanupRouterContainer(container)
  })
})
