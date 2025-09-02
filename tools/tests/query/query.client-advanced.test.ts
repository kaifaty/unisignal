import {expect} from '@esm-bundle/chai'
import {QueryClient, createQuery} from '../../../src/modules/query'
import {createBasicAdapter} from '../fixtures/adapter'

export const test = it

describe('query: client advanced', () => {
  test('keySerializer, invalidateQueries, clear, inspect', async () => {
    const client = new QueryClient(createBasicAdapter(), {
      keySerializer: (k) => JSON.stringify(k).toUpperCase(),
    })
    let calls = 0
    const q = createQuery(client, {
      key: ['A'],
      queryFn: async () => {
        calls++
        return calls
      },
      refetchOnMount: false,
      staleTime: 0,
    })
    await q.refetch()
    expect(client.inspect().size).to.equal(1)
    client.invalidateQueries(['A'])
    await new Promise((r) => setTimeout(r, 0))
    expect(q.data.get()).to.equal(2)
    client.clear()
    expect(client.inspect().size).to.equal(0)
    q.dispose()
    await (client as any).stop()
  })
})
