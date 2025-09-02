import {expect} from '@esm-bundle/chai'

describe('smoke', () => {
  it('runs', () => {
    console.log('[smoke] test runs')
    expect(1).to.equal(1)
  })
})
