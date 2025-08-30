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
        set: (v: T) => (value = v),
        peek: () => value,
        subscribe: () => () => {},
      }
    },
    computed<T>(_fn: () => T) {
      throw new Error('not needed')
    },
  }
}

describe('persist: storage selection', () => {
  it('local storage adapter (memory fallback) persists and lists keys', async () => {
    const base = createTestSignalAdapter()
    const s = persist.state(base, 0, {storage: 'local', name: 'ls-key'})
    s.set(1)
    const keys = await persist.keys(base, {storage: 'local'})
    expect(keys.includes('ls-key')).to.equal(true)
  })

  it('session storage adapter (memory fallback) persists and lists keys', async () => {
    const base = createTestSignalAdapter()
    const s = persist.state(base, 'a', {storage: 'session', name: 'ss-key'})
    s.set('b')
    const keys = await persist.keys(base, {storage: 'session'})
    expect(keys.includes('ss-key')).to.equal(true)
  })
})
