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

describe('query: persist', () => {
  test('restores data from storage when provided initial cached value', async () => {
    const store = new Map<string, any>()
    const mem: PersistAdapter = {
      isAsync: false,
      get: (n) => store.get(n),
      set: (n, v) => void store.set(n, v),
      clear: (n) => void store.delete(n),
      keys: () => Array.from(store.keys()),
    }
    const client = new QueryClient(createTestAdapter(), {persistStorage: mem})
    let calls = 0
    const q = createQuery(client, {
      key: ['persisted'],
      queryFn: async () => {
        calls++
        return {n: calls}
      },
      refetchOnMount: false,
      persist: {name: 'q:persisted'},
    })

    expect(q.data.get()).to.equal(undefined)
    await q.refetch()
    expect(q.data.get()).to.deep.equal({n: 1})

    const q2 = createQuery(client, {
      key: ['persisted'],
      queryFn: async () => ({n: 999}),
      refetchOnMount: false,
      persist: {name: 'q:persisted'},
    })
    expect(q2.data.get()).to.deep.equal({n: 1})
  })
})
