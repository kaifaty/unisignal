/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import {createExternalWritable, createMemoryAdapter} from '../fixtures/persist'
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
      throw new Error('not needed in debug')
    },
  }
}

describe('persist: wrap/with debug', () => {
  it('wrap basic smoke', () => {
    console.log('[debug] start wrap basic smoke')
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const external = createExternalWritable(10)
    console.log('[debug] before persist.wrap')
    const w = persist.wrap<number>(base, external as any, {storage, name: 'ex'}) as any
    console.log('[debug] after persist.wrap, value=', w.get())
    expect(w.get()).to.equal(10)
    w.set(11)
    console.log('[debug] after set(11)')
    expect(storage.store.get('ex').value).to.equal(11)
    w.clear()
    console.log('[debug] after clear()')
    expect(w.get()).to.equal(10)
  })

  it('with basic keys', async () => {
    console.log('[debug] start with basic keys')
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const P = persist.with({storage, namespace: 'ns:'})
    const s = P.state(base, 0, {name: 'a'})
    s.set(1)
    console.log('[debug] before keys()')
    const keys = await P.keys(base)
    console.log('[debug] after keys() →', keys)
    expect(keys).to.deep.equal(['a'])
  })
})
