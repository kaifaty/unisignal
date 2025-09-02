import {expect} from '@esm-bundle/chai'
import type {adapter} from '../../../src'
import {QueryClient, createQuery} from '../../../src/modules/query'
import {createBasicAdapter} from '../fixtures/adapter'

function createTestAdapter(): adapter.SignalAdapter {
  return createBasicAdapter()
}

export const test = it

describe('query: options', () => {
  test('enabled=false prevents auto refetch', async () => {
    let calls = 0
    const client = new QueryClient(createTestAdapter())
    const q = createQuery(client, {
      key: ['opt', 'enabled'],
      queryFn: async () => {
        calls++
        return 1
      },
      refetchOnMount: true,
      enabled: false,
    })
    expect(calls).to.equal(0)
    await q.refetch()
    expect(calls).to.equal(1)
  })

  test('select projects data into selected', async () => {
    let calls = 0
    const client = new QueryClient(createTestAdapter())
    const q = createQuery<number, unknown, string>(client, {
      key: ['opt', 'select'],
      queryFn: async () => {
        calls++
        return 2
      },
      refetchOnMount: false,
      select: (n: number) => `v:${n}`,
    })
    expect(q.selected?.get()).to.equal(undefined)
    await q.refetch()
    expect(q.data.get()).to.equal(2)
    expect(q.selected?.get()).to.equal('v:2')
  })

  test('fast path skips fetch when not stale and data exists', async () => {
    let calls = 0
    const client = new QueryClient(createTestAdapter())
    const q1 = createQuery(client, {
      key: ['opt', 'fast'],
      queryFn: async () => {
        calls++
        return 7
      },
      refetchOnMount: false,
      staleTime: 1000,
    })
    await q1.refetch()
    expect(calls).to.equal(1)
    const q2 = createQuery(client, {
      key: ['opt', 'fast'],
      queryFn: async () => {
        calls++
        return 8
      },
      refetchOnMount: true,
      staleTime: 1000,
    })
    // thanks to fast path, second instance should not trigger fetch
    expect(calls).to.equal(1)
    expect(q2.data.get()).to.equal(7)
  })

  test('keepPreviousData keeps old data while refetching', async () => {
    let calls = 0
    const client = new QueryClient(createTestAdapter())
    const q = createQuery(client, {
      key: ['opt', 'keep'],
      queryFn: async () => {
        calls++
        return calls
      },
      refetchOnMount: false,
      keepPreviousData: true,
    })
    await q.refetch()
    expect(q.data.get()).to.equal(1)
    // trigger second fetch; data should still be 1 until finished
    const p = q.refetch()
    expect(q.data.get()).to.equal(1)
    await p
    expect(q.data.get()).to.equal(2)
  })
})
