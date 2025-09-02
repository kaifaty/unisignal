/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'

describe('router: rendering', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  it('renders root route without outer function', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root content',
    })

    const result = root.render()
    expect(result).to.equal('root content')

    cleanupRouterContainer(container)
  })

  it('renders child route with outer function', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: (outer) => `root(${outer?.()})`,
    })

    const child = root.addChild({
      name: 'page',
      render: (outer) => outer?.() || 'page content',
    })

    const result = child.render()
    expect(result).to.equal('root(page content)')

    cleanupRouterContainer(container)
  })

  it('renders nested routes with multiple outer functions', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: (outer) => `root[${outer?.()}]`,
    })

    const layout = root.addChild({
      name: 'app',
      render: (outer) => `layout(${outer?.()})`,
    })

    const page = layout.addChild({
      name: 'dashboard',
      render: (outer) => outer?.() || 'dashboard content',
    })

    const result = page.render()
    expect(result).to.equal('root[layout(dashboard content)]')

    cleanupRouterContainer(container)
  })

  it('passes context to render functions', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: (_outer, ctx) => `root query: ${ctx?.query?.test || 'none'}`,
    })

    let capturedContext: any = null
    const child = root.addChild({
      name: 'page',
      render: (_outer, ctx) => {
        capturedContext = ctx
        return `page param: ${ctx?.params?.id || 'none'}`
      },
    })

    // Test root render without context
    const rootResult = root.render()
    expect(rootResult).to.equal('root query: none')

    // Test child render with context
    const childResult = child.render(undefined, {
      query: {test: 'value'},
      params: {id: '123'},
    })
    expect(childResult).to.equal('page param: 123')
    expect(capturedContext?.query?.test).to.equal('value')
    expect(capturedContext?.params?.id).to.equal('123')

    cleanupRouterContainer(container)
  })

  it('handles render functions that return undefined', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => undefined,
    })

    const result = root.render()
    expect(result).to.be.undefined

    cleanupRouterContainer(container)
  })

  it('handles render functions that return null', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => null,
    })

    const result = root.render()
    expect(result).to.be.null

    cleanupRouterContainer(container)
  })

  it('handles render functions that return complex objects', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => ({type: 'component', props: {name: 'test'}}),
    })

    const result = root.render()
    expect(result).to.deep.equal({type: 'component', props: {name: 'test'}})

    cleanupRouterContainer(container)
  })

  it('renders with default renderFunction (Lit)', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'test content',
    })

    // Mock lit render to verify it's called
    let litRenderCalled = false
    let litRenderArgs: any[] = []
    const originalRenderFunction = (Router as any).renderFunction
    ;(Router as any).renderFunction = (...args: any[]) => {
      litRenderCalled = true
      litRenderArgs = args
    }

    const result = root.render()
    ;(Router as any).renderFunction('test content', container)

    expect(litRenderCalled).to.equal(true)
    expect(litRenderArgs[0]).to.equal('test content')
    expect(litRenderArgs[1]).to.equal(container)

    // Restore
    ;(Router as any).renderFunction = originalRenderFunction

    cleanupRouterContainer(container)
  })

  it('handles custom renderFunction', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    let customRenderCalled = false
    let customRenderArgs: any[] = []
    ;(Router as any).renderFunction = (...args: any[]) => {
      customRenderCalled = true
      customRenderArgs = args
      return 'custom rendered'
    }

    const root = Router.initRoot({
      container,
      render: () => 'test content',
    })

    const result = root.render()
    ;(Router as any).renderFunction(result, container)

    expect(customRenderCalled).to.equal(true)
    expect(customRenderArgs[0]).to.equal('test content')
    expect(customRenderArgs[1]).to.equal(container)

    cleanupRouterContainer(container)
  })

  it('renders to container when root element exists', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    let renderContent = ''
    const root = Router.initRoot({
      container,
      render: () => {
        renderContent = 'rendered content'
        return renderContent
      },
    })

    root.addChild({
      name: 'test',
      render: () => 'test page',
    })

    // Navigate to trigger rendering
    await Router.navigate('/test')

    expect(renderContent).to.equal('rendered content')

    cleanupRouterContainer(container)
  })

  it('handles missing container gracefully', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    // Initialize without container
    const root = Router.initRoot({
      render: () => 'content without container',
    })

    root.addChild({
      name: 'test',
      render: () => 'test page',
    })

    // Mock console.warn
    const originalWarn = console.warn
    let warningMessage = ''
    console.warn = (msg: string) => {
      warningMessage = msg
    }

    await (Router as any).__goto({path: '/test', query: {}})

    expect(warningMessage).to.include('Router root element not found')

    // Restore
    console.warn = originalWarn
  })

  it('handles outer function returning undefined', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: (outer) => {
        const inner = outer?.()
        return inner ? `wrapped(${inner})` : 'empty'
      },
    })

    const child = root.addChild({
      name: 'page',
      render: (outer) => outer?.() || undefined,
    })

    const result = child.render()
    expect(result).to.equal('empty')

    cleanupRouterContainer(container)
  })

  it('handles deeply nested render chains', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: (outer) => `level1(${outer?.()})`,
    })

    const level2 = root.addChild({
      name: 'level2',
      render: (outer) => `level2(${outer?.()})`,
    })

    const level3 = level2.addChild({
      name: 'level3',
      render: (outer) => `level3(${outer?.()})`,
    })

    const page = level3.addChild({
      name: 'page',
      render: (outer) => outer?.() || 'content',
    })

    const result = page.render()
    expect(result).to.equal('level1(level2(level3(content)))')

    cleanupRouterContainer(container)
  })

  it('preserves render context through nested calls', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: (outer, ctx) => `root(q=${ctx?.query?.test})[${outer?.()}]`,
    })

    const child = root.addChild({
      name: 'page',
      render: (outer, ctx) => {
        const pageContent = `page(p=${ctx?.params?.id})`
        return outer?.() || pageContent
      },
    })

    const context = {
      query: {test: 'value'},
      params: {id: '123'},
    }

    const result = child.render(undefined, context)
    expect(result).to.equal('root(q=value)[page(p=123)]')

    cleanupRouterContainer(container)
  })
})
