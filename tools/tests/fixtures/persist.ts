/* eslint-disable @typescript-eslint/no-explicit-any */
import type {SignalAdapter} from '../../../src/modules/adapter/types'
import type {PersistAdapter, PersistStateOptions} from '../../../src/modules/persist/types'
import {persist} from '../../../src/modules/persist/persist'

export function createMemoryAdapter(): PersistAdapter & {store: Map<string, any>} {
  const store = new Map<string, any>()
  return {
    isAsync: false,
    store,
    get(name: string) {
      return store.get(name)
    },
    set(name: string, value: unknown) {
      store.set(name, value)
    },
    clear(name: string) {
      store.delete(name)
    },
    keys(): string[] {
      return Array.from(store.keys())
    },
  }
}

export function createAsyncMemoryAdapter(): PersistAdapter & {store: Map<string, any>} {
  const sync = createMemoryAdapter()
  return {
    ...sync,
    isAsync: true,
    async get(name: string) {
      return Promise.resolve(sync.get(name))
    },
  }
}

export type ExtWritable<T> = {
  get(): T
  set(v: T): void
  peek(): T
}

export function createExternalWritable<T>(initial: T): ExtWritable<T> {
  let value = initial
  return {
    get: () => value,
    set: (v) => (value = v),
    peek: () => value,
  }
}

export async function waitFor(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

// Утилиты для тестирования persist
export function createTestPersistState(
  baseAdapter: SignalAdapter,
  initialValue: unknown,
  options: PersistStateOptions<unknown>,
) {
  return persist.state(baseAdapter, initialValue, options)
}

export function createTestPersistComputed(
  baseAdapter: SignalAdapter,
  computeFn: () => unknown,
  options: PersistStateOptions<unknown>,
) {
  return persist.computed(baseAdapter, computeFn, options)
}

// Утилита для создания persist с общими настройками
export function createPersistWithDefaults(
  baseAdapter: SignalAdapter,
  storage: PersistAdapter,
  namespace?: string,
) {
  return persist.with({
    storage,
    namespace: namespace ?? '',
  })
}

// Утилита для генерации уникальных имен для тестов
export function generateTestKey(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
