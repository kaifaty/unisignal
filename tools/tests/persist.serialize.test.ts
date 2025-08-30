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

async function testSerializeDeserializeValidateSync() {
  const base = createTestSignalAdapter()
  const storage = createMemoryAdapter()

  const s = persist.state(base, 1, {
    storage,
    name: 'num',
    serialize: (v: number) => ({wrapped: v}),
    deserialize: (raw: any) => raw?.wrapped,
    validate: (v: number) => typeof v === 'number' && !Number.isNaN(v),
  })

  expect(s.get()).to.equal(1)
  s.set(2)

  const payload = storage.store.get('num') as any
  expect(!!payload && typeof payload === 'object').to.equal(true)
  expect(payload.value).to.deep.equal({wrapped: 2})
  expect(typeof payload.timestamp).to.equal('number')

  // New state should restore to 2
  const s2 = persist.state(base, 0, {
    storage,
    name: 'num',
    serialize: (v: number) => ({wrapped: v}),
    deserialize: (raw: any) => raw?.wrapped,
    validate: (v: number) => typeof v === 'number' && !Number.isNaN(v),
  })
  expect(s2.get()).to.equal(2)

  // Now corrupt value → should fallback to default
  storage.set('num', {value: {wrapped: 'oops'}, timestamp: Date.now()})
  const s3 = persist.state(base, 123, {
    storage,
    name: 'num',
    serialize: (v: number) => ({wrapped: v}),
    deserialize: (raw: any) => raw?.wrapped,
    validate: (v: number) => typeof v === 'number' && !Number.isNaN(v),
  })
  expect(s3.get()).to.equal(123)
}

async function testSerializeDeserializeValidateAsync() {
  const base = createTestSignalAdapter()
  const storage = createAsyncMemoryAdapter()

  // First write a value
  const s = persist.state(base, 'a', {
    storage,
    name: 'str',
    serialize: (v: string) => ({wrapped: v}),
    deserialize: (raw: any) => raw?.wrapped,
    validate: (v: string) => typeof v === 'string',
  })
  s.set('b')

  // New state starts with default, then restores asynchronously
  const s2 = persist.state(base, 'init', {
    storage,
    name: 'str',
    serialize: (v: string) => ({wrapped: v}),
    deserialize: (raw: any) => raw?.wrapped,
    validate: (v: string) => typeof v === 'string',
  })
  expect(s2.get()).to.equal('init')
  await waitFor(0)
  expect(s2.get()).to.equal('b')

  // Corrupt stored value: after async restore it should ignore and keep current
  storage.set('str', {value: {wrapped: 123}, timestamp: Date.now()})
  const s3 = persist.state(base, 'def', {
    storage,
    name: 'str',
    serialize: (v: string) => ({wrapped: v}),
    deserialize: (raw: any) => raw?.wrapped,
    validate: (v: string) => typeof v === 'string',
  })
  expect(s3.get()).to.equal('def')
  await waitFor(0)
  // invalid → keep current ('def')
  expect(s3.get()).to.equal('def')
}

describe('persist: serialize/deserialize/validate', () => {
  it('should work for sync storage', async () => {
    await testSerializeDeserializeValidateSync()
  })
  it('should work for async storage', async () => {
    await testSerializeDeserializeValidateAsync()
  })
})

describe('persist: lifecycle & flags', () => {
  it('should call onPersist/onClear and expose flags for sync storage', async () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const calls: string[] = []
    const s = persist.state(base, 0, {
      storage,
      name: 'life-sync',
      onPersist: (v: number) => calls.push('persist:' + v),
      onRestore: (v: number) => calls.push('restore:' + v),
      onError: (e) => calls.push('error:' + String((e as any)?.message ?? e)),
    }) as any
    // начальное состояние
    expect(s.isRestored).to.equal(false)
    expect(s.restoredOnce).to.equal(false)
    // set → persist
    s.set(1)
    expect(calls.includes('persist:1')).to.equal(true)
    // новое состояние восстановится сразу (sync)
    const s2 = persist.state(base, -1, {
      storage,
      name: 'life-sync',
      onClear: (v: number) => calls.push('clear:' + v),
      onRestore: (v: number) => calls.push('restore2:' + v),
    }) as any
    expect(s2.get()).to.equal(1)
    expect(s2.isRestored).to.equal(true)
    expect(s2.restoredOnce).to.equal(true)
    // clear → onClear
    s2.clear()
    expect(calls.includes('clear:-1')).to.equal(true)
  })

  it('should call onRestore after async restore and update flags', async () => {
    const base = createTestSignalAdapter()
    const storage = createAsyncMemoryAdapter()
    // предварительная запись
    const w = persist.state(base, 'a', {storage, name: 'life-async'})
    w.set('b')

    const calls: string[] = []
    const s = persist.state(base, 'init', {
      storage,
      name: 'life-async',
      onRestore: (v: string) => calls.push('restore:' + v),
    }) as any
    expect(s.get()).to.equal('init')
    expect(s.isRestored).to.equal(false)
    await waitFor(0)
    expect(s.get()).to.equal('b')
    expect(s.isRestored).to.equal(true)
    expect(s.restoredOnce).to.equal(true)
    expect(calls.includes('restore:b')).to.equal(true)
    // refreshFromStorage тоже должен уметь подтянуть
    w.set('c')
    await s.refreshFromStorage()
    expect(s.get()).to.equal('c')
  })
})
