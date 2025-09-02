/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'

describe('router: guards and hooks', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  afterEach(() => {
    // Reset hooks
    Router.beforeEach = undefined
    Router.afterEach = undefined
    Router.onNavigate = undefined
  })

  describe('Entry guards', () => {
    it('blocks navigation when entry returns false', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      root.addChild({
        name: 'protected',
        render: () => 'protected',
        entry: () => false,
      })

      const result = await Router.navigate('/protected')
      expect(result.ok).to.equal(false)

      cleanupRouterContainer(container)
    })

    it('allows navigation when entry returns true', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      let rendered = false
      root.addChild({
        name: 'allowed',
        render: () => {
          rendered = true
          return 'allowed'
        },
        entry: () => true,
      })

      const result = await Router.navigate('/allowed')
      expect(result.ok).to.equal(true)
      expect(rendered).to.equal(true)

      cleanupRouterContainer(container)
    })

    it('redirects when entry returns string', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      root.addChild({
        name: 'login',
        render: () => 'login',
      })

      root.addChild({
        name: 'dashboard',
        render: () => 'dashboard',
        entry: () => '/login',
      })

      const result = await Router.navigate('/dashboard')
      expect(result.ok).to.equal(false)
      expect(result.reason).to.equal('redirected')
      expect(result.redirectedTo).to.equal('/login')

      cleanupRouterContainer(container)
    })

    it('passes correct context to entry guard', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/home'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      let capturedContext: any = null
      root.addChild({
        name: 'test',
        render: () => 'test',
        entry: (ctx) => {
          capturedContext = ctx
          return true
        },
      })

      await Router.navigate('/test?q=search')

      expect(capturedContext).to.not.be.null
      expect(capturedContext.from.path).to.equal('/home')
      expect(capturedContext.to.path).to.equal('/test')
      expect(capturedContext.to.query.q).to.equal('search')
      expect(capturedContext.node.name).to.equal('test')

      cleanupRouterContainer(container)
    })

    it('supports async entry guards', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      let rendered = false
      root.addChild({
        name: 'async',
        render: () => {
          rendered = true
          return 'async'
        },
        entry: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return true
        },
      })

      const result = await Router.navigate('/async')
      expect(result.ok).to.equal(true)
      expect(rendered).to.equal(true)

      cleanupRouterContainer(container)
    })

    it('blocks navigation for nested routes with failing entry', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      const users = root.addChild({
        name: 'users',
        render: () => 'users',
        entry: () => true, // Parent allows
      })

      users.addChild({
        name: ':id',
        render: () => 'user',
        entry: () => false, // Child blocks
      })

      const result = await Router.navigate('/users/123')
      expect(result.ok).to.equal(false)

      cleanupRouterContainer(container)
    })
  })

  describe('Global hooks', () => {
    it('calls beforeEach hook before navigation', async () => {
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

      let beforeEachCalled = false
      let beforeEachContext: any = null
      Router.beforeEach = (ctx) => {
        beforeEachCalled = true
        beforeEachContext = ctx
        return true
      }

      await Router.navigate('/test?q=1')

      expect(beforeEachCalled).to.equal(true)
      expect(beforeEachContext.from.path).to.equal('/')
      expect(beforeEachContext.to.path).to.equal('/test')
      expect(beforeEachContext.to.query.q).to.equal('1')

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

      const result = await Router.navigate('/original')
      expect(result.ok).to.equal(false)
      expect(result.reason).to.equal('redirected')
      expect(result.redirectedTo).to.equal('/redirect')

      cleanupRouterContainer(container)
    })

    it('calls afterEach hook after successful navigation', async () => {
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

      let afterEachCalled = false
      let afterEachContext: any = null
      Router.afterEach = (ctx) => {
        afterEachCalled = true
        afterEachContext = ctx
      }

      await Router.navigate('/test')

      expect(afterEachCalled).to.equal(true)
      expect(afterEachContext.from.path).to.equal('/')
      expect(afterEachContext.to.path).to.equal('/test')

      cleanupRouterContainer(container)
    })

    it('calls onNavigate for successful navigation', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      root.addChild({
        name: 'success',
        render: () => 'success',
      })

      const events: any[] = []
      Router.onNavigate = (event) => {
        events.push(event)
      }

      await Router.navigate('/success')

      expect(events.length).to.equal(1)
      expect(events[0].status).to.equal('success')
      expect(events[0].from).to.equal('/')
      expect(events[0].to).to.equal('/success')
      expect(events[0].redirectedTo).to.be.undefined

      cleanupRouterContainer(container)
    })

    it('calls onNavigate for blocked navigation', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      Router.beforeEach = () => false

      const events: any[] = []
      Router.onNavigate = (event) => {
        events.push(event)
      }

      const result = await Router.navigate('/blocked')
      expect(result.ok).to.equal(false)

      expect(events.length).to.equal(1)
      expect(events[0].status).to.equal('blocked')
      expect(events[0].from).to.equal('/')
      expect(events[0].to).to.equal('/blocked')
    })

    it('calls onNavigate for not found navigation', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      Router.initRoot({
        container,
        render: () => 'root',
      })

      const events: any[] = []
      Router.onNavigate = (event) => {
        events.push(event)
      }

      const result = await Router.navigate('/nonexistent')
      expect(result.ok).to.equal(false)

      expect(events.length).to.equal(1)
      expect(events[0].status).to.equal('notFound')
      expect(events[0].from).to.equal('')
      expect(events[0].to).to.equal('/nonexistent')

      cleanupRouterContainer(container)
    })

    it('supports async hooks', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      root.addChild({
        name: 'async',
        render: () => 'async',
      })

      const hookOrder: string[] = []
      Router.beforeEach = async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        hookOrder.push('beforeEach')
        return true
      }

      Router.afterEach = async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        hookOrder.push('afterEach')
      }

      await Router.navigate('/async')

      expect(hookOrder).to.deep.equal(['beforeEach', 'afterEach'])

      cleanupRouterContainer(container)
    })
  })
})
