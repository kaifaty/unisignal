import {expect} from '@esm-bundle/chai'
import {throttle} from '../../../src/modules/utils'

export const test = it

describe('utils: throttle', () => {
  test('time <= 0 returns immediate resolved result and calls once', async () => {
    let calls = 0
    const fn = (x: number) => {
      calls++
      return x * 2
    }
    const thr = throttle(fn, 0)

    const res = await thr(21)
    expect(res).to.equal(42)
    expect(calls).to.equal(1)
  })

  test('batches multiple calls within window; all resolve to last invocation result', async () => {
    let calls = 0
    const fn = (x: number) => {
      calls++
      return x * 3
    }
    const thr = throttle(fn, 5)

    const p1 = thr(1)
    const p2 = thr(2)
    const p3 = thr(3)

    const [r1, r2, r3] = await Promise.all([p1, p2, p3])
    expect(r1).to.equal(9)
    expect(r2).to.equal(9)
    expect(r3).to.equal(9)
    expect(calls).to.equal(1)
  })

  test('invokes again after timeout with latest args', async () => {
    let calls = 0
    const fn = (x: number) => {
      calls++
      return x + 1
    }
    const thr = throttle(fn, 6)

    const g1 = Promise.all([thr(10), thr(11)])
    const rFirst = await g1
    expect(rFirst[0]).to.equal(12)
    expect(rFirst[1]).to.equal(12)
    expect(calls).to.equal(1)

    // wait past the window
    await new Promise((r) => setTimeout(r, 8))

    const r2 = await thr(20)
    expect(r2).to.equal(21)
    expect(calls).to.equal(2)
  })
})
