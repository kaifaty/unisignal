/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../src/modules/persist/persist'
import type {SignalAdapter, SignalWritable} from '../../src/modules/adapter/types'

function createTestSignalAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      return {
        get: () => value,
        peek: () => value,
        set: (v: T) => (value = v),
        subscribe: () => () => {},
      }
    },
    computed<T>(_fn: () => T) {
      throw new Error('not needed')
    },
  }
}

describe('persist: enhancer and use', () => {
  it('enhancer adds state/computed persistence with defaults', () => {
    const base = createTestSignalAdapter()
    const enhanced = persist.use(base, persist.enhancer({storage: 'local', namespace: 'ns:'}))
    const s = (enhanced as any).state(0, {name: 'x'})
    s.set(1)
    expect(s.get()).to.equal(1)
  })
})
