import {expect} from '@esm-bundle/chai'
import {createLitSignalsAdapter} from '../../../src/modules/adapter/lit-signals'

export const test = it

describe('adapter: lit-signals', () => {
  test('state get/peek/set/subscribe and dispose', () => {
    const watchers = new Set<() => void>()
    const api = {
      signal<T>(initial: T) {
        let v = initial
        return {
          get: () => v,
          set: (nv: T) => {
            v = nv
            // trigger subscribers via effect
            watchers.forEach((fn) => fn())
          },
          peek: () => v,
        }
      },
      computed<T>(fn: () => T) {
        return {
          get: () => fn(),
          peek: () => fn(),
        }
      },
      effect(fn: () => void) {
        watchers.add(fn)
        // run once immediately
        fn()
        return () => watchers.delete(fn)
      },
    }

    const adapter = createLitSignalsAdapter(api)
    const s = adapter.state(1)

    expect(s.get()).to.equal(1)
    expect(s.peek()).to.equal(1)

    let seen: number[] = []
    const off = s.subscribe((val) => seen.push(val))

    s.set(2)
    s.set(3)
    expect(seen).to.deep.equal([1, 2, 3])

    off()
    s.set(4)
    expect(seen).to.deep.equal([1, 2, 3])
  })

  test('computed get/peek/subscribe reacts through effect and allows disposer object', () => {
    const watchers = new Set<() => void>()
    const subs: Set<() => void> = watchers
    let source = 10

    const api = {
      signal<T>(initial: T) {
        let v = initial
        return {
          get: () => v,
          set: (nv: T) => {
            v = nv
            subs.forEach((fn) => fn())
          },
          peek: () => v,
        }
      },
      computed<T>(fn: () => T) {
        return {
          get: () => fn(),
          peek: () => fn(),
        }
      },
      effect(fn: () => void) {
        watchers.add(fn)
        // run once
        fn()
        // return disposer-like object {dispose}
        return {dispose: () => watchers.delete(fn)}
      },
    }

    const adapter = createLitSignalsAdapter(api)
    const c = adapter.computed(() => source * 2)

    expect(c.get()).to.equal(20)
    expect(c.peek()).to.equal(20)

    let seen: number[] = []
    const off = c.subscribe((val) => seen.push(val))

    // change source and trigger effects
    source = 11
    watchers.forEach((fn) => fn())
    source = 12
    watchers.forEach((fn) => fn())

    expect(seen).to.deep.equal([20, 22, 24])

    off()
    source = 13
    watchers.forEach((fn) => fn())
    expect(seen).to.deep.equal([20, 22, 24])
  })
})
