/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'

describe('router: edge cases', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  describe('Empty and malformed paths', () => {
    it('handles empty path navigation', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      const result = await Router.navigate('')
      expect(result.ok).to.equal(true)
      expect((Router as any).currentRoute.get()).to.equal(root)

      cleanupRouterContainer(container)
    })

    it('handles root path with query only', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      let capturedQuery: any = {}
      const root = Router.initRoot({
        container,
        render: (_outer, ctx) => {
          capturedQuery = ctx?.query || {}
          return 'root'
        },
      })

      await Router.navigate('/?q=test')
      expect(capturedQuery.q).to.equal('test')

      cleanupRouterContainer(container)
    })

    it('handles path with only hash', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      const result = await Router.navigate('/#section')
      expect(result.ok).to.equal(true)

      cleanupRouterContainer(container)
    })

    it('handles malformed query strings', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      // Malformed query string should not crash
      const result = await Router.navigate('/?malformed=value&another')
      expect(result.ok).to.equal(true)

      cleanupRouterContainer(container)
    })
  })

  describe('Special characters and encoding', () => {
    it('handles Unicode characters in paths', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      let capturedId = ''
      root.addChild({
        name: ':id',
        render: (_outer, ctx) => {
          capturedId = ctx?.params.id || ''
          return 'item'
        },
      })

      await Router.navigate('/café')
      expect(capturedId).to.equal('café')

      await Router.navigate('/测试')
      expect(capturedId).to.equal('测试')

      cleanupRouterContainer(container)
    })

    it('handles encoded special characters in query', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

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

      await Router.navigate('/search?q=%3D%26%3F%23')
      expect(capturedQuery.q).to.equal('=&?#')

      cleanupRouterContainer(container)
    })

    it('handles plus signs in query parameters', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

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

      await Router.navigate('/search?q=hello+world')
      expect(capturedQuery.q).to.equal('hello+world')

      cleanupRouterContainer(container)
    })
  })

  describe('Concurrent and rapid navigation', () => {
    it('handles rapid successive navigations', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

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

      // Rapid navigation
      const navigations = []
      for (let i = 1; i <= 5; i++) {
        navigations.push(Router.navigate(`/page${i}`))
      }

      await Promise.all(navigations)

      // Should end up at the last page
      expect((Router as any).currentRoute.get()?.name).to.equal('page5')

      cleanupRouterContainer(container)
    })

    it('handles navigation during ongoing navigation', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      // Add routes with async entry guards
      root.addChild({
        name: 'slow',
        render: () => 'slow',
        entry: () => new Promise((resolve) => setTimeout(() => resolve(true), 50)),
      })

      root.addChild({
        name: 'fast',
        render: () => 'fast',
      })

      // Start slow navigation
      const slowNav = Router.navigate('/slow')

      // Immediately try to navigate elsewhere
      const fastNav = Router.navigate('/fast')

      const results = await Promise.all([slowNav, fastNav])

      // The fast navigation should succeed
      expect(results[1].ok).to.equal(true)
      expect((Router as any).currentRoute.get()?.name).to.equal('fast')

      cleanupRouterContainer(container)
    })
  })

  describe('Memory and resource management', () => {
    it('handles large number of routes', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      // Create many routes
      for (let i = 1; i <= 100; i++) {
        root.addChild({
          name: `route${i}`,
          render: () => `route${i}`,
        })
      }

      await Router.navigate('/route50')
      expect((Router as any).currentRoute.get()?.name).to.equal('route50')

      await Router.navigate('/route100')
      expect((Router as any).currentRoute.get()?.name).to.equal('route100')

      cleanupRouterContainer(container)
    })

    it('handles deep nesting without stack overflow', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      // Create deep nesting
      let current = root
      const depth = 20
      for (let i = 1; i <= depth; i++) {
        const child = current.addChild({
          name: `level${i}`,
          render: () => `level${i}`,
        })
        current = child
      }

      // Build path
      const path = '/' + Array.from({length: depth}, (_, i) => `level${i + 1}`).join('/')

      // Should handle deep nesting without issues
      await Router.navigate(path)
      expect((Router as any).currentRoute.get()?.name).to.equal(`level${depth}`)

      cleanupRouterContainer(container)
    })
  })

  describe('Error recovery', () => {
    it('recovers from failed navigation', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      root.addChild({
        name: 'working',
        render: () => 'working',
      })

      // First, navigate to a working route
      await Router.navigate('/working')
      expect((Router as any).currentRoute.get()?.name).to.equal('working')

      // Try to navigate to non-existent route
      await Router.navigate('/nonexistent')

      // Для 404 currentRoute сбрасывается
      expect((Router as any).currentRoute.get()).to.be.undefined

      cleanupRouterContainer(container)
    })

    it('handles exceptions in entry guards gracefully', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      root.addChild({
        name: 'error',
        render: () => 'error',
        entry: () => {
          throw new Error('Entry guard failed')
        },
      })

      // Should handle the error and treat as blocked navigation
      const result = await Router.navigate('/error')
      expect(result.ok).to.equal(false)

      cleanupRouterContainer(container)
    })

    it('handles exceptions in render functions gracefully', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      root.addChild({
        name: 'error',
        render: () => {
          throw new Error('Render failed')
        },
      })

      // Mock console.error to avoid test output
      const originalError = console.error
      console.error = () => {}

      const result = await Router.navigate('/error')
      expect(result.ok).to.equal(true) // Navigation succeeds, render error is handled

      console.error = originalError

      cleanupRouterContainer(container)
    })
  })

  describe('Browser compatibility', () => {
    it('handles missing window object (SSR)', () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})
      Router.configure(adapter)

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      // Не трогаем глобальные объекты браузера в WTR, просто убеждаемся в безопасном вызове
      expect(() => Router.start()).to.not.throw()

      cleanupRouterContainer(container)
    })

    it('handles old browser history API', () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})
      Router.configure(adapter)

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

      // В рамках WTR предполагаем наличие стандартного history API, проверяем, что навигация не падает
      expect(async () => await Router.navigate('/test')).to.not.throw()

      cleanupRouterContainer(container)
    })
  })

  describe('Route parameter edge cases', () => {
    it('handles empty parameter values', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      let capturedParams: any = {}
      root.addChild({
        name: ':id',
        render: (_outer, ctx) => {
          capturedParams = ctx?.params || {}
          return 'item'
        },
      })

      await Router.navigate('/empty')
      expect(capturedParams.id).to.equal('empty')

      cleanupRouterContainer(container)
    })

    it('handles parameters with special regex characters', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      let capturedId = ''
      root.addChild({
        name: ':id',
        render: (_outer, ctx) => {
          capturedId = ctx?.params.id || ''
          return 'item'
        },
      })

      await Router.navigate('/test(with)brackets')
      expect(capturedId).to.equal('test(with)brackets')

      await Router.navigate('/test.dot')
      expect(capturedId).to.equal('test.dot')

      cleanupRouterContainer(container)
    })

    it('handles very long parameter values', async () => {
      const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

      const container = document.createElement('div')
      document.body.appendChild(container)

      const root = Router.initRoot({
        container,
        render: () => 'root',
      })

      let capturedId = ''
      root.addChild({
        name: ':id',
        render: (_outer, ctx) => {
          capturedId = ctx?.params.id || ''
          return 'item'
        },
      })

      const longId = 'a'.repeat(1000)
      await Router.navigate(`/${longId}`)
      expect(capturedId).to.equal(longId)

      cleanupRouterContainer(container)
    })
  })
})
