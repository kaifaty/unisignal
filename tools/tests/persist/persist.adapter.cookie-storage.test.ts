import {expect} from '@esm-bundle/chai'
import {createCookieAdapter} from '../../../src/modules/persist/adapters/cookie-storage'

export const test = it

describe('persist: cookie adapter', () => {
  test('set/get/keys/clear and broken json cleanup', () => {
    // happy-dom provides document
    const a = createCookieAdapter({prefix: 'persist-cookie-'})

    a.set('k', {value: 1, timestamp: Date.now()})
    expect(a.get('k')).to.be.an('object')
    expect(a.keys()).to.include('k')

    // corrupt cookie
    document.cookie = 'persist-cookie-k=%7Bbroken; path=/'
    expect(a.get('k')).to.equal(undefined)

    a.clear('k')
    expect(a.get('k')).to.equal(undefined)
  })
})
