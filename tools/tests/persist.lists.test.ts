/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../src/modules/persist/persist'
import type {PersistAdapter} from '../../src/modules/persist/types'
import type {SignalAdapter, SignalWritable} from '../../src/modules/adapter/types'

function createTestSignalAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      return {
        get(): T {
          return value
        },
        set(v: T): void {
          value = v
        },
        peek(): T {
          return value
        },
        subscribe(): () => void {
          return () => {}
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

describe('persist: keys and clearAll', () => {
  it('keys should list and filter by namespace', async () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const p = persist.with({storage, namespace: 'ns:'})
    const a = p.state(base, 1, {name: 'a'})
    const b = p.state(base, 2, {name: 'b'})
    const c = persist.state(base, 3, {storage, name: 'c'})
    a.set(1)
    b.set(2)
    c.set(3)
    const k1 = await p.keys(base)
    expect(k1.sort()).to.deep.equal(['a', 'b'])
    const k2 = await persist.keys(base, {storage})
    expect(k2.sort()).to.deep.equal(['c', 'ns:a', 'ns:b'])
  })

  it('clearAll should clear namespaced or all keys', async () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const p = persist.with({storage, namespace: 'ns:'})
    const a = p.state(base, 1, {name: 'a'})
    const b = p.state(base, 2, {name: 'b'})
    const c = persist.state(base, 3, {storage, name: 'c'})
    a.set(1)
    b.set(2)
    c.set(3)
    await p.clearAll(base)
    const kAll = await persist.keys(base, {storage})
    expect(kAll).to.deep.equal(['c'])
    await persist.clearAll(base, {storage})
    const k0 = await persist.keys(base, {storage})
    expect(k0).to.deep.equal([])
  })
})
