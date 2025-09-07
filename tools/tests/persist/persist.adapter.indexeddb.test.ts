import {expect} from '@esm-bundle/chai'
import {IndexedDBAdapter, removeIDB} from '../../../src/modules/persist/adapters/indexeddb-storage'

export const test = it

describe('persist: IndexedDB adapter', () => {
  test('set/get/keys/clear with JSON payload', async () => {
    const a = new IndexedDBAdapter()

    // clean DB before
    removeIDB()

    a.set('k', {value: {a: 1}})
    // get
    const v = await a.get('k')
    expect(v).to.deep.equal({value: {a: 1}})

    // keys
    const ks = await a.keys()
    expect(ks).to.include('k')

    // clear and verify
    a.clear('k')
    const v2 = await a.get('k')
    expect(v2).to.equal(undefined)
  })
})
