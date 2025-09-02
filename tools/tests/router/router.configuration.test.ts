/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import type {SignalAdapter, SignalWritable} from '../../../src/modules/adapter/types'

function createTestSignalAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      const listeners = new Set<(v: T) => void>()
      return {
        get(): T {
          return value
        },
        set(v: T): void {
          value = v
          listeners.forEach((l) => l(value))
        },
        peek(): T {
          return value
        },
        subscribe(listener: (v: T) => void) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    },
    computed<T>(_fn: () => T) {
      throw new Error('not needed')
    },
  }
}

describe('router: configuration', () => {
  let originalSignals: any
  let originalDebug: any
  let originalHistoryMax: any
  let originalBasePrefix: any

  beforeEach(() => {
    // Save original state
    originalSignals = (Router as any)._signals
    originalDebug = (Router as any).debug
    originalHistoryMax = (Router as any).maxHistoryLength
    originalBasePrefix = (Router as any).basePrefix

    // Reset state
    ;(Router as any)._signals = undefined
    ;(Router as any).debug = false
    ;(Router as any).maxHistoryLength = 10
    ;(Router as any).basePrefix = ''
    ;(Router as any).history = []
    ;(Router as any).currentRoute = undefined
    ;(Router as any).rootNode = undefined
  })

  afterEach(() => {
    // Restore original state
    ;(Router as any)._signals = originalSignals
    ;(Router as any).debug = originalDebug
    ;(Router as any).maxHistoryLength = originalHistoryMax
    ;(Router as any).basePrefix = originalBasePrefix
  })

  it('configures with basic adapter', () => {
    const adapter = createTestSignalAdapter()
    Router.configure(adapter)

    expect((Router as any)._signals).to.equal(adapter)
    expect((Router as any).debug).to.equal(false)
    expect((Router as any).maxHistoryLength).to.equal(10)
    expect((Router as any).basePrefix).to.equal('')
  })

  it('configures with all options', () => {
    const adapter = createTestSignalAdapter()
    const logger = (msg: string) => console.log(msg)

    Router.configure(adapter, {
      withUrl: false,
      historyMax: 5,
      base: '/myapp',
      debug: {logger},
    })

    expect((Router as any)._signals).to.equal(adapter)
    expect((Router as any).debug).to.deep.equal({logger})
    expect((Router as any).maxHistoryLength).to.equal(5)
    expect((Router as any).basePrefix).to.equal('/myapp')
  })

  it('configures with boolean debug', () => {
    const adapter = createTestSignalAdapter()
    Router.configure(adapter, {debug: true})

    expect((Router as any).debug).to.equal(true)
  })

  it('configures with base path normalization', () => {
    const adapter = createTestSignalAdapter()

    Router.configure(adapter, {base: 'myapp'})
    expect((Router as any).basePrefix).to.equal('/myapp')

    Router.configure(adapter, {base: '/myapp/'})
    expect((Router as any).basePrefix).to.equal('/myapp')

    Router.configure(adapter, {base: '/'})
    expect((Router as any).basePrefix).to.equal('')

    Router.configure(adapter, {base: ''})
    expect((Router as any).basePrefix).to.equal('')
  })

  it('configures with historyMax false', () => {
    const adapter = createTestSignalAdapter()
    Router.configure(adapter, {historyMax: false})

    expect((Router as any).maxHistoryLength).to.equal(false)
  })

  it('throws error when accessing signals without configuration', () => {
    ;(Router as any)._signals = undefined

    expect(() => {
      ;(Router as any)._ensureSignals()
    }).to.throw('Router signals adapter is not configured')
  })

  it('ensures current route signal is created', () => {
    const adapter = createTestSignalAdapter()
    Router.configure(adapter)
    ;(Router as any).currentRoute = undefined
    ;(Router as any)._ensureCurrentRoute()

    expect((Router as any).currentRoute).to.not.be.undefined
    expect(typeof (Router as any).currentRoute.get).to.equal('function')
  })
})
