import {expect} from '@esm-bundle/chai'
import type {adapter} from '../../src'
import {QueryClient, createQuery, createMutation} from '../../src/modules/query'

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

describe('mutation: basic', () => {
  test('mutate sets success and invalidates keys', async () => {
    const client = new QueryClient(createTestAdapter())
    let fetchCount = 0
    const listQuery = createQuery(client, {
      key: ['list'],
      queryFn: async () => {
        fetchCount++
        return [1]
      },
      refetchOnMount: false,
      staleTime: 0,
    })

    const mutation = createMutation(client, {
      mutationFn: async (v: number) => v,
      onSuccess: (_d, _v) => client.invalidate(['list']),
    })

    await listQuery.refetch()
    expect(fetchCount).to.equal(1)
    await mutation.mutate(2)
    // invalidation should trigger refetch due to staleTime 0
    await new Promise((r) => setTimeout(r, 0))
    expect(fetchCount).to.equal(2)
  })
})
