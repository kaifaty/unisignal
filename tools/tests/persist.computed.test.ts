/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../src/modules/persist/persist'
import type {PersistAdapter} from '../../src/modules/persist/types'
import type {SignalAdapter, SignalWritable, SignalComputed} from '../../src/modules/adapter/types'

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
    computed<T>(fn: () => T): SignalComputed<T> {
      // naive computed that recomputes on subscribe and when tick() called
      let value = fn()
      const listeners = new Set<(v: T) => void>()
      const api = {
        get: () => value,
        peek: () => value,
        subscribe(listener: (v: T) => void) {
          listeners.add(listener)
          listener(value)
          return () => listeners.delete(listener)
        },
      }
      // helper to trigger recompute in tests
      ;(api as any).$recompute = () => {
        value = fn()
        for (const l of listeners) l(value)
      }
      return api
    },
  }
}

function createMemoryAdapter(): PersistAdapter & {store: Map<string, any>} {
  const store = new Map<string, any>()
  return {
    isAsync: false,
    store,
    get(name: string) {
      return store.get(name)
    },
    set(name: string, value: unknown) {
      store.set(name, value)
    },
    clear(name: string) {
      store.delete(name)
    },
    keys(): string[] {
      return Array.from(store.keys())
    },
  }
}

describe('persist: computed caching', () => {
  it('should persist computed when persist=true with name and namespace', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    let src = 1
    const c = persist.computed<number>(base, () => src * 2, {
      persist: true,
      storage,
      name: 'cmp',
      namespace: 'ns:',
    }) as any

    // trigger persist by subscribing
    const unsub = c.subscribe(() => {})
    expect(storage.store.get('ns:cmp')?.value).to.equal(2)
    src = 2
    c.$recompute()
    expect(storage.store.get('ns:cmp')?.value).to.equal(4)
    unsub()
  })

  it('serialize/deserialize/validate/ttl for computed cache', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const src = 3
    const c = persist.computed<number>(base, () => src, {
      persist: true,
      storage,
      name: 'cmp2',
      serialize: (v) => ({wrapped: v}),
      deserialize: (raw: any) => raw?.wrapped,
      validate: (v) => typeof v === 'number',
      ttlMs: 1000,
    }) as any

    c.subscribe(() => {})
    const raw = storage.store.get('cmp2')
    expect(!!raw && typeof raw === 'object').to.equal(true)
    expect(raw.value).to.deep.equal({wrapped: 3})
  })
})
