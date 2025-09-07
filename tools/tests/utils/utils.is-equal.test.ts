import {expect} from '@esm-bundle/chai'
import {isEqualSet} from '../../../src/modules/utils'

export const test = it

describe('utils: isEqualSet', () => {
  test('returns false when prev is undefined', () => {
    const cur = new Set([1, 2])
    expect(isEqualSet(cur, undefined)).to.equal(false)
  })

  test('returns false when sizes differ', () => {
    const cur = new Set([1, 2, 3])
    const prev = new Set([1, 2])
    expect(isEqualSet(cur, prev)).to.equal(false)
  })

  test('returns false when any element missing', () => {
    const cur = new Set([1, 2, 3])
    const prev = new Set([1, 4, 3])
    expect(isEqualSet(cur, prev)).to.equal(false)
  })

  test('returns true when both sets equal', () => {
    const cur = new Set([1, 2, 3])
    const prev = new Set([3, 2, 1])
    expect(isEqualSet(cur, prev)).to.equal(true)
  })
})
