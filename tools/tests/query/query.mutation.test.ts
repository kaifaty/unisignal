import {expect} from '@esm-bundle/chai'
import type {adapter} from '../../../src'
import {QueryClient, createQuery, createMutation} from '../../../src/modules/query'
import {createBasicAdapter} from '../fixtures/adapter'

function createTestAdapter(): adapter.SignalAdapter {
  return createBasicAdapter()
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
    listQuery.dispose()
    // no event listeners were registered, but ensure cleanup path is exercised
    await (client as any).stop()
  })
})
