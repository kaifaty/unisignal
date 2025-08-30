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

describe('persist: state TTL valid restore', () => {
  it('sync: valid TTL should restore stored value and not call onExpire', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const payload = {value: 42, timestamp: Date.now() - 1}
    storage.set('k', payload)
    let expired = 0
    const s = persist.state(base, 0, {storage, name: 'k', ttlMs: 10_000, onExpire: () => expired++})
    expect(s.get()).to.equal(42)
    expect(expired).to.equal(0)
  })

  it('async: valid TTL should restore stored value after tick and not call onExpire', async () => {
    const base = createTestSignalAdapter()
    const storage = createAsyncMemoryAdapter()
    const payload = {value: 'ok', timestamp: Date.now() - 1}
    storage.set('k', payload)
    let expired = 0
    const s = persist.state(base, 'init', {storage, name: 'k', ttlMs: 10_000, onExpire: () => expired++})
    expect(s.get()).to.equal('init')
    await waitFor(0)
    expect(s.get()).to.equal('ok')
    expect(expired).to.equal(0)
  })
})

describe('persist: migrations misc cases', () => {
  it('sync: missing incoming version → no migrations applied, value restored as-is', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    storage.set('user', {value: {name: 'john'}, timestamp: Date.now()})
    const s = persist.state(base, {name: 'init'} as any, {
      storage,
      name: 'user',
      version: 3,
      migrations: {
        2: (v: any) => ({...v, age: 10}),
        3: (v: any) => ({...v, name: v.name.toUpperCase()}),
      },
      validate: (v) => typeof (v as any).name === 'string',
    })
    expect((s.get() as any).name).to.equal('john')
    expect((s.get() as any).age).to.equal(undefined)
  })

  it("sync: migration throws → onError('migrate') and fallback to default", () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    storage.set('doc', {value: {v: 1}, version: 1, timestamp: Date.now()})
    const errors: string[] = []
    const s = persist.state(base, {v: 0} as any, {
      storage,
      name: 'doc',
      version: 3,
      migrations: {
        2: () => {
          throw new Error('boom')
        },
        3: (v: any) => ({...v, v: v.v + 1}),
      },
      onError: (_e, ctx) => errors.push(ctx.phase || ''),
      validate: (v) => typeof (v as any).v === 'number',
    })
    expect((s.get() as any).v).to.equal(0)
    expect(errors.includes('migrate')).to.equal(true)
  })
})

describe('persist: refreshFromStorage branches', () => {
  it('sync: TTL expired on refreshFromStorage → onExpire and revert to initial', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 'init', {
      storage,
      name: 'k',
      ttlMs: 5,
      onExpire: () => (expired += 1),
    }) as any
    let expired = 0
    storage.set('k', {value: 'X', timestamp: Date.now() - 10_000})
    s.refreshFromStorage()
    expect(s.get()).to.equal('init')
    expect(expired).to.equal(1)
  })

  it('sync: deserialize throws on refresh → fallback to initial', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 'init', {
      storage,
      name: 'k2',
      deserialize: () => {
        throw new Error('bad')
      },
    }) as any
    storage.set('k2', {value: 'payload', timestamp: Date.now()})
    s.refreshFromStorage()
    expect(s.get()).to.equal('init')
  })

  it('sync: validate false on refresh → fallback to initial', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 0, {storage, name: 'k3', validate: (v) => typeof v === 'string'}) as any
    storage.set('k3', {value: 123, timestamp: Date.now()})
    s.refreshFromStorage()
    expect(s.get()).to.equal(0)
  })

  it('sync: decrypt error on refresh → fallback to initial', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const s = persist.state(base, 'a', {storage, name: 'k4', decrypt: () => JSON.parse('oops') as any}) as any
    const raw = {
      value: JSON.stringify({value: 'secret', timestamp: Date.now()}),
      __enc__: true,
      timestamp: Date.now(),
    }
    storage.set('k4', raw)
    s.refreshFromStorage()
    expect(s.get()).to.equal('a')
  })

  it('async: TTL expired on refreshFromStorage → onExpire and keep current', async () => {
    const base = createTestSignalAdapter()
    const storage = createAsyncMemoryAdapter()
    let expired = 0
    const s = persist.state(base, 'init', {
      storage,
      name: 'k5',
      ttlMs: 5,
      onExpire: () => (expired += 1),
    }) as any
    storage.set('k5', {value: 'late', timestamp: Date.now() - 10_000})
    await s.refreshFromStorage()
    expect(s.get()).to.equal('init')
    expect(expired).to.equal(1)
  })
})
