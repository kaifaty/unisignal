/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {
  Router,
  Routes,
  buildHref,
  link,
  normalizeSlashes,
  normalizeTrailing,
  getPath,
  setPath,
} from '../../../src/modules/router'
import {createRouterTestEnv} from '../fixtures/router'

describe('router: utilities', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
    // Reset base prefix
    ;(Routes as any).basePrefix = ''
  })

  afterEach(() => {
    // Reset base prefix after each test
    ;(Routes as any).basePrefix = ''
  })

  describe('Path normalization utilities', () => {
    it('normalizes slashes correctly', () => {
      expect(normalizeSlashes('/path//with///slashes')).to.equal('/path/with/slashes')
      expect(normalizeSlashes('path///slashes')).to.equal('path/slashes')
      expect(normalizeSlashes('///multiple')).to.equal('/multiple')
      expect(normalizeSlashes('normal/path')).to.equal('normal/path')
      expect(normalizeSlashes('/')).to.equal('/')
      expect(normalizeSlashes('')).to.equal('')
    })

    it('normalizes trailing slashes', () => {
      expect(normalizeTrailing('/path/')).to.equal('/path')
      expect(normalizeTrailing('/path//')).to.equal('/path/')
      expect(normalizeTrailing('/')).to.equal('/')
      expect(normalizeTrailing('path/')).to.equal('path')
      expect(normalizeTrailing('path')).to.equal('path')
      expect(normalizeTrailing('')).to.equal('')
    })
  })

  describe('Path parsing and building', () => {
    it('parses simple paths', () => {
      const result = getPath('/users/123')
      expect(result.path).to.equal('/users/123')
      expect(result.query).to.deep.equal({})
    })

    it('parses paths with query parameters', () => {
      const result = getPath('/search?q=test&page=1')
      expect(result.path).to.equal('/search')
      expect(result.query).to.deep.equal({q: 'test', page: '1'})
    })

    it('parses paths with encoded query parameters', () => {
      const result = getPath('/search?q=hello%20world&tag=react%2Brouter')
      expect(result.path).to.equal('/search')
      expect(result.query).to.deep.equal({q: 'hello world', tag: 'react+router'})
    })

    it('parses paths with multiple values for same query param', () => {
      const result = getPath('/search?tag=react&tag=vue&tag=angular')
      expect(result.path).to.equal('/search')
      expect(result.query).to.deep.equal({tag: 'angular'}) // Last value wins
    })

    it('parses paths with empty query values', () => {
      const result = getPath('/search?q=&page=1')
      expect(result.path).to.equal('/search')
      expect(result.query).to.deep.equal({q: '', page: '1'})
    })

    it('handles file protocol paths', () => {
      const {adapter} = createRouterTestEnv()
      Router.configure(adapter)

      // Mock location protocol for this specific test
      const originalProtocol = (globalThis as any).window?.location?.protocol
      if ((globalThis as any).window?.location) {
        ;(globalThis as any).window.location.protocol = 'file:'
      }

      try {
        const result = getPath('#/users/123')
        expect(result.path).to.equal('#/users/123')
      } finally {
        // Restore
        if ((globalThis as any).window?.location && originalProtocol) {
          ;(globalThis as any).window.location.protocol = originalProtocol
        }
      }
    })

    it('strips base prefix from paths', () => {
      // Set base prefix manually for this test
      ;(Routes as any).basePrefix = '/app'

      const result = getPath('/app/users/123')
      expect(result.path).to.equal('/users/123')

      // Reset
      ;(Routes as any).basePrefix = ''
    })

    it('handles paths equal to base prefix', () => {
      // Set base prefix manually for this test
      ;(Routes as any).basePrefix = '/app'

      const result = getPath('/app')
      expect(result.path).to.equal('/')

      // Reset
      ;(Routes as any).basePrefix = ''
    })

    it('sets paths with base prefix', () => {
      // Set base prefix manually for this test
      ;(Routes as any).basePrefix = '/app'

      expect(setPath('/users')).to.equal('/app/users')
      expect(setPath('/')).to.equal('/app')
      expect(setPath('')).to.equal('/app')

      // Reset
      ;(Routes as any).basePrefix = ''
    })

    it('sets paths without base prefix when empty', () => {
      // Ensure base prefix is empty
      ;(Routes as any).basePrefix = ''

      expect(setPath('/users')).to.equal('/users')
      expect(setPath('/')).to.equal('/')
    })

    it('handles file protocol in setPath', () => {
      const {adapter} = createRouterTestEnv()
      Router.configure(adapter)

      // Mock location protocol for this specific test
      const originalProtocol = (globalThis as any).window?.location?.protocol
      if ((globalThis as any).window?.location) {
        ;(globalThis as any).window.location.protocol = 'file:'
      }

      try {
        expect(setPath('/users')).to.equal('/users')
        expect(setPath('/')).to.equal('/')
      } finally {
        // Restore
        if ((globalThis as any).window?.location && originalProtocol) {
          ;(globalThis as any).window.location.protocol = originalProtocol
        }
      }
    })
  })

  describe('URL parsing', () => {
    it('parses simple path arrays', () => {
      // Test that getPath correctly parses path segments
      const result = getPath('/users/123/profile')
      expect(result.path).to.equal('/users/123/profile')
    })

    it('parses root path', () => {
      const result = getPath('/')
      expect(result.path).to.equal('/')
    })

    it('parses paths with encoded segments', () => {
      const result = getPath('/users/hello%20world/caf%C3%A9')
      expect(result.path).to.equal('/users/hello%20world/caf%C3%A9')
    })

    it('handles malformed URL encoding gracefully', () => {
      const result = getPath('/users/test%2')
      expect(result.path).to.equal('/users/test%2')
    })
  })

  describe('buildHref utility', () => {
    it('builds simple href', () => {
      // Ensure base prefix is empty
      ;(Routes as any).basePrefix = ''

      const href = buildHref({path: '/users'})
      expect(href).to.equal('/users')
    })

    it('builds href with query parameters', () => {
      // Ensure base prefix is empty
      ;(Routes as any).basePrefix = ''

      const href = buildHref({
        path: '/search',
        query: {q: 'test', page: '1'},
      })
      expect(href).to.equal('/search?q=test&page=1')
    })

    it('builds href with hash', () => {
      // Ensure base prefix is empty
      ;(Routes as any).basePrefix = ''

      const href = buildHref({
        path: '/page',
        hash: 'section',
      })
      expect(href).to.equal('/page#section')
    })

    it('builds href with existing hash prefix', () => {
      // Ensure base prefix is empty
      ;(Routes as any).basePrefix = ''

      const href = buildHref({
        path: '/page',
        hash: '#section',
      })
      expect(href).to.equal('/page#section')
    })

    it('builds href with query and hash', () => {
      // Ensure base prefix is empty
      ;(Routes as any).basePrefix = ''

      const href = buildHref({
        path: '/search',
        query: {q: 'test'},
        hash: 'results',
      })
      expect(href).to.equal('/search?q=test#results')
    })

    it('handles empty query object', () => {
      // Ensure base prefix is empty
      ;(Routes as any).basePrefix = ''

      const href = buildHref({
        path: '/page',
        query: {},
      })
      expect(href).to.equal('/page')
    })

    it('handles undefined query', () => {
      // Ensure base prefix is empty
      ;(Routes as any).basePrefix = ''

      const href = buildHref({
        path: '/page',
        query: undefined,
      })
      expect(href).to.equal('/page')
    })

    it('handles undefined hash', () => {
      // Ensure base prefix is empty
      ;(Routes as any).basePrefix = ''

      const href = buildHref({
        path: '/page',
        hash: undefined,
      })
      expect(href).to.equal('/page')
    })

    it('encodes special characters in query', () => {
      // Ensure base prefix is empty
      ;(Routes as any).basePrefix = ''

      const href = buildHref({
        path: '/search',
        query: {q: 'hello world', tag: 'react+vue'},
      })
      expect(href).to.equal('/search?q=hello+world&tag=react%2Bvue')
    })

    it('handles base prefix in buildHref', () => {
      // Set base prefix manually for this test
      ;(Routes as any).basePrefix = '/app'

      const href = buildHref({path: '/users'})
      expect(href).to.equal('/app/users')

      // Reset
      ;(Routes as any).basePrefix = ''
    })
  })

  describe('link utility', () => {
    it('sets href attribute on anchor element', () => {
      const anchor = document.createElement('a')
      const hrefOptions = {path: '/users', query: {page: '1'}}

      link(anchor, hrefOptions)

      expect(anchor.getAttribute('href')).to.equal('/users?page=1')
    })

    it('handles complex href options', () => {
      const anchor = document.createElement('a')
      const hrefOptions = {
        path: '/search',
        query: {q: 'test'},
        hash: 'results',
      }

      link(anchor, hrefOptions)

      expect(anchor.getAttribute('href')).to.equal('/search?q=test#results')
    })

    it('overwrites existing href', () => {
      const anchor = document.createElement('a')
      anchor.setAttribute('href', '/old')

      link(anchor, {path: '/new'})

      expect(anchor.getAttribute('href')).to.equal('/new')
    })
  })

  describe('Path utilities integration', () => {
    it('handles complex path normalization', () => {
      // Complex path with multiple slashes and query
      const original = '//users//123//profile//?q=test&page=1'
      const parsed = getPath(original)
      const rebuilt =
        setPath(parsed.path) +
        (Object.keys(parsed.query).length ? '?' + new URLSearchParams(parsed.query).toString() : '')

      expect(parsed.path).to.equal('/users/123/profile')
      expect(rebuilt).to.equal('/users/123/profile?q=test&page=1')
    })

    it('preserves query parameter order in complex scenarios', () => {
      const result = getPath('/search?a=1&b=2&c=3&a=override')
      expect(result.query).to.deep.equal({a: 'override', b: '2', c: '3'})
    })

    it('handles empty path segments correctly', () => {
      // Test that getPath properly normalizes paths with extra slashes
      const result = getPath('/users///123//')
      expect(result.path).to.equal('/users/123')
    })
  })
})
