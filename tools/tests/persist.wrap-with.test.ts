/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../src/modules/persist/persist'
import type {PersistAdapter, PersistState} from '../../src/modules/persist/types'
import type {SignalAdapter, SignalWritable} from '../../src/modules/adapter/types'

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
      throw new Error('not needed in tests')
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

type ExtWritable<T> = {
  get(): T
  set(v: T): void
  peek(): T
}

function createExternalWritable<T>(initial: T): ExtWritable<T> {
  let value = initial
  return {
    get: () => value,
    set: (v) => (value = v),
    peek: () => value,
  }
}

describe('persist: wrap and with', () => {
  it('wrap should persist external writable and support clear/refresh', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const external = createExternalWritable(10)
    const w = persist.wrap<number>(base, external as any, {storage, name: 'ex'}) as PersistState<number>
    expect(w.get()).to.equal(10)
    w.set(11)
    expect(storage.store.get('ex').value).to.equal(11)
    w.clear()
    expect(w.get()).to.equal(10)
  })

  it('with should apply defaults for storage and namespace', async () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const P = persist.with({storage, namespace: 'ns:'})
    const s = P.state(base, 0, {name: 'a'})
    s.set(1)
    expect(storage.store.has('ns:a')).to.equal(true)
    const keys = await P.keys(base)
    expect(keys).to.deep.equal(['a'])
  })
})
