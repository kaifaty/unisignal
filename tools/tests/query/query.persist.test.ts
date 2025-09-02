import {expect} from '@esm-bundle/chai'
import type {adapter} from '../../../src'
import {QueryClient, createQuery} from '../../../src/modules/query'
import {createBasicAdapter} from '../fixtures/adapter'
import {createMemoryAdapter} from '../fixtures/persist'

function createTestAdapter(): adapter.SignalAdapter {
  return createBasicAdapter()
}

export const test = it

describe('query: persist', () => {
  test('restores data from storage when provided initial cached value', async () => {
    const mem = createMemoryAdapter()
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
