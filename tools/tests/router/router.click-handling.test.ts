/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'

describe('router: click handling', () => {
  let mockEvent: any
  let mockAnchor: any

  beforeEach(() => {
    Router.__resetLoopForTests()

    // Mock anchor element
    mockAnchor = {
      tagName: 'A',
      target: '',
      hasAttribute: (attr: string) => false,
      getAttribute: (attr: string) => {
        if (attr === 'href') return '/test'
        return null
      },
      href: 'http://localhost:8000/test',
      origin: 'http://localhost:8000',
      pathname: '/test',
      search: '',
      hash: '',
    }

    // Mock mouse event
    mockEvent = {
      button: 0,
      defaultPrevented: false,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      preventDefault: () => {
        mockEvent.defaultPrevented = true
      },
      composedPath: () => [mockAnchor],
    }
  })

  afterEach(() => {
    // Clean up event listeners
    window.removeEventListener('click', (Router as any)._onClick)
  })

  it('handles basic link clicks', async () => {
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

    // Manually call the click handler
    ;(Router as any)._onClick(mockEvent)

    expect(mockEvent.defaultPrevented).to.equal(true)
  })

  it('ignores non-navigation clicks', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    // Test middle button click
    mockEvent.button = 1
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)

    // Reset
    mockEvent.defaultPrevented = false
    mockEvent.button = 0

    // Test ctrl+click
    mockEvent.ctrlKey = true
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)

    // Reset
    mockEvent.defaultPrevented = false
    mockEvent.ctrlKey = false

    // Test meta+click
    mockEvent.metaKey = true
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)

    // Reset
    mockEvent.defaultPrevented = false
    mockEvent.metaKey = false

    // Test shift+click
    mockEvent.shiftKey = true
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)
  })

  it('ignores clicks on non-anchor elements', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    // Mock div element
    const mockDiv = {
      tagName: 'DIV',
    }

    mockEvent.composedPath = () => [mockDiv]
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)
  })

  it('ignores links with target attribute', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    mockAnchor.target = '_blank'
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)
  })

  it('ignores links with download attribute', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    mockAnchor.hasAttribute = (attr: string) => attr === 'download'
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)
  })

  it('ignores links with external rel attribute', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    mockAnchor.getAttribute = (attr: string) => {
      if (attr === 'rel') return 'external'
      if (attr === 'href') return '/test'
      return null
    }
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)
  })

  it('ignores mailto links', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    mockAnchor.href = 'mailto:test@example.com'
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)
  })

  it('ignores empty href links', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    mockAnchor.href = ''
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)
  })

  it('ignores external origin links', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    mockAnchor.origin = 'https://external.com'
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(false)
  })

  it('handles links with query parameters', async () => {
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
        capturedQuery = ctx?.query
        return 'search'
      },
    })

    mockAnchor.getAttribute = (attr: string) => {
      if (attr === 'href') return '/search?q=test&page=1'
      return null
    }
    mockAnchor.pathname = '/search'
    mockAnchor.search = '?q=test&page=1'

    // Wait for navigation to complete
    await new Promise(resolve => setTimeout(resolve, 0))
    ;(Router as any)._onClick(mockEvent)

    // Wait a bit for the navigation to process
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(capturedQuery.q).to.equal('test')
    expect(capturedQuery.page).to.equal('1')

    cleanupRouterContainer(container)
  })

  it('handles links with hash', () => {
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

    mockAnchor.getAttribute = (attr: string) => {
      if (attr === 'href') return '/page#section'
      return null
    }
    mockAnchor.pathname = '/page'
    mockAnchor.hash = '#section'
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('handles file protocol links', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    // Skip this test if we can't mock location protocol
    if (window.location.protocol === 'file:') {
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

      mockAnchor.getAttribute = (attr: string) => {
        if (attr === 'href') return '#/test'
        return null
      }
      mockAnchor.pathname = ''
      mockAnchor.hash = '#/test'
      ;(Router as any)._onClick(mockEvent)
      expect(mockEvent.defaultPrevented).to.equal(true)

      cleanupRouterContainer(container)
    } else {
      // Test that the logic doesn't crash when protocol is not file:
      mockAnchor.getAttribute = (attr: string) => {
        if (attr === 'href') return '/test'
        return null
      }
      mockAnchor.pathname = '/test'
      ;(Router as any)._onClick(mockEvent)
      expect(mockEvent.defaultPrevented).to.equal(true)
    }
  })

  it('handles already prevented events', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    mockEvent.defaultPrevented = true
    ;(Router as any)._onClick(mockEvent)
    // Should not change the prevented state
    expect(mockEvent.defaultPrevented).to.equal(true)
  })

  it('handles nested anchor elements', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'inner',
      render: () => 'inner page',
    })

    // Create real DOM elements for more realistic testing
    const realSpan = document.createElement('span')
    const realAnchor = document.createElement('a')
    realAnchor.href = '/inner'
    realSpan.appendChild(realAnchor)

    // Mock composedPath to return real elements
    mockEvent.composedPath = () => [realSpan, realAnchor]

    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('handles links without href attribute but with pathname', () => {
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

    mockAnchor.getAttribute = (attr: string) => {
      if (attr === 'href') return null
      return null
    }
    mockAnchor.pathname = '/test'
    ;(Router as any)._onClick(mockEvent)
    expect(mockEvent.defaultPrevented).to.equal(true)

    cleanupRouterContainer(container)
  })

  it('handles same href as current location', () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/current'})

    mockAnchor.getAttribute = (attr: string) => {
      if (attr === 'href') return window.location.href
      return null
    }
    mockAnchor.pathname = window.location.pathname
    mockAnchor.href = window.location.href

    ;(Router as any)._onClick(mockEvent)
    // Same href should still prevent default (navigation logic should handle it)
    expect(mockEvent.defaultPrevented).to.equal(true)
  })
})
