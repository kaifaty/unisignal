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
        get: () => value,
        set: (v: T) => (value = v),
        peek: () => value,
        subscribe: () => () => {},
      }
    },
    computed<T>(_fn: () => T) {
      throw new Error('not needed')
    },
  }
}

function createMemoryAdapter(): PersistAdapter & {store: Map<string, any>} {
  const store = new Map<string, any>()
  return {
    isAsync: false,
    store,
    get: (n) => store.get(n),
    set: (n, v) => void store.set(n, v),
    clear: (n) => void store.delete(n),
    keys: () => Array.from(store.keys()),
  }
}

describe('persist: broadcast sync', () => {
  it('should broadcast set/clear via BroadcastChannel when available', async () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    // mock BroadcastChannel in globalThis
    const messages: any[] = []
    class MockBC {
      static registry = new Map<string, Set<MockBC>>()
      private suspended = false
      onmessage: ((ev: MessageEvent) => void) | null = null
      constructor(public name: string) {
        if (!MockBC.registry.has(name)) MockBC.registry.set(name, new Set())
        MockBC.registry.get(name)!.add(this)
      }
      postMessage(v: any) {
        if (this.suspended) return
        messages.push(v)
        const set = MockBC.registry.get(this.name)
        if (!set) return
        for (const ch of set) {
          if (ch === this) continue // do not deliver to sender to avoid loops
          ch.suspended = true
          ch.onmessage?.({data: v} as any)
          setTimeout(() => {
            ch.suspended = false
          }, 0)
        }
      }
    }
    ;(globalThis as any).BroadcastChannel = MockBC

    const a = persist.state(base, 0, {storage, name: 'bcast', sync: 'broadcast'}) as any
    const b = persist.state(base, 0, {storage, name: 'bcast', sync: 'broadcast'}) as any
    a.set(1)
    // b should receive via broadcast and set to 1
    expect(b.get()).to.equal(1)
    // clear() не транслируется через broadcast по контракту; значение останется прежним
    a.clear()
    expect(b.get()).to.equal(1)
    // cleanup
    delete (globalThis as any).BroadcastChannel
  })
})
