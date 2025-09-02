/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import type {SignalAdapter, SignalWritable, SignalComputed} from '../../../src/modules/adapter/types'
import {createMemoryAdapter} from '../fixtures/persist'

function createTestSignalAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      const listeners = new Set<(v: T) => void>()
      return {
        get(): T {
          return value
        },
        set(v: T): void {
          value = v
          for (const l of listeners) l(v)
        },
        peek(): T {
          return value
        },
        subscribe(listener: (v: T) => void): () => void {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    },
    computed<T>(fn: () => T): SignalComputed<T> {
      // простой computed для тестов с ручным пересчётом
      let value = fn()
      const listeners = new Set<(v: T) => void>()
      const api = {
        get: () => value,
        peek: () => value,
        subscribe(listener: (v: T) => void) {
          listeners.add(listener)
          listener(value)
          return () => listeners.delete(listener)
        },
      }
      ;(api as any).$recompute = () => {
        value = fn()
        for (const l of listeners) l(value)
      }
      return api
    },
  }
}

describe('persist: namespace & name collisions', () => {
  it('одинаковые name в разных namespace не конфликтуют (state)', async () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()

    const s1 = persist.state(base, 0, {storage, name: 'k', namespace: 'ns1:'})
    const s2 = persist.state(base, 0, {storage, name: 'k', namespace: 'ns2:'})

    s1.set(1)
    s2.set(2)

    expect(s1.get()).to.equal(1)
    expect(s2.get()).to.equal(2)
    // ключи изолированы по namespace
    const allKeys = await persist.keys(base, {storage})
    expect(allKeys.sort()).to.deep.equal(['ns1:k', 'ns2:k'])
    const ns1 = await persist.keys(base, {storage, namespace: 'ns1:'})
    const ns2 = await persist.keys(base, {storage, namespace: 'ns2:'})
    expect(ns1).to.deep.equal(['k'])
    expect(ns2).to.deep.equal(['k'])
  })
})

describe('persist: функциональный namespace для state/computed и keys/clearAll', () => {
  it('state: функциональный namespace правильно формирует ключ и участвует в keys/clearAll', async () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()

    const s = persist.state(base, 'init', {storage, name: 'doc', namespace: (n) => `fn:${n}`})
    s.set('A')

    // keys по строковому префиксу должны найти ключ, созданный через функциональный namespace
    const list = await persist.keys(base, {storage, namespace: 'fn:'})
    expect(list).to.deep.equal(['doc'])

    // выборочная очистка по namespace должна удалить только соответствующие ключи
    await persist.clearAll(base, {storage, namespace: 'fn:'})
    const listAfter = await persist.keys(base, {storage, namespace: 'fn:'})
    expect(listAfter).to.deep.equal([])
  })

  it('computed: функциональный namespace используется для кэш-ключа', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const src = 2
    const c = persist.computed<number>(base, () => src * 3, {
      persist: true,
      storage,
      name: 'calc',
      namespace: (n) => `fn:${n}`,
    }) as any

    // подписка запускает запись кэша
    const unsub = c.subscribe(() => {})
    expect(storage.store.has('fn:calc')).to.equal(true)
    unsub()
  })
})
