/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import type {SignalAdapter, SignalWritable} from '../../../src/modules/adapter/types'
import {createMemoryAdapter} from '../fixtures/persist'

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
          for (const l of listeners) l(v)
        },
        peek(): T {
          return value
        },
        subscribe(listener: (v: T) => void): () => void {
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

describe('persist: with/enhancer/use', () => {
  it('with merges defaults and explicit options have priority', async () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const P = persist.with({storage, namespace: 'ns:'})
    const s1 = P.state(base, 0, {name: 'a'})
    s1.set(1)
    expect(storage.store.has('ns:a')).to.equal(true)
    const s2 = P.state(base, 0, {name: 'b', namespace: 'x:'})
    s2.set(2)
    expect(storage.store.has('x:b')).to.equal(true)
    const keysDefault = await P.keys(base)
    expect(keysDefault).to.deep.equal(['a'])
    const keysX = await P.keys(base, {namespace: 'x:'})
    expect(keysX).to.deep.equal(['b'])
  })

  it('enhancer adds persist.* to adapter with defaults', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const enhanced = persist.enhancer({storage})(base)
    const s = (enhanced as any).state(0, {name: 'a'})
    s.set(1)
    expect(storage.store.has('a')).to.equal(true)
  })

  it('use composes multiple enhancers', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const E1 = persist.enhancer({storage})
    const E2 = (b: SignalAdapter) => b
    const composed = persist.use(base, E1, E2)
    const s = (composed as any).state(0, {name: 'z'})
    s.set(1)
    expect(storage.store.has('z')).to.equal(true)
  })
})
