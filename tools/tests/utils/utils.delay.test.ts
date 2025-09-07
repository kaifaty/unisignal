import {expect} from '@esm-bundle/chai'
import {delay} from '../../../src/modules/utils'

export const test = it

describe('utils: delay', () => {
  test('resolves after specified time', async () => {
    const t0 = Date.now()
    await delay(5)
    const dt = Date.now() - t0
    expect(dt).to.be.greaterThanOrEqual(4)
  })
})
