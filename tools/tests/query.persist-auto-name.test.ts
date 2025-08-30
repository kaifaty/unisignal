import {expect} from '@esm-bundle/chai'
import type {adapter} from '../../src'
import {QueryClient, createQuery} from '../../src/modules/query'
import type {PersistAdapter} from '../../src/modules/persist/types'

function createTestAdapter(): adapter.SignalAdapter {
  return {
    state<T>(initial: T): adapter.SignalWritable<T> {
      let value = initial
      const listeners = new Set<(v: T) => void>()
      return {
        get: () => value,
        peek: () => value,
        set: (v: T) => {
          value = v
          listeners.forEach((l) => l(v))
        },
        subscribe: (l: (v: T) => void) => {
          listeners.add(l)
          return () => listeners.delete(l)
        },
      }
    },
    computed<T>(_fn: () => T) {
      throw new Error('not needed')
    },
  }
}

export const test = it

describe('query: persist auto-name', () => {
  test('persist:true generates name based on key and restores', async () => {
    const store = new Map<string, any>()
    const mem: PersistAdapter = {
      isAsync: false,
      get: (n) => store.get(n),
      set: (n, v) => void store.set(n, v),
      clear: (n) => void store.delete(n),
      keys: () => Array.from(store.keys()),
    }
    const client = new QueryClient(createTestAdapter(), {persistNamespace: 'ns:', persistStorage: mem})
    let calls = 0
    const q1 = createQuery(client, {
      key: ['auto', 1],
      queryFn: async () => {
        calls++
        return {v: calls}
      },
      refetchOnMount: false,
      persist: true,
      staleTime: 0,
    })
    await q1.refetch()
    expect(q1.data.get()).to.deep.equal({v: 1})

    const q2 = createQuery(client, {
      key: ['auto', 1],
      queryFn: async () => ({v: 999}),
      refetchOnMount: false,
      persist: true,
    })
    expect(q2.data.get()).to.deep.equal({v: 1})
  })
})
