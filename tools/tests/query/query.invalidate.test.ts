import {expect} from '@esm-bundle/chai'
import {QueryClient, createQuery, createMutation} from '../../../src/modules/query'
import {createBasicAdapter} from '../fixtures/adapter'

export const test = it

describe('query: invalidate', () => {
  test('mutation with invalidateKeys triggers refetch when staleTime=0', async () => {
    const client = new QueryClient(createBasicAdapter())
    let fetches = 0
    const q = createQuery(client, {
      key: ['inv'],
      queryFn: async () => {
        fetches++
        return fetches
      },
      refetchOnMount: false,
      staleTime: 0,
    })
    await q.refetch()
    expect(q.data.get()).to.equal(1)

    const m = createMutation(client, {
      mutationFn: async (v: number) => v,
      invalidateKeys: [['inv']],
    })

    await m.mutate(42)
    // invalidation with staleTime=0 should cause immediate refetch
    await new Promise((r) => setTimeout(r, 0))
    expect(q.data.get()).to.equal(2)
    q.dispose()
    await (client as any).stop()
  })
})
