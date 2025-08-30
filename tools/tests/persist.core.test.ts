/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../src/modules/persist/persist'
import type {PersistAdapter} from '../../src/modules/persist/types'
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

function createAsyncMemoryAdapter(): PersistAdapter & {store: Map<string, any>} {
  const sync = createMemoryAdapter()
  return {
    ...sync,
    isAsync: true,
    async get(name: string) {
      return Promise.resolve(sync.get(name))
    },
  }
}

async function waitFor(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

describe('persist: core behaviors', () => {
  it('TTL: sync restore should expire and call onExpire', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    storage.set('k', {value: 42, timestamp: Date.now() - 10_000})
    let expired = 0
    const s = persist.state(base, 1, {storage, name: 'k', ttlMs: 5, onExpire: () => expired++})
    expect(s.get()).to.equal(1)
    expect(expired).to.equal(1)
  })

  it('TTL: async restore should expire and keep current value, call onExpire', async () => {
    const base = createTestSignalAdapter()
    const storage = createAsyncMemoryAdapter()
    storage.set('k', {value: 'x', timestamp: Date.now() - 10_000})
    let expired = 0
    const s = persist.state(base, 'init', {storage, name: 'k', ttlMs: 5, onExpire: () => expired++})
    expect(s.get()).to.equal('init')
    await waitFor(0)
    expect(s.get()).to.equal('init')
    expect(expired).to.equal(1)
  })

  it('migrations: should apply sequential migrations to target version (sync)', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    storage.set('user', {value: {name: 'a'}, version: 1, timestamp: Date.now()})
    const s = persist.state(base, {name: 'init', age: 0} as any, {
      storage,
      name: 'user',
      version: 3,
      migrations: {
        2: (v: any) => ({...v, age: 10}),
        3: (v: any) => ({...v, name: v.name.toUpperCase()}),
      },
      validate: (v) => typeof (v as any).name === 'string',
    })
    expect((s.get() as any).name).to.equal('A')
    expect((s.get() as any).age).to.equal(10)
  })

  it('maxSizeKb: should not write oversized payload and call onError(limit)', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const errors: string[] = []
    const s = persist.state(base, '', {
      storage,
      name: 'text',
      maxSizeKb: 1,
      onError: (e, ctx) => errors.push('' + (ctx.phase || '') + ':' + ((e as any)?.message || 'err')),
    })
    const big = 'x'.repeat(4096)
    s.set(big)
    expect(storage.store.get('text')).to.equal(undefined)
    expect(errors.some((m) => m.startsWith('limit:'))).to.equal(true)
  })

  it('encrypt/decrypt via refreshFromStorage should roundtrip and update state', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 'init', {
      storage,
      name: 'enc',
      encrypt: (plaintext) => `enc:${plaintext}`,
      decrypt: (cipher) => (cipher.startsWith('enc:') ? cipher.slice(4) : cipher),
    }) as any

    const payload = {value: 'secret', timestamp: Date.now()}
    const encPayload = {value: `enc:${JSON.stringify(payload)}`, __enc__: true, timestamp: payload.timestamp}
    storage.set('enc', encPayload)
    s.refreshFromStorage()
    expect(s.get()).to.equal('secret')
    expect(s.isRestored).to.equal(true)
    expect(s.restoredOnce).to.equal(true)
  })

  it('restoreFn and onPersisStateInit should be called appropriately', async () => {
    const base = createTestSignalAdapter()
    const storage = createAsyncMemoryAdapter()
    storage.set('v', {value: 1, timestamp: Date.now()})
    const calls: string[] = []
    const s = persist.state(base, 0, {
      storage,
      name: 'v',
      restoreFn: (x) => (x as number) + 1,
      onPersisStateInit: (v) => calls.push('init:' + v),
      onRestore: (v) => calls.push('restore:' + v),
    })
    // init is called asynchronously after creation
    await waitFor(0)
    expect(calls.includes('init:2')).to.equal(true)
    // after async restore: value becomes 2 (1 + 1)
    expect(s.get()).to.equal(2)
    expect(calls.includes('restore:2')).to.equal(true)
  })

  it('refreshFromStorage (sync): should pull and validate/decode same as initial path', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 'a', {storage, name: 'rs', validate: (v) => typeof v === 'string'})
    expect(s.get()).to.equal('a')
    storage.set('rs', {value: 'b', timestamp: Date.now()})
    ;(s as any).refreshFromStorage()
    expect(s.get()).to.equal('b')
  })
})
