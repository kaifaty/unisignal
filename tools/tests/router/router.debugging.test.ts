/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'

describe('router: debugging', () => {
  let logMessages: any[] = []
  let debugLogger: any

  beforeEach(() => {
    Router.__resetLoopForTests()
    logMessages = []

    debugLogger = (msg: string, ctx?: any) => {
      logMessages.push({msg, ctx})
    }
  })

  afterEach(() => {
    try {
      Router.stop()
    } catch {}
    ;(Router as any).debug = false
    try {
      const {url} = require('../../../src/modules/url')
      ;(url as any).dispose?.()
      ;(url as any).__resetForTests?.()
    } catch {}
  })

  it('does not log when debug is false', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {debug: false})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    await Router.navigate('/test')

    expect(logMessages.length).to.equal(0)

    cleanupRouterContainer(container)
  })

  it('logs with boolean debug true', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {debug: true})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    await Router.navigate('/test')

    expect(logMessages.length).to.be.greaterThan(0)
    expect(logMessages.some((log) => log.msg.includes('[router]'))).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('logs with custom logger function', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {debug: {logger: debugLogger}})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    await Router.navigate('/test')

    expect(logMessages.length).to.be.greaterThan(0)
    expect(logMessages[0]).to.have.property('msg')
    expect(logMessages[0]).to.have.property('ctx')

    cleanupRouterContainer(container)
  })

  it('logs start and stop events', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {debug: {logger: debugLogger}})

    Router.start()
    expect(logMessages.some((log) => log.msg.includes('start'))).to.equal(true)

    logMessages = [] // Clear messages

    Router.stop()
    expect(logMessages.some((log) => log.msg.includes('stop'))).to.equal(true)
  })

  it('logs navigation events', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {debug: {logger: debugLogger}})

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

    await Router.navigate('/page')

    const navigateLogs = logMessages.filter((log) => log.msg.includes('navigate'))
    expect(navigateLogs.length).to.be.greaterThan(0)

    const navigateLog = navigateLogs[0]
    expect(navigateLog.ctx).to.have.property('from')
    expect(navigateLog.ctx).to.have.property('to')
    expect(navigateLog.ctx).to.have.property('ok')

    cleanupRouterContainer(container)
  })

  it('logs blocked navigation', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {debug: {logger: debugLogger}})
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

    await Router.navigate('/blocked')

    const blockedLogs = logMessages.filter((log) => log.msg.includes('blocked'))
    expect(blockedLogs.length).to.be.greaterThan(0)

    const blockedLog = blockedLogs[0]
    expect(blockedLog.ctx).to.have.property('from')
    expect(blockedLog.ctx).to.have.property('to')

    cleanupRouterContainer(container)
  })

  it('logs redirected navigation', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {debug: {logger: debugLogger}})
    Router.beforeEach = () => '/redirect'

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'redirect',
      render: () => 'redirect',
    })

    await Router.navigate('/original')

    const redirectLogs = logMessages.filter((log) => log.msg.includes('redirected'))
    expect(redirectLogs.length).to.be.greaterThan(0)

    cleanupRouterContainer(container)
  })

  it('handles logger errors gracefully', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const failingLogger = () => {
      throw new Error('Logger failed')
    }

    Router.configure(adapter, {debug: {logger: failingLogger}})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    // This should not throw despite logger failing
    await Router.navigate('/test')

    cleanupRouterContainer(container)
  })

  it('logs click events', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {debug: {logger: debugLogger}})

    const mockEvent = {
      button: 0,
      defaultPrevented: false,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      preventDefault: () => {},
      composedPath: () => [
        {
          tagName: 'A',
          target: '',
          hasAttribute: () => false,
          getAttribute: (attr: string) => (attr === 'href' ? '/test' : null),
          href: 'http://localhost/test',
          origin: 'http://localhost',
          pathname: '/test',
        },
      ],
    }

    ;(Router as any)._onClick(mockEvent)

    const clickLogs = logMessages.filter((log) => log.msg.includes('click'))
    expect(clickLogs.length).to.be.greaterThan(0)

    const clickLog = clickLogs[0]
    expect(clickLog.ctx).to.have.property('href')
  })

  it('does not log when debug logger is not a function', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    Router.configure(adapter, {debug: {logger: 'not a function'}})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    // Should not throw
    expect(() => Router.start()).to.not.throw()

    cleanupRouterContainer(container)
  })

  it('logs with default console.debug when no custom logger', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    // Mock console.debug
    const originalDebug = console.debug
    let debugCalled = false
    let debugArgs: any[] = []

    console.debug = (...args: any[]) => {
      debugCalled = true
      debugArgs = args
    }

    Router.configure(adapter, {debug: true})

    Router.start()

    expect(debugCalled).to.equal(true)
    expect(debugArgs[0]).to.include('[router]')

    // Restore
    console.debug = originalDebug
  })

  it('handles undefined context in logger', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    let loggedWithUndefined = false
    const logger = (msg: string, ctx?: any) => {
      if (ctx === undefined) {
        loggedWithUndefined = true
      }
      logMessages.push({msg, ctx})
    }

    Router.configure(adapter, {debug: {logger}})

    const container = document.createElement('div')
    document.body.appendChild(container)

    Router.initRoot({
      container,
      render: () => 'root',
    })

    expect(loggedWithUndefined).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('logs complex navigation context', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/home'})

    Router.configure(adapter, {debug: {logger: debugLogger}})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root
      .addChild({
        name: 'users',
        render: () => 'users',
      })
      .addChild({
        name: ':id',
        render: () => 'user',
      })

    await Router.navigate('/users/123?q=search&page=1')

    const navigateLogs = logMessages.filter((log) => log.msg.includes('navigate'))
    expect(navigateLogs.length).to.be.greaterThan(0)

    const navigateLog = navigateLogs[0]
    expect(navigateLog.ctx.from.path).to.equal('/home')
    expect(navigateLog.ctx.to.path).to.equal('/users/123')
    expect(navigateLog.ctx.to.query.q).to.equal('search')
    expect(navigateLog.ctx.to.params.id).to.equal('123')

    cleanupRouterContainer(container)
  })
})
