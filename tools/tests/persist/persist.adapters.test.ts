/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import {createLocalAdapter} from '../../../src/modules/persist/adapters/local-storage'
import {IndexedDBAdapter, removeIDB} from '../../../src/modules/persist/adapters/indexeddb-storage'
import {createKVAdapter} from '../../../src/modules/persist/adapters/kv-storage'
import {createTestSignalAdapter} from '../fixtures/adapter'

describe('persist: storage adapters', () => {
  it('local/session adapters basic set/get/keys and type restrictions', () => {
    // fake storages
    const makeStorage = () => {
      const map = new Map<string, string>()
      return {
        getItem: (k: string) => map.get(k) || null,
        setItem: (k: string, v: string) => map.set(k, v),
        removeItem: (k: string) => map.delete(k),
        key: (i: number) => Array.from(map.keys())[i] ?? null,
        clear: () => map.clear(),
        get length() {
          return map.size
        },
      } as unknown as Storage
    }

    const local = new (createLocalAdapter(makeStorage(), 'localStorage'))()
    const session = new (createLocalAdapter(makeStorage(), 'sessionStorage'))()

    local.set('a', {value: 1, timestamp: Date.now()})
    session.set('b', {value: 2, timestamp: Date.now()})
    expect((local.get('a') as {value: number} | undefined)?.value).to.equal(1)
    expect((session.get('b') as {value: number} | undefined)?.value).to.equal(2)
    expect(local.keys()).to.deep.equal(['a'])
    expect(session.keys()).to.deep.equal(['b'])

    // not allowed types - Symbol should be filtered out
    local.set('x', Symbol('s') as unknown)
    // nothing written
    expect(local.get('x')).to.equal(undefined)

    // corrupted JSON in getItem -> undefined and cleanup
    const s2 = makeStorage()
    const local2 = new (createLocalAdapter(s2, 'localStorage'))()
    // write broken string directly
    ;(s2 as any).setItem('persist-local-storage-bad', '{broken')
    expect(local2.get('bad')).to.equal(undefined)
    expect((s2 as any).getItem('persist-local-storage-bad')).to.equal(null)
  })

  it('IndexedDBAdapter basic set/get/keys', async () => {
    const base = createTestSignalAdapter()
    // basic smoke with adapter API
    const idb = new IndexedDBAdapter()
    // ensure clean db
    removeIDB()
    idb.set('k', {value: 'v'})
    const v = await idb.get('k')
    expect((v as any)?.value).to.equal('v')
    const keys = await idb.keys()
    expect(keys.includes('k')).to.equal(true)
  })

  it('KV adapter basic set/get/keys', async () => {
    const store = new Map<string, string>()
    const kv = createKVAdapter({
      get: (k) => store.get(k),
      set: (k, v) => void store.set(k, v),
      delete: (k) => void store.delete(k),
      list: () => Array.from(store.keys()),
    })
    kv.set('x', {value: 1})
    const got = await kv.get('x')
    expect((got as any)?.value).to.equal(1)
    expect(await kv.keys()).to.deep.equal(['x'])
  })
})
