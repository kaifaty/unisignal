import {expect} from '@esm-bundle/chai'
import {QueryClient, createQuery} from '../../../src/modules/query'
import {createBasicAdapter} from '../fixtures/adapter'

export const test = it

describe('query: triggers', () => {
  test('notifyAll causes refetch when stale', async () => {
    const client = new QueryClient(createBasicAdapter())
    let calls = 0
    const q = createQuery(client, {
      key: ['triggers'],
      queryFn: async () => {
        calls++
        return calls
      },
      refetchOnMount: false,
      staleTime: 0,
    })
    await q.refetch()
    expect(q.data.get()).to.equal(1)
    // simulate browser events by direct call
    ;(client as any).notifyAll()
    await new Promise((r) => setTimeout(r, 0))
    expect(q.data.get()).to.equal(2)
    q.dispose()
    await (client as any).stop()
  })
})
