import {expect} from '@esm-bundle/chai'
import type {adapter} from '../../../src'
import {QueryClient, createQuery} from '../../../src/modules/query'
import {createBasicAdapter} from '../fixtures/adapter'

function createTestAdapter(): adapter.SignalAdapter {
  return createBasicAdapter()
}

export const test = it

describe('query: lifecycle', () => {
  test('dispose unsubscribes and allows GC', async () => {
    const client = new QueryClient(createTestAdapter())
    const q = createQuery(client, {
      key: ['gc', 1],
      queryFn: async () => 1,
      refetchOnMount: false,
      gcTime: 10,
      staleTime: 0,
    })

    await q.refetch()
    expect(client.__getCacheSizeForTests()).to.equal(1)
    q.dispose()
    // wait > gcTime
    await new Promise((r) => setTimeout(r, 20))
    expect(client.__getCacheSizeForTests()).to.equal(0)
  })
})
