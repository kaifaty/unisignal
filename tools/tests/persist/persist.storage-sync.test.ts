/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import type {PersistAdapter} from '../../../src/modules/persist/types'
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

function createLocalStorageLike(): Storage {
  const map = new Map<string, string>()
  return {
    getItem(key: string) {
      return map.get(key) ?? null
    },
    setItem(key: string, value: string) {
      map.set(key, value)
    },
    removeItem(key: string) {
      map.delete(key)
    },
    clear() {
      map.clear()
    },
    key(i: number) {
      return Array.from(map.keys())[i] ?? null
    },
    get length() {
      return map.size
    },
  } as any
}

function installDom() {
  const w: any = (globalThis as any).window
  const originalAdd = w.addEventListener?.bind(w)
  const listeners: Array<(e: StorageEvent) => void> = []
  w.addEventListener = (type: string, fn: (e: StorageEvent) => void) => {
    if (type === 'storage') listeners.push(fn)
    else originalAdd?.(type as any, fn as any)
  }
  function dispatchStorage(key: string, newValue: string | null) {
    const e = {key, newValue} as StorageEvent
    for (const l of listeners) l(e)
  }
  function restore() {
    if (originalAdd) w.addEventListener = originalAdd
  }
  return {dispatchStorage, restore}
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

describe("persist: sync:'storage'", () => {
  it('set → storage event restores value in another instance', () => {
    const base = createTestSignalAdapter()
    const {dispatchStorage, restore} = installDom()
    const storage = createMemoryAdapter()
    const a = persist.state(base, 0, {storage, name: 'k', sync: 'storage'}) as any
    const b = persist.state(base, 0, {storage, name: 'k', sync: 'storage'}) as any

    // simulate write into backing adapter and corresponding localStorage set
    storage.set('k', {value: 1, timestamp: Date.now()})
    const json = JSON.stringify({value: 1, timestamp: Date.now()})
    dispatchStorage('k', json)
    expect(b.get()).to.equal(1)
    expect((b as any).isRestored).to.equal(true)
    restore()
  })

  it('clear → storage event resets to initial', () => {
    const base = createTestSignalAdapter()
    const {dispatchStorage, restore} = installDom()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 'init', {storage, name: 'k', sync: 'storage'}) as any
    dispatchStorage('k', null)
    expect(s.get()).to.equal('init')
    restore()
  })

  it('expired TTL → onExpire and reset', () => {
    const base = createTestSignalAdapter()
    const {dispatchStorage, restore} = installDom()
    const storage = createMemoryAdapter()
    let expired = 0
    const s = persist.state(base, 0, {
      storage,
      name: 'k',
      sync: 'storage',
      ttlMs: 5,
      onExpire: () => expired++,
    }) as any
    const raw = {value: 2, timestamp: Date.now() - 10_000}
    dispatchStorage('k', JSON.stringify(raw))
    expect(s.get()).to.equal(0)
    expect(expired).to.equal(1)
    restore()
  })

  it('corrupted JSON → ignore gracefully', () => {
    const base = createTestSignalAdapter()
    const {dispatchStorage, restore} = installDom()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 'a', {storage, name: 'k', sync: 'storage'}) as any
    dispatchStorage('k', '{bad json')
    expect(s.get()).to.equal('a')
    restore()
  })

  it('decrypt error → onError("decrypt") and ignore', () => {
    const base = createTestSignalAdapter()
    const {dispatchStorage, restore} = installDom()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 'a', {
      storage,
      name: 'k',
      sync: 'storage',
      decrypt: () => JSON.parse('oops') as any,
    }) as any
    const payload = {
      value: JSON.stringify({value: 'secret', timestamp: Date.now()}),
      __enc__: true,
      timestamp: Date.now(),
    }
    dispatchStorage('k', JSON.stringify(payload))
    expect(s.get()).to.equal('a')
    restore()
  })

  it('validate failure resets to initial', () => {
    const base = createTestSignalAdapter()
    const {dispatchStorage, restore} = installDom()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 0, {
      storage,
      name: 'k',
      sync: 'storage',
      validate: (v) => typeof v === 'number' && v > 0,
    }) as any
    // first good value via storage event
    const good = {value: 5, timestamp: Date.now()}
    dispatchStorage('k', JSON.stringify(good))
    expect(s.get()).to.equal(5)
    // then invalid value → fallback to initial (0)
    const bad = {value: 0, timestamp: Date.now()}
    dispatchStorage('k', JSON.stringify(bad))
    expect(s.get()).to.equal(0)
    restore()
  })
})

describe("persist: sync:'storage' namespace", () => {
  it('string namespace prefixes/filters keys', () => {
    const base = createTestSignalAdapter()
    const {dispatchStorage, restore} = installDom()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 'init', {storage, name: 'key', namespace: 'ns:', sync: 'storage'}) as any
    // unrelated key
    dispatchStorage('other:key', JSON.stringify({value: 'x', timestamp: Date.now()}))
    expect(s.get()).to.equal('init')
    // targeted key
    dispatchStorage('ns:key', JSON.stringify({value: 'ok', timestamp: Date.now()}))
    expect(s.get()).to.equal('ok')
    restore()
  })

  it('function namespace produces exact name', () => {
    const base = createTestSignalAdapter()
    const {dispatchStorage, restore} = installDom()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 'init', {
      storage,
      name: 'id',
      namespace: (n) => `acct:${n}`,
      sync: 'storage',
    }) as any
    dispatchStorage('acct:id', JSON.stringify({value: 'ok', timestamp: Date.now()}))
    expect(s.get()).to.equal('ok')
    restore()
  })
})
