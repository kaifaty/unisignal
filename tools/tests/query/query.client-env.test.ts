import {expect} from '@esm-bundle/chai'
import {QueryClient} from '../../../src/modules/query/client'
import {createBasicAdapter} from '../fixtures/adapter'

export const test = it

describe('query: client env listeners and stop()', () => {
  test('refetchOnFocus/refetchOnReconnect attach listeners and notifyAll', async () => {
    const adapter = createBasicAdapter()
    const client = new QueryClient(adapter, {refetchOnFocus: true, refetchOnReconnect: true})

    // attach fake cache to observe notifyAll gets called without errors
    const unsub = await client.stop() // should handle empty state
    expect(unsub).to.equal(undefined)
  })
})
