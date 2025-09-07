import {expect} from '@esm-bundle/chai'
import {QueryClient} from '../../../src/modules/query/client'
import {createBasicAdapter} from '../fixtures/adapter'

export const test = it

describe('query: client utils', () => {
  test('inspect, retain/release with gc, invalidateQueries by key and predicate, keySerializer', async () => {
    const adapter = createBasicAdapter()
    const client = new QueryClient(adapter, {keySerializer: (k) => 'k:' + JSON.stringify(k)})

    const keyA = ['a', 1] as const
    const keyB = ['b'] as const

    // create records via retain
    client.retain(keyA)
    client.retain(keyB)

    // inspect
    const info = client.inspect()
    expect(info.size).to.equal(2)
    expect(info.keys).to.include('k:["a",1]')

    // invalidateQueries by exact key
    client.invalidateQueries(keyA)

    // predicate invalidation
    client.invalidateQueries((k) => (k as any)[0] === 'b')

    // release with gc -> should delete after timeout
    client.release(keyA, 5)
    client.release(keyB, 5)
    await new Promise((r) => setTimeout(r, 8))

    expect(client.__getCacheSizeForTests()).to.equal(0)

    await client.stop()
  })
})
