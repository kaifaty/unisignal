import {expect} from '@esm-bundle/chai'
import type {adapter} from '../../../src'
import {QueryClient, createQuery} from '../../../src/modules/query'
import {createBasicAdapter} from '../fixtures/adapter'
import {createMemoryAdapter} from '../fixtures/persist'

function createTestAdapter(): adapter.SignalAdapter {
  return createBasicAdapter()
}

export const test = it

describe('query: persist auto-name', () => {
  test('persist:true generates name based on key and restores', async () => {
    const mem = createMemoryAdapter()
    const client = new QueryClient(createTestAdapter(), {persistNamespace: 'ns:', persistStorage: mem})
    let calls = 0
    const q1 = createQuery(client, {
      key: ['auto', 1],
      queryFn: async () => {
        calls++
        return {v: calls}
      },
      refetchOnMount: false,
      persist: true,
      staleTime: 0,
    })
    await q1.refetch()
    expect(q1.data.get()).to.deep.equal({v: 1})

    const q2 = createQuery(client, {
      key: ['auto', 1],
      queryFn: async () => ({v: 999}),
      refetchOnMount: false,
      persist: true,
    })
    expect(q2.data.get()).to.deep.equal({v: 1})
    q1.dispose()
    q2.dispose()
    await (client as any).stop()
  })
})
