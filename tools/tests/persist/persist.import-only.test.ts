import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'

describe('persist import only', () => {
  it('loads module and defines api', () => {
    console.log('[import-only] persist keys available:', Object.keys(persist))
    expect(typeof persist.state).to.equal('function')
    expect(typeof persist.wrap).to.equal('function')
  })
})
