/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
// runtime trace to diagnose timeout during test discovery
console.log('[wrap-with] file loaded')
import {persist} from '../../../src/modules/persist/persist'
import type {PersistAdapter, PersistState} from '../../../src/modules/persist/types'
import type {SignalAdapter, SignalWritable} from '../../../src/modules/adapter/types'
import {createExternalWritable, createMemoryAdapter, createAsyncMemoryAdapter} from '../fixtures/persist'

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

type ExtWritable<T> = {get(): T; set(v: T): void; peek(): T}

describe('persist: wrap and with', () => {
  console.log('[wrap-with] describe entered')
  it('wrap should persist external writable and support clear/refresh', () => {
    console.log('[wrap-with] test: wrap persist start')
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
    console.log('[wrap-with] test: with defaults start')
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const P = persist.with({storage, namespace: 'ns:'})
    const s = P.state(base, 0, {name: 'a'})
    s.set(1)
    expect(storage.store.has('ns:a')).to.equal(true)
    const keys = await P.keys(base)
    expect(keys).to.deep.equal(['a'])
  })

  it('wrap async refreshFromStorage pulls external changes and sets flags/hooks', async () => {
    const base = createTestSignalAdapter()
    const storage = createAsyncMemoryAdapter()
    // prewrite value in async storage to simulate external change
    storage.set('ex2', {value: 99, timestamp: Date.now()})
    const external = createExternalWritable(1)
    let restored: number | undefined
    let cleared: number | undefined
    const w = persist.wrap<number>(base, external as any, {
      storage,
      name: 'ex2',
      onRestore: (v) => (restored = v),
      onClear: (init) => (cleared = init),
    }) as PersistState<number>

    // initially equals external's value
    expect(w.get()).to.equal(1)
    // refresh pulls value from async storage
    await (w as any).refreshFromStorage()
    expect(w.get()).to.equal(99)
    expect(restored).to.equal(99)
    expect((w as any).isRestored).to.equal(true)
    expect((w as any).restoredOnce).to.equal(true)

    // clear should call onClear with initial external value
    w.set(7)
    w.clear()
    expect(cleared).to.equal(1)
    expect(w.get()).to.equal(1)
    // flags remain true after clear (restore happened earlier)
    expect((w as any).restoredOnce).to.equal(true)
  })

  it('wrap async refreshFromStorage respects TTL and calls onExpire', async () => {
    const base = createTestSignalAdapter()
    const storage = createAsyncMemoryAdapter()
    const external = createExternalWritable(1)
    let expired = 0
    const w = persist.wrap<number>(base, external as any, {
      storage,
      name: 'ex3',
      ttlMs: 5,
      onExpire: () => (expired += 1),
    }) as PersistState<number>

    // write expired after creation to avoid double onExpire (initial async probe + refresh)
    storage.set('ex3', {value: 5, timestamp: Date.now() - 10_000})
    await (w as any).refreshFromStorage()
    // should keep current external value and report expire
    expect(w.get()).to.equal(1)
    expect(expired).to.equal(1)
    // flags are not set since restore did not happen
    expect((w as any).isRestored).to.equal(false)
    expect((w as any).restoredOnce).to.equal(false)
  })
})
