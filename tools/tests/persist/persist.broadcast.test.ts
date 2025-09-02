/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import type {PersistAdapter} from '../../../src/modules/persist/types'
import {createSimpleSignalAdapter} from '../fixtures/adapter'
import {createMemoryAdapter} from '../fixtures/persist'

// use shared createMemoryAdapter()

describe('persist: broadcast sync', () => {
  it('should broadcast set/clear via BroadcastChannel when available', async () => {
    const base = createSimpleSignalAdapter()
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

  it('should call onRestore on receiver when value arrives', () => {
    const base = createSimpleSignalAdapter()
    const storage = createMemoryAdapter()
    const calls: string[] = []
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
        const set = MockBC.registry.get(this.name)
        if (!set) return
        for (const ch of set) {
          if (ch === this) continue
          ch.suspended = true
          ch.onmessage?.({data: v} as any)
          setTimeout(() => (ch.suspended = false), 0)
        }
      }
    }
    ;(globalThis as any).BroadcastChannel = MockBC

    const a = persist.state(base, 0, {storage, name: 'bcast2', sync: 'broadcast'}) as any
    const b = persist.state(base, 0, {
      storage,
      name: 'bcast2',
      sync: 'broadcast',
      onRestore: (v: number) => calls.push('restore:' + v),
    }) as any
    a.set(2)
    expect(b.get()).to.equal(2)
    expect(calls.includes('restore:2')).to.equal(true)
    delete (globalThis as any).BroadcastChannel
  })

  it('should ignore invalid value per validate on broadcast', () => {
    const base = createSimpleSignalAdapter()
    const storage = createMemoryAdapter()
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
        const set = MockBC.registry.get(this.name)
        if (!set) return
        for (const ch of set) {
          if (ch === this) continue
          ch.suspended = true
          ch.onmessage?.({data: v} as any)
          setTimeout(() => (ch.suspended = false), 0)
        }
      }
    }
    ;(globalThis as any).BroadcastChannel = MockBC

    const a = persist.state(base, 0, {storage, name: 'bcast3', sync: 'broadcast'}) as any
    const b = persist.state(base, 1, {
      storage,
      name: 'bcast3',
      sync: 'broadcast',
      validate: (v) => typeof v === 'number' && v > 0,
    }) as any
    a.set(0)
    expect(b.get()).to.equal(1)
    delete (globalThis as any).BroadcastChannel
  })

  it('should not echo messages back to sender (no loop)', () => {
    const base = createSimpleSignalAdapter()
    const storage = createMemoryAdapter()
    let senderSet = 0
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
        senderSet++
        const set = MockBC.registry.get(this.name)
        if (!set) return
        for (const ch of set) {
          if (ch === this) continue
          ch.suspended = true
          ch.onmessage?.({data: v} as any)
          setTimeout(() => (ch.suspended = false), 0)
        }
      }
    }
    ;(globalThis as any).BroadcastChannel = MockBC

    const a = persist.state(base, 0, {storage, name: 'bcast4', sync: 'broadcast'}) as any
    const b = persist.state(base, 0, {storage, name: 'bcast4', sync: 'broadcast'}) as any
    a.set(5)
    expect(b.get()).to.equal(5)
    // only one sender postMessage call should be observed
    expect(senderSet).to.equal(1)
    delete (globalThis as any).BroadcastChannel
  })
})
