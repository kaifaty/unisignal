/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import type {SignalAdapter, SignalWritable} from '../../../src/modules/adapter/types'
import {createMemoryAdapter} from '../fixtures/persist'
import {IndexedDBAdapter, removeIDB} from '../../../src/modules/persist/adapters/indexeddb-storage'

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

describe('persist: keys and clearAll', () => {
  it('keys/clearAll without namespace (sync storage)', async () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const s1 = persist.state(base, 0, {storage, name: 'a'})
    const s2 = persist.state(base, 0, {storage, name: 'b'})
    s1.set(1)
    s2.set(2)
    const keys = await persist.keys(base, {storage})
    expect(keys.sort()).to.deep.equal(['a', 'b'])
    await persist.clearAll(base, {storage})
    expect(storage.store.size).to.equal(0)
  })

  it('keys/clearAll with string namespace', async () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const ns = 'ns:'
    const s1 = persist.state(base, 0, {storage, name: 'a', namespace: ns})
    const s2 = persist.state(base, 0, {storage, name: 'b', namespace: ns})
    const s3 = persist.state(base, 0, {storage, name: 'c'}) // outside ns
    s1.set(1)
    s2.set(2)
    s3.set(3)
    const keys = await persist.keys(base, {storage, namespace: ns})
    expect(keys.sort()).to.deep.equal(['a', 'b'])
    await persist.clearAll(base, {storage, namespace: ns})
    // only c remains
    expect(Array.from(storage.store.keys())).to.deep.equal(['c'])
  })

  it('keys/clearAll with functional namespace and async idb', async () => {
    const base = createTestSignalAdapter()
    removeIDB()
    const idb = new IndexedDBAdapter()
    const nsFn = (n: string) => `fx:${n}`
    const s1 = persist.state(base, 0, {storage: idb, name: 'a', namespace: nsFn})
    const s2 = persist.state(base, 0, {storage: idb, name: 'b', namespace: nsFn})
    s1.set(11)
    s2.set(22)
    const keys = await persist.keys(base, {storage: idb, namespace: 'fx:'})
    expect(keys.sort()).to.deep.equal(['a', 'b'])
    await persist.clearAll(base, {storage: idb, namespace: 'fx:'})
    const keysAfter = await persist.keys(base, {storage: idb, namespace: 'fx:'})
    expect(keysAfter).to.deep.equal([])
  })
})
