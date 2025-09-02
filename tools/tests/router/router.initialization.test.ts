/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'
import type {SignalAdapter} from '../../../src/modules/adapter/types'

describe('router: initialization', () => {
  let originalRootNode: any
  let originalCurrentRoute: any
  let originalRootElement: any

  beforeEach(() => {
    originalRootNode = (Router as any).rootNode
    originalCurrentRoute = (Router as any).currentRoute
    originalRootElement = (Router as any).rootElement
    ;(Router as any).rootNode = undefined
    ;(Router as any).currentRoute = undefined
    ;(Router as any).rootElement = undefined
    ;(Router as any).history = []
  })

  afterEach(() => {
    ;(Router as any).rootNode = originalRootNode
    ;(Router as any).currentRoute = originalCurrentRoute
    ;(Router as any).rootElement = originalRootElement
  })

  it('initializes root with container', () => {
    const {adapter} = createRouterTestEnv()
    Router.configure(adapter)

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'test content',
    })

    expect(root).to.not.be.undefined
    expect((Router as any).rootNode).to.equal(root)
    expect((Router as any).rootElement).to.equal(container)
    expect(root.name).to.equal('/')

    cleanupRouterContainer(container)
  })

  it('initializes root with injectSelector', () => {
    const {adapter} = createRouterTestEnv()
    Router.configure(adapter)

    const container = document.createElement('div')
    container.id = 'test-root'
    document.body.appendChild(container)

    const root = Router.initRoot({
      injectSelector: '#test-root',
      render: () => 'test content',
    })

    expect(root).to.not.be.undefined
    expect((Router as any).rootNode).to.equal(root)
    expect((Router as any).rootElement).to.equal(container)

    cleanupRouterContainer(container)
  })

  it('initializes root with entry guard', () => {
    const {adapter} = createRouterTestEnv()
    Router.configure(adapter)

    const container = document.createElement('div')
    document.body.appendChild(container)

    let entryCalled = false
    const root = Router.initRoot({
      container,
      render: () => 'test content',
      entry: () => {
        entryCalled = true
        return true
      },
    })

    expect(root).to.not.be.undefined
    expect(entryCalled).to.equal(false) // entry should not be called during init

    cleanupRouterContainer(container)
  })

  it('initializes root without container or injectSelector', () => {
    const {adapter} = createRouterTestEnv()
    Router.configure(adapter)

    const root = Router.initRoot({
      render: () => 'test content',
    })

    expect(root).to.not.be.undefined
    expect((Router as any).rootNode).to.equal(root)
    expect((Router as any).rootElement).to.be.undefined
  })

  it('throws error when creating route with wrong constructor', () => {
    const {adapter} = createRouterTestEnv()
    Router.configure(adapter)

    expect(() => {
      new (Router as any)('wrong-symbol', '/', () => 'test')
    }).to.throw('Create new route with static initRoot or addChild functions')
  })

  it('adds child routes correctly', () => {
    const {adapter} = createRouterTestEnv()
    Router.configure(adapter)

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    const child = root.addChild({
      name: 'test',
      render: () => 'child',
    })

    expect(child).to.not.be.undefined
    expect(child.name).to.equal('test')
    expect(child.parent).to.equal(root)
    expect((root as any).children).to.include(child)

    cleanupRouterContainer(container)
  })

  it('adds child with entry guard', () => {
    const {adapter} = createRouterTestEnv()
    Router.configure(adapter)

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let entryCalled = false
    const child = root.addChild({
      name: 'protected',
      render: () => 'protected',
      entry: () => {
        entryCalled = true
        return true
      },
    })

    expect(child).to.not.be.undefined
    expect(typeof (child as any).entry).to.equal('function')

    cleanupRouterContainer(container)
  })

  it('gets full path for nested routes', () => {
    const {adapter} = createRouterTestEnv()
    Router.configure(adapter)

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

  it('renders nested routes correctly', () => {
    const {adapter} = createRouterTestEnv()
    Router.configure(adapter)

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: (outer) => {
        const inner = outer?.()
        return `root(${inner})`
      },
    })

    const child = root.addChild({
      name: 'test',
      render: (outer) => {
        // Child render should call outer with its content
        return outer?.() || 'child'
      },
    })

    const result = child.render()
    expect(result).to.equal('root(child)')

    cleanupRouterContainer(container)
  })
})
