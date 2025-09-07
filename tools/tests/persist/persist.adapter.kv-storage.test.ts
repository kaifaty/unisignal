import {expect} from '@esm-bundle/chai'
import {createKVAdapter} from '../../../src/modules/persist/adapters/kv-storage'

export const test = it

describe('persist: KV adapter', () => {
  test('list, set/get/clear parses JSON and ignores bad JSON', async () => {
    const store = new Map<string, string>()
    const kv = {
      async get(k: string) {
        return store.get(k)
      },
      async set(k: string, v: string) {
        store.set(k, v)
      },
      async delete(k: string) {
        store.delete(k)
      },
      async list() {
        return Array.from(store.keys())
      },
    }

    const a = createKVAdapter(kv as any, 'persist-kv-')

    await a.set('k', {value: 1} as any)
    const v = await a.get('k')
    expect(v).to.deep.equal({value: 1})

    const keys = await a.keys()
    expect(keys).to.deep.equal(['k'])

    // bad JSON
    store.set('persist-kv-bad', '{broken')
    const bad = await a.get('bad')
    expect(bad).to.equal(undefined)

    await a.clear('k')
    expect(await a.get('k')).to.equal(undefined)
  })
})
