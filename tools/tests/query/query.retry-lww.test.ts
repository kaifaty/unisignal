import {expect} from '@esm-bundle/chai'
import {QueryClient, createQuery} from '../../../src/modules/query'
import {createBasicAdapter} from '../fixtures/adapter'

export const test = it

describe('query: retry and last-write-wins', () => {
  test('retry retries specified number of times with predicate', async () => {
    const client = new QueryClient(createBasicAdapter())
    let calls = 0
    const q = createQuery(client, {
      key: ['retry', 'basic'],
      queryFn: async () => {
        calls++
        if (calls < 3) throw new Error('fail')
        return 'ok'
      },
      refetchOnMount: false,
      retry: {count: 2, delay: () => 0},
    })

    await q.refetch()
    expect(q.status.get()).to.equal('success')
    expect(q.data.get()).to.equal('ok')
    expect(calls).to.equal(3)
    q.dispose()
  })

  test('deduplicates concurrent refetch; single result applied', async () => {
    const client = new QueryClient(createBasicAdapter())
    let resA: (v: unknown) => void
    let resB: (v: unknown) => void
    const q = createQuery(client, {
      key: ['lww'],
      queryFn: async () => {
        // two overlapping fetches
        if (!resA) {
          await new Promise((r) => (resA = r))
          return 'A'
        } else {
          await new Promise((r) => (resB = r))
          return 'B'
        }
      },
      refetchOnMount: false,
    })

    const p1 = q.refetch()
    const p2 = q.refetch()
    // Only the first fetch should run; second awaits the same promise
    resA?.(undefined)
    await Promise.all([p1, p2])
    expect(q.data.get()).to.equal('A')
    q.dispose()
  })
})
