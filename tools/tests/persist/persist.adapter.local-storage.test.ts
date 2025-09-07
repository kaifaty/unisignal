import {expect} from '@esm-bundle/chai'
import {createLocalAdapter} from '../../../src/modules/persist/adapters/local-storage'

export const test = it

describe('persist: local-storage adapter', () => {
  function createFakeStorage() {
    const map = new Map<string, string>()
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => map.set(k, v),
      removeItem: (k: string) => map.delete(k),
      clear: () => map.clear(),
      key: (i: number) => Array.from(map.keys())[i] ?? null,
      get length() {
        return map.size
      },
      _map: map,
    } as unknown as Storage & { _map: Map<string, string> }
  }

  test('set/get/keys/clear and kind detection', () => {
    const st = createFakeStorage()
    const Adapter = createLocalAdapter(st, 'localStorage')
    const a = new Adapter()

    a.set('k', {value: 1, timestamp: Date.now()})
    expect(a.get('k')).to.be.an('object')

    const keys = a.keys()
    expect(keys).to.deep.equal(['k'])

    a.clear('k')
    expect(a.get('k')).to.equal(undefined)
  })

  test('rejects NOT_ALLOWED_TYPES and handles broken JSON', () => {
    const st = createFakeStorage()
    const Adapter = createLocalAdapter(st, 'localStorage')
    const a = new Adapter()

    // @ts-expect-error intentional
    a.set('bad', () => {})

    // simulate broken JSON
    st.setItem('persist-local-storage-bad', '{broken')
    const v = a.get('bad')
    expect(v).to.equal(undefined)
    // cleans up invalid key
    expect(st.getItem('persist-local-storage-bad')).to.equal(null)
  })
})
