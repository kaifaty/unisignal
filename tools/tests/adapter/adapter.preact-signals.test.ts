import {expect} from '@esm-bundle/chai'
import {createPreactSignalsAdapter} from '../../../src/modules/adapter/preact'

export const test = it

describe('adapter: preact-signals', () => {
  test('state get/peek/set/subscribe and disposer function', () => {
    const watchers = new Set<() => void>()
    const api = {
      signal<T>(initial: T) {
        return {
          value: initial,
          peek: function () {
            return this.value as T
          },
        }
      },
      computed<T>(fn: () => T) {
        return {
          get value() {
            return fn()
          },
          peek: () => fn(),
        } as any
      },
      effect(fn: () => void) {
        watchers.add(fn)
        fn()
        return () => watchers.delete(fn)
      },
    }

    const adapter = createPreactSignalsAdapter(api)
    const s = adapter.state(5)

    expect(s.get()).to.equal(5)
    expect(s.peek()).to.equal(5)

    const seen: number[] = []
    const off = s.subscribe((v) => seen.push(v))

    // mutate underlying signal
    ;(s as any).set(6)
    watchers.forEach((fn) => fn())
    ;(s as any).set(7)
    watchers.forEach((fn) => fn())

    expect(seen).to.deep.equal([5, 6, 7])

    off()
    ;(s as any).set(8)
    watchers.forEach((fn) => fn())
    expect(seen).to.deep.equal([5, 6, 7])
  })

  test('computed get/peek/subscribe updates via effect and disposer object', () => {
    const watchers = new Set<() => void>()
    let base = 3
    const api = {
      signal<T>(initial: T) {
        return {
          value: initial,
          peek: function () {
            return this.value as T
          },
        }
      },
      computed<T>(fn: () => T) {
        return {
          get value() {
            return fn()
          },
          peek: () => fn(),
        } as any
      },
      effect(fn: () => void) {
        watchers.add(fn)
        fn()
        return {dispose: () => watchers.delete(fn)}
      },
    }

    const adapter = createPreactSignalsAdapter(api)
    const c = adapter.computed(() => base * 10)

    expect(c.get()).to.equal(30)
    expect(c.peek()).to.equal(30)

    const seen: number[] = []
    const off = c.subscribe((v) => seen.push(v))

    base = 4
    watchers.forEach((fn) => fn())
    base = 5
    watchers.forEach((fn) => fn())

    expect(seen).to.deep.equal([30, 40, 50])

    off()
    base = 6
    watchers.forEach((fn) => fn())
    expect(seen).to.deep.equal([30, 40, 50])
  })
})
