// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable */
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
          listeners.forEach((l) => l(v))
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
      const value = fn()
      return {
        get: () => value,
        peek: () => value,
        subscribe: () => () => {},
      }
    },
  }
}

describe('persist: SSR/окружение без globalThis', () => {
  let originalGlobalThis: any

  beforeEach(() => {
    // Сохраняем оригинальный globalThis
    originalGlobalThis = globalThis
  })

  afterEach(() => {
    // Восстанавливаем оригинальный globalThis
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any) = originalGlobalThis
  })

  it('работает без window/localStorage - использует in-memory storage', () => {
    // Мокируем globalThis без window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any) = {}

    const base = createTestSignalAdapter()
    const s = persist.state(base, 'init', {storage: 'local', name: 'test-no-window'})

    // Должно работать без ошибок
    expect(s.get()).to.equal('init')
    s.set('updated')
    expect(s.get()).to.equal('updated')
  })

  it('работает без window/sessionStorage - использует in-memory storage', () => {
    // Мокируем globalThis с window, но без sessionStorage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any) = {window: {}}

    const base = createTestSignalAdapter()
    const s = persist.state(base, 'init', {storage: 'session', name: 'test-no-session'})

    // Должно работать без ошибок
    expect(s.get()).to.equal('init')
    s.set('updated')
    expect(s.get()).to.equal('updated')
  })

  it('persist.keys работает без window/localStorage', async () => {
    // Мокируем отсутствие window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any) = {}

    const base = createTestSignalAdapter()

    // Используем уникальные имена для изоляции теста
    const uniqueId = Date.now().toString()
    const key1 = `ssr-key1-${uniqueId}`
    const key2 = `ssr-key2-${uniqueId}`

    // Создаем несколько persist state
    const s1 = persist.state(base, 'val1', {storage: 'local', name: key1})
    const s2 = persist.state(base, 'val2', {storage: 'local', name: key2})
    s1.set('updated1')
    s2.set('updated2')

    // keys должен работать без ошибок
    const keys = await persist.keys(base, {storage: 'local'})
    const ourKeys = keys.filter((k) => k.startsWith(`ssr-key`))
    expect(ourKeys.length).to.equal(2)
    expect(ourKeys.sort()).to.deep.equal([key1, key2].sort())
  })

  it('persist.clearAll работает без window/localStorage', async () => {
    // Мокируем отсутствие window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any) = {}

    const base = createTestSignalAdapter()

    const s1 = persist.state(base, 'val1', {storage: 'local', name: 'clear1'})
    const s2 = persist.state(base, 'val2', {storage: 'local', name: 'clear2'})
    s1.set('updated1')
    s2.set('updated2')

    // clearAll должен работать без ошибок
    await persist.clearAll(base, {storage: 'local'})

    const keys = await persist.keys(base, {storage: 'local'})
    expect(keys.length).to.equal(0)
  })

  it('computed persist работает без window/localStorage', () => {
    // Мокируем отсутствие window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any) = {}

    const base = createTestSignalAdapter()
    let source = 'test'
    const c = persist.computed(base, () => source, {
      persist: true,
      storage: 'local',
      name: 'computed-ssr',
    })

    // Должен работать без ошибок
    expect(c.get()).to.equal('test')
    source = 'updated'
    // В тесте computed не реактивен, но persist должен работать
  })

  it('explicit memory adapter работает в любой среде', () => {
    // Даже без window, explicit memory adapter должен работать
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any) = {}

    const base = createTestSignalAdapter()
    const memAdapter = createMemoryAdapter()

    const s = persist.state(base, 'init', {
      storage: memAdapter,
      name: 'explicit-memory',
    })

    expect(s.get()).to.equal('init')
    s.set('updated')
    expect(s.get()).to.equal('updated')

    // Проверяем, что данные сохранены в memory adapter
    const stored = memAdapter.get('explicit-memory')
    expect(stored).to.not.be.undefined
  })

  it('sync: storage работает без window (игнорируется без ошибок)', () => {
    // Мокируем отсутствие window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any) = {}

    const base = createTestSignalAdapter()
    const s = persist.state(base, 'init', {
      storage: 'local',
      name: 'sync-no-window',
      sync: 'storage',
    })

    // Должен работать без ошибок, просто без синхронизации
    expect(s.get()).to.equal('init')
    s.set('updated')
    expect(s.get()).to.equal('updated')
  })

  it('async storage (idb) работает без window (fallback to memory)', () => {
    // Мокируем отсутствие window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any) = {}

    const base = createTestSignalAdapter()
    const s = persist.state(base, 'init', {
      storage: 'idb',
      name: 'async-ssr',
    })

    // Должен работать без ошибок, используя memory fallback
    expect(s.get()).to.equal('init')
    s.set('updated')
    expect(s.get()).to.equal('updated')
  })

  it('persist работает с частично поврежденным globalThis', () => {
    // Мокируем globalThis с window, но без localStorage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any) = {
      window: {
        // localStorage отсутствует
      },
    }

    const base = createTestSignalAdapter()
    const s = persist.state(base, 'init', {storage: 'local', name: 'partial-global'})

    // Должен работать без ошибок, используя memory fallback
    expect(s.get()).to.equal('init')
    s.set('updated')
    expect(s.get()).to.equal('updated')
  })
})
