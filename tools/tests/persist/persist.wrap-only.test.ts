/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import type {SignalAdapter, SignalWritable} from '../../../src/modules/adapter/types'

function createTestSignalAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      const listeners = new Set<(v: T) => void>()
      return {
        get() {
          return value
        },
        set(v: T) {
          value = v
          listeners.forEach((l) => l(v))
        },
        peek() {
          return value
        },
        subscribe(l: (v: T) => void) {
          listeners.add(l)
          return () => listeners.delete(l)
        },
      }
    },
    computed<T>(_fn: () => T) {
      throw new Error('not needed')
    },
  }
}

type ExtWritable<T> = {get(): T; set(v: T): void; peek(): T}
function createExternalWritable<T>(initial: T): ExtWritable<T> {
  let value = initial
  return {
    get: () => value,
    set: (v) => (value = v),
    peek: () => value,
  }
}

describe('persist wrap only', () => {
  it('wrap basic', () => {
    const base = createTestSignalAdapter()
    const external = createExternalWritable(1)
    const storage = {
      isAsync: false,
      get() {},
      set() {},
      clear() {},
      keys() {
        return [] as string[]
      },
    } as any
    const w = persist.wrap<number>(base, external as any, {storage, name: 't'}) as any
    expect(w.get()).to.equal(1)
    w.set(2)
    expect(w.get()).to.equal(2)
  })
})
