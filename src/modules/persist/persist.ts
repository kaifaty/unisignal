/* eslint-disable @typescript-eslint/no-explicit-any */
import type {SignalAdapter} from '../adapter'
import type {
  PersistAdapter,
  PersistedSignalAdapter,
  CreatePersistedAdapterOptions,
  PersistStateOptions,
  ListOptions,
  PersistComputedOptions,
} from './types'

import {IndexedDBAdapter} from './adapters/indexeddb-storage'
import {createLocalAdapter} from './adapters/local-storage'

import type {PersistOptions} from './types'
import {createPersistState} from './utils'
import type {WritableLike} from './utils'
import {createPersistLogger} from './utils'

// Env and DX helpers (kept minimal to avoid prod overhead)
const isProductionEnv = (() => {
  try {
    // @ts-ignore
    const p = typeof process !== 'undefined' ? (process as any) : undefined
    return p?.env?.NODE_ENV === 'production'
  } catch {
    return false
  }
})()

let __persistAutoNameCounter = 0
const generateAutoName = () => `auto-${++__persistAutoNameCounter}`
const warnMissingName = (phase: 'state' | 'computed', generated: string) => {
  try {
    // eslint-disable-next-line no-console
    const c: any = typeof console !== 'undefined' ? console : undefined
    c?.warn?.(`[persist] missing "name" for ${phase} in dev; auto-generated: ${generated}`)
  } catch {
    // ignore
  }
}

// SSR-safe helpers
const getGlobalStorage = (key: 'localStorage' | 'sessionStorage'): Storage | undefined => {
  try {
    // @ts-ignore
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined
    return g && g[key] ? (g[key] as Storage) : undefined
  } catch {
    return undefined
  }
}

const createMemoryStorage = (): Storage => {
  let store = {} as Record<string, string>
  return {
    getItem(name: string) {
      return store[name]
    },
    setItem(name: string, value: string) {
      store[name] = value
    },
    removeItem(name: string) {
      delete store[name]
    },
    clear() {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key(i: number) {
      return Object.keys(store)[i] ?? null
    },
  } as Storage
}

let localAdapterInstance: InstanceType<ReturnType<typeof createLocalAdapter>> | undefined
let sessionAdapterInstance: InstanceType<ReturnType<typeof createLocalAdapter>> | undefined
let indexedDBAdapterInstance: IndexedDBAdapter | undefined

const getLocalAdapter = () => {
  if (!localAdapterInstance) {
    const storage = getGlobalStorage('localStorage') ?? createMemoryStorage()
    localAdapterInstance = new (createLocalAdapter(storage, 'localStorage'))()
  }
  return localAdapterInstance
}

const getSessionAdapter = () => {
  if (!sessionAdapterInstance) {
    const storage = getGlobalStorage('sessionStorage') ?? createMemoryStorage()
    sessionAdapterInstance = new (createLocalAdapter(storage, 'sessionStorage'))()
  }
  return sessionAdapterInstance
}

const getIndexedDBAdapter = () => {
  if (!indexedDBAdapterInstance) {
    indexedDBAdapterInstance = new IndexedDBAdapter()
  }
  return indexedDBAdapterInstance
}

const toStorageAdapter = (
  storage: 'local' | 'session' | 'idb' | PersistAdapter | undefined,
): PersistAdapter => {
  if (!storage || storage === 'local') return getLocalAdapter()
  if (storage === 'session') return getSessionAdapter()
  if (storage === 'idb') return getIndexedDBAdapter()
  return storage
}

export const createPersistedAdapter = (
  base: SignalAdapter,
  opts: CreatePersistedAdapterOptions = {},
): PersistedSignalAdapter => {
  const defaultStorage = toStorageAdapter(opts.storage)
  return {
    ...base,
    state<T>(initial: T | (() => T), options: PersistOptions<T>) {
      let effectiveOptions = options
      // Dev-only auto name for DX
      if (!(effectiveOptions as any)?.name && !isProductionEnv) {
        const gen = generateAutoName()
        warnMissingName('state', gen)
        effectiveOptions = {...(effectiveOptions as any), name: gen}
      }
      return createPersistState<T>(base, initial, defaultStorage, effectiveOptions)
    },
    computed<T>(fn: () => T, options?: PersistComputedOptions<T>) {
      const result = base.computed(fn, options)
      if (!options?.persist) return result
      let nameOpt = options?.name
      if (!nameOpt) {
        if (!isProductionEnv) {
          const gen = generateAutoName()
          warnMissingName('computed', gen)
          nameOpt = gen
        } else {
          // In production we do not auto-name computed; keep behavior unchanged (no caching)
          return result
        }
      }
      const storage = toStorageAdapter(options.storage)
      const nsName =
        typeof options.namespace === 'function'
          ? options.namespace(nameOpt)
          : (options.namespace ?? '') + nameOpt
      const log = createPersistLogger(options ?? {}, 'persist', {name: nsName})
      // try restore cached value once
      try {
        const raw = storage.get(nsName) as any
        if (raw !== undefined) {
          const isExpired =
            typeof options?.ttlMs === 'number' && raw?.timestamp && Date.now() - raw.timestamp > options.ttlMs
          if (!isExpired) {
            let restored = raw?.value ?? raw
            if (typeof options?.deserialize === 'function') {
              try {
                restored = options.deserialize(restored)
              } catch (e) {
                options?.debug && log('deserialize_error', {error: e})
                restored = undefined
              }
            }
            if (restored !== undefined && typeof options?.validate === 'function') {
              try {
                if (!options.validate(restored)) restored = undefined
              } catch {
                restored = undefined
              }
            }
            if (restored !== undefined) {
              // no direct set API for computed; we cannot mutate computed
              // So we just skip immediate injection; cache serves future subscribers
            }
          }
        }
      } catch {
        void 0
      }
      // persist on change with throttle 0
      let lastJson = ''
      const unsubscribe = result.subscribe((val) => {
        try {
          const toStore =
            typeof options?.serialize === 'function' ? options.serialize(val as any) : (val as any)
          const payload: any = {value: toStore, timestamp: Date.now()}
          const json = JSON.stringify(payload)
          if (json === lastJson) return
          lastJson = json
          storage.set(nsName, payload)
          log('set', {value: val})
        } catch (e) {
          options?.debug && log('persist_error', {error: e})
        }
      })
      // expose unsubscribe via name-anchored noop (cannot extend SignalReadable)
      void unsubscribe
      return result
    },
  }
}

// Простой контракт энхансера: принимает базовый адаптер и возвращает любой адаптер того же контракта.
// Специально ослабляем типы, чтобы поддержать энхансеры, расширяющие API (например, добавляющие persist.state/computed)
type AdapterEnhancer = (base: SignalAdapter) => SignalAdapter

export const persist = {
  state<T>(base: SignalAdapter, initial: T | (() => T), options: PersistStateOptions<T>) {
    const storage = toStorageAdapter(options.storage)
    let effective: any = options
    if (!(effective as any)?.name && !isProductionEnv) {
      const gen = generateAutoName()
      warnMissingName('state', gen)
      effective = {...effective, name: gen}
    }
    const {storage: _s, ...rest} = effective
    return createPersistState<T>(base, initial, storage, rest)
  },
  computed<T>(base: SignalAdapter, fn: () => T, options?: PersistComputedOptions<T>) {
    const adapter = createPersistedAdapter(base, {storage: options?.storage})
    return adapter.computed(fn, options)
  },
  wrap<T>(base: SignalAdapter, external: WritableLike<T>, options: PersistStateOptions<T>) {
    const storage = toStorageAdapter(options.storage)
    const {storage: _s, ...rest} = options
    return createPersistState<T>(base, external as any, storage, rest)
  },
  enhancer(opts: CreatePersistedAdapterOptions = {}): AdapterEnhancer {
    return (base: SignalAdapter) => createPersistedAdapter(base, opts) as unknown as SignalAdapter
  },
  use(base: SignalAdapter, ...enhancers: AdapterEnhancer[]): SignalAdapter {
    let current: SignalAdapter = base
    for (const e of enhancers) current = e(current)
    return current
  },
  async keys(base: SignalAdapter, options: ListOptions = {}) {
    const storage = toStorageAdapter(options.storage)
    const keys = await Promise.resolve(storage.keys())
    const ns = options.namespace ?? ''
    const result = !ns ? keys : keys.filter((k) => k.startsWith(ns)).map((k) => k.slice(ns.length))
    createPersistLogger(options, 'keys')('list', {namespace: ns || undefined, count: result.length})
    return result
  },
  async clearAll(base: SignalAdapter, options: ListOptions = {}) {
    const storage = toStorageAdapter(options.storage)
    const keys = await Promise.resolve(storage.keys())
    const ns = options.namespace ?? ''
    const log = createPersistLogger(options, 'clearAll')
    if (!ns) {
      for (const k of keys) storage.clear(k)
      log('cleared_all', {count: keys.length})
      return
    }
    let cleared = 0
    for (const k of keys) {
      if (k.startsWith(ns)) {
        storage.clear(k)
        cleared++
      }
    }
    log('cleared_ns', {namespace: ns, count: cleared})
  },
  with(
    defaults: {
      storage?: 'local' | 'session' | 'idb' | PersistAdapter
      namespace?: string | ((name: string) => string)
    } = {},
  ) {
    const self = persist
    return {
      state<T>(
        base: SignalAdapter,
        initial: T | (() => T),
        options: Omit<PersistStateOptions<T>, 'storage' | 'namespace'> & {
          storage?: PersistStateOptions<T>['storage']
          namespace?: PersistStateOptions<T>['namespace']
          name?: string
        },
      ) {
        const merged: any = {
          ...options,
          storage: options?.storage ?? defaults.storage,
          namespace: options?.namespace ?? defaults.namespace,
        }
        return self.state<T>(base, initial, merged as PersistStateOptions<T>)
      },
      computed<T>(
        base: SignalAdapter,
        fn: () => T,
        options?: Omit<PersistComputedOptions<T>, 'storage' | 'namespace'> & {
          storage?: PersistComputedOptions<T>['storage']
          namespace?: PersistComputedOptions<T>['namespace']
        },
      ) {
        const merged: any = {
          ...options,
          storage: options?.storage ?? defaults.storage,
          namespace: options?.namespace ?? defaults.namespace,
        }
        return self.computed<T>(base, fn, merged as PersistComputedOptions<T>)
      },
      wrap<T>(
        base: SignalAdapter,
        external: WritableLike<T>,
        options: Omit<PersistStateOptions<T>, 'storage' | 'namespace'> & {
          storage?: PersistStateOptions<T>['storage']
          namespace?: PersistStateOptions<T>['namespace']
          name?: string
        },
      ) {
        const merged: any = {
          ...options,
          storage: options?.storage ?? defaults.storage,
          namespace: options?.namespace ?? defaults.namespace,
        }
        return self.wrap<T>(base, external, merged as PersistStateOptions<T>)
      },
      keys(
        base: SignalAdapter,
        options: Omit<ListOptions, 'storage' | 'namespace'> & {
          storage?: ListOptions['storage']
          namespace?: ListOptions['namespace']
        } = {},
      ) {
        const merged: any = {
          ...options,
          storage: options?.storage ?? defaults.storage,
          namespace:
            options?.namespace ?? (typeof defaults.namespace === 'string' ? defaults.namespace : undefined),
        }
        return self.keys(base, merged as ListOptions)
      },
      clearAll(
        base: SignalAdapter,
        options: Omit<ListOptions, 'storage' | 'namespace'> & {
          storage?: ListOptions['storage']
          namespace?: ListOptions['namespace']
        } = {},
      ) {
        const merged: any = {
          ...options,
          storage: options?.storage ?? defaults.storage,
          namespace:
            options?.namespace ?? (typeof defaults.namespace === 'string' ? defaults.namespace : undefined),
        }
        return self.clearAll(base, merged as ListOptions)
      },
    }
  },
}
