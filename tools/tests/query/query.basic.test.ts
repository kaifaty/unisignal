import {expect} from '@esm-bundle/chai'
import {QueryClient, createQuery} from '../../../src/modules/query'
import {createTestQueryClient} from '../fixtures/query'

export const test = it

describe('query: basic', () => {
  test('runs query and sets success status', async () => {
    const client = createTestQueryClient()
    const q = createQuery(client, {
      key: ['users', 1],
      queryFn: async () => {
        await new Promise((r) => setTimeout(r, 10))
        return {id: 1}
      },
      refetchOnMount: false,
    })

    expect(q.status.get()).to.equal('idle')
    await q.refetch()
    expect(q.status.get()).to.equal('success')
    expect(q.data.get()).to.deep.equal({id: 1})
  })

  test('deduplicates concurrent refetch for same key', async () => {
    let callCount = 0
    const client = createTestQueryClient()
    const opts = {
      key: ['posts'],
      queryFn: async () => {
        callCount++
        await new Promise((r) => setTimeout(r, 20))
        return [1, 2, 3]
      },
      refetchOnMount: false,
    } as const
    const q1 = createQuery(client, opts)
    const q2 = createQuery(client, opts)

    await Promise.all([q1.refetch(), q2.refetch()])
    expect(callCount).to.equal(1)
    expect(q1.data.get()).to.deep.equal([1, 2, 3])
    expect(q2.data.get()).to.deep.equal([1, 2, 3])
  })
})
