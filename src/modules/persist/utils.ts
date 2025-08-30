/* eslint-disable @typescript-eslint/no-explicit-any */
import type {SignalAdapter} from '../adapter'
import type {PersistAdapter, PersistOptions, PersistState} from './types'
import {throttle} from '../utils'

// Debug logger helper: zero-cost when debug is disabled
export const createPersistLogger = (
  options: {debug?: boolean | {logger?: (message: string, context: any) => void}},
  phase: 'restore' | 'persist' | 'sync' | 'keys' | 'clearAll',
  baseContext: Record<string, unknown> = {},
) => {
  const dbg = options?.debug
  if (!dbg) return (_event: string, _ctx?: Record<string, unknown>) => {}
  const defaultLogger = (message: string, context: any) => {
    try {
      // eslint-disable-next-line no-console
      const c: any = typeof console !== 'undefined' ? console : undefined
      if (!c) return
      if (typeof c.debug === 'function') c.debug(message, context)
      else if (typeof c.log === 'function') c.log(message, context)
    } catch {
      // ignore
    }
  }
  const logger = typeof dbg === 'object' && typeof dbg.logger === 'function' ? dbg.logger : defaultLogger
  return (event: string, extraContext?: Record<string, unknown>) => {
    const context = {...baseContext, ...extraContext}
    try {
      logger(`[persist:${phase}] ${event}`, context)
    } catch {
      // ignore
    }
  }
}

type MaybeExternalStateFn = ((...args: any[]) => any) & {
  peek?: () => any
  get?: () => any
  set?: (v: any) => void
}

const isStatxFn = (value: unknown): value is MaybeExternalStateFn => {
  if (typeof value !== 'function') return false
  const v = value as MaybeExternalStateFn
  return typeof v.peek === 'function' && typeof v.get === 'function' && typeof v.set === 'function'
}

const getInitialValue = (value: unknown, storageAdapter: PersistAdapter, name: string) => {
  if (isStatxFn(value)) {
    return (value as any)()
  }

  const existValue = storageAdapter.get(name)

  if (typeof value === 'function') {
    if (storageAdapter.isAsync) {
      return value()
    }
    // treat null as valid stored value; only undefined means "no value"
    return existValue !== undefined ? existValue : (value as any)()
  }

  // treat null as valid stored value; only undefined means "no value"
  return existValue !== undefined ? existValue : value
}

const tryGetRestoredValue = (
  value: unknown,
  storageAdapter: PersistAdapter,
  options: PersistOptions<any>,
) => {
  const initial = getInitialValue(value, storageAdapter, options.name)

  return options.restoreFn?.(initial) ?? initial
}

function isExpiredRecord(raw: any, ttlMs: number | undefined): boolean {
  if (typeof ttlMs !== 'number') return false
  if (!raw || typeof raw.timestamp !== 'number') return false
  return Date.now() - raw.timestamp > ttlMs
}

export type WritableLike<T> = {
  get(): T
  set(v: T): void
  peek(): T
}

const applyPersist = async <T>(
  stateValue: WritableLike<T>,
  storageAdapter: PersistAdapter,
  options: PersistOptions<T>,
  onRestored: ((value: T) => void) | undefined,
  fullKey: string,
) => {
  try {
    const log = createPersistLogger(options as any, 'restore', {name: fullKey})
    if (storageAdapter.isAsync) {
      const currentValue = storageAdapter.get(fullKey)
      const raw = await (currentValue as Promise<any>)
      if (raw !== undefined) {
        if (isExpiredRecord(raw, options.ttlMs)) {
          log('expired', {ttlMs: options.ttlMs})
          options.onExpire?.()
          stateValue.set(stateValue.peek())
        } else {
          const incomingVersion = raw?.version
          let restored: any = (raw as any)?.value ?? raw
          // 1) migrate
          if (options.version !== undefined && incomingVersion !== undefined && options.migrations) {
            try {
              for (let v = incomingVersion + 1; v <= options.version; v++) {
                const m = options.migrations[v]
                if (typeof m === 'function') restored = m(restored)
              }
            } catch (e) {
              log('migrate_error', {error: e})
              options.onError?.(e, {phase: 'migrate'})
              restored = undefined
            }
          }
          // 2) deserialize
          if (typeof options.deserialize === 'function') {
            try {
              restored = options.deserialize(restored as any)
            } catch (e) {
              log('deserialize_error', {error: e})
              console.warn('[persist] deserialize error on async restore, using current value:', e)
              options.onError?.(e, {phase: 'deserialize'})
              restored = undefined
            }
          }
          // 3) validate
          if (restored !== undefined && typeof options.validate === 'function') {
            try {
              if (!options.validate(restored as T)) {
                log('validate_failed')
                console.warn('[persist] invalid value on async restore, ignoring')
                restored = undefined
              }
            } catch (e) {
              log('validate_error', {error: e})
              console.warn('[persist] validate threw on async restore, ignoring:', e)
              options.onError?.(e, {phase: 'validate'})
              restored = undefined
            }
          }
          if (restored !== undefined) {
            const next = (options.restoreFn?.(restored as any) ?? restored) as T
            if (onRestored) {
              try {
                onRestored(next)
              } catch (e) {
                log('onRestore_error', {error: e})
                options.onError?.(e, {phase: 'restore'})
              }
            } else {
              stateValue.set(next)
            }
            log('restored', {value: next})
          }
        }
      }
    }
  } finally {
    ;(options as any).onPersisStateInit?.(stateValue.get() as T)
  }
}

export const createPersistState = <T>(
  signalAdapter: SignalAdapter,
  value: unknown | WritableLike<T>,
  storageAdapter: PersistAdapter,
  options: PersistOptions<T>,
): PersistState<T> => {
  let stateValue: WritableLike<T>
  let initialValue: T
  let isRestored = false
  let restoredOnce = false

  const name =
    typeof options.namespace === 'function'
      ? options.namespace(options.name)
      : (options.namespace ?? '') + options.name

  // Prepare loggers per phase to minimize overhead
  const logRestore = createPersistLogger(options, 'restore', {name})
  const logPersist = createPersistLogger(options, 'persist', {name})
  const logSync = createPersistLogger(options, 'sync', {name})

  if (isStatxFn(value)) {
    // Provided external state: capture its current value for clear()
    initialValue = (value as WritableLike<T>).peek()
    stateValue = value as WritableLike<T>
  } else {
    // Compute default value exactly once
    initialValue = (typeof value === 'function' ? (value as () => T)() : (value as T)) as T

    // For sync adapters, restore immediately if a stored value exists; for async, start with default
    let startValue: T = initialValue
    if (!storageAdapter.isAsync) {
      const existing = storageAdapter.get(name)
      if (existing !== undefined) {
        const raw = existing as any
        if (isExpiredRecord(raw, options.ttlMs)) {
          logRestore('expired', {ttlMs: options.ttlMs})
          options.onExpire?.()
          startValue = initialValue
        } else {
          const incomingVersion = raw?.version
          let restored: unknown = raw?.value ?? raw
          // 1) migrate
          if (options.version !== undefined && incomingVersion !== undefined && options.migrations) {
            try {
              for (let v = incomingVersion + 1; v <= options.version; v++) {
                const m = options.migrations[v]
                if (typeof m === 'function') restored = m(restored)
              }
            } catch (e) {
              logRestore('migrate_error', {error: e})
              options.onError?.(e, {phase: 'migrate'})
              restored = undefined
              startValue = initialValue
            }
          }
          // 2) deserialize
          if (typeof options.deserialize === 'function') {
            try {
              restored = options.deserialize(restored)
            } catch (e) {
              logRestore('deserialize_error', {error: e})
              console.warn('[persist] deserialize error, falling back to default:', e)
              options.onError?.(e, {phase: 'deserialize'})
              startValue = initialValue
              restored = undefined
            }
          }
          // 3) validate
          if (restored !== undefined && typeof options.validate === 'function') {
            try {
              if (!options.validate(restored as T)) {
                logRestore('validate_failed')
                console.warn('[persist] invalid restored value, fallback to default')
                restored = undefined
                startValue = initialValue
              }
            } catch (e) {
              logRestore('validate_error', {error: e})
              console.warn('[persist] validate threw, fallback to default:', e)
              options.onError?.(e, {phase: 'validate'})
              restored = undefined
              startValue = initialValue
            }
          }
          if (restored !== undefined) {
            startValue = (options.restoreFn?.(restored as T) ?? (restored as T)) as T
            isRestored = true
            restoredOnce = true
            try {
              options.onRestore?.(startValue as T)
            } catch (e) {
              logRestore('onRestore_error', {error: e})
              options.onError?.(e, {phase: 'restore'})
            }
            logRestore('restored', {value: startValue})
          }
        }
      }
    }

    stateValue = signalAdapter.state<T>(startValue as T) as unknown as WritableLike<T>
  }

  // For async adapters, restore after creation and notify init hook
  const setFromRestore = (next: T) => {
    stateValue.set(next)
    isRestored = true
    restoredOnce = true
    try {
      options.onRestore?.(next)
    } catch (e) {
      options.onError?.(e, {phase: 'restore'})
    }
  }

  applyPersist(stateValue, storageAdapter, options, setFromRestore, name)

  // Sync across contexts if required
  let bc: BroadcastChannel | undefined
  if (options.sync === 'broadcast') {
    try {
      // @ts-ignore
      const g = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined
      const BC = g?.BroadcastChannel
      if (BC) {
        const channel: BroadcastChannel = new BC(options.broadcastChannelName ?? 'statx-persist')
        channel.onmessage = (ev: MessageEvent) => {
          const msg = ev.data as {type: 'set' | 'clear'; name: string; value?: unknown}
          if (!msg || msg.name !== name) return
          if (msg.type === 'clear') {
            logSync('broadcast_clear')
            stateValue.set(initialValue)
          } else if (msg.type === 'set') {
            const incoming: any = msg.value
            if (typeof options.validate === 'function') {
              try {
                if (!options.validate(incoming)) {
                  logSync('broadcast_validate_failed')
                  console.warn('[persist] invalid broadcast value, ignoring')
                  return
                }
              } catch (e) {
                logSync('broadcast_validate_error', {error: e})
                console.warn('[persist] validate threw on broadcast, ignoring:', e)
                options.onError?.(e, {phase: 'validate'})
                return
              }
            }
            const next = (options.restoreFn?.(incoming as any) ?? incoming) as T
            stateValue.set(next)
            isRestored = true
            restoredOnce = true
            try {
              options.onRestore?.(next)
            } catch (e) {
              logSync('onRestore_error', {error: e})
              options.onError?.(e, {phase: 'restore'})
            }
            logSync('broadcast_set', {value: next})
          }
        }
        bc = channel
      }
    } catch (e) {
      void e
    }
  }

  if (options.sync === 'storage') {
    try {
      // @ts-ignore
      const g = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined
      const w = g?.window as Window | undefined
      if (w && typeof w.addEventListener === 'function') {
        w.addEventListener('storage', (e: StorageEvent) => {
          const fullKey = e.key ?? ''
          if (!fullKey.endsWith(name)) return
          try {
            const raw = e.newValue ? JSON.parse(e.newValue) : undefined
            if (!raw) {
              logSync('storage_cleared')
              stateValue.set(initialValue)
            } else {
              if (isExpiredRecord(raw, options.ttlMs)) {
                logSync('storage_expired', {ttlMs: options.ttlMs})
                options.onExpire?.()
                stateValue.set(initialValue)
              } else {
                const incomingVersion = raw?.version
                let restored: any = raw?.value ?? raw
                // decrypt if needed
                if (raw && raw.__enc__ && typeof options.decrypt === 'function') {
                  try {
                    const plaintext = options.decrypt(restored)
                    const parsed = JSON.parse(plaintext)
                    restored = parsed?.value ?? parsed
                  } catch (e2) {
                    options.onError?.(e2, {phase: 'decrypt'})
                    restored = undefined
                  }
                }
                // 1) migrate
                if (options.version !== undefined && incomingVersion !== undefined && options.migrations) {
                  try {
                    for (let v = incomingVersion + 1; v <= options.version; v++) {
                      const m = options.migrations[v]
                      if (typeof m === 'function') restored = m(restored)
                    }
                  } catch (e) {
                    logSync('migrate_error', {error: e})
                    options.onError?.(e, {phase: 'migrate'})
                    restored = undefined
                  }
                }
                // 2) deserialize
                if (typeof options.deserialize === 'function') {
                  try {
                    restored = options.deserialize(restored)
                  } catch (err2) {
                    logSync('deserialize_error', {error: err2})
                    console.warn('[persist] deserialize error on storage event, fallback:', err2)
                    options.onError?.(err2, {phase: 'deserialize'})
                    restored = undefined
                  }
                }
                // 3) validate
                if (restored !== undefined && typeof options.validate === 'function') {
                  try {
                    if (!options.validate(restored)) {
                      logSync('validate_failed')
                      console.warn('[persist] invalid value on storage event, fallback to default')
                      restored = undefined
                    }
                  } catch (err3) {
                    logSync('validate_error', {error: err3})
                    console.warn('[persist] validate threw on storage event, fallback:', err3)
                    options.onError?.(err3, {phase: 'validate'})
                    restored = undefined
                  }
                }
                if (restored === undefined) {
                  stateValue.set(initialValue)
                } else {
                  const next = options.restoreFn?.(restored) ?? restored
                  stateValue.set(next)
                  isRestored = true
                  restoredOnce = true
                  try {
                    options.onRestore?.(next)
                  } catch (e) {
                    logSync('onRestore_error', {error: e})
                    options.onError?.(e, {phase: 'restore'})
                  }
                  logSync('storage_set', {value: next})
                }
              }
            }
          } catch (err) {
            options.onError?.(err, {phase: 'sync'})
          }
        })
      }
    } catch (e) {
      options.onError?.(e, {phase: 'sync'})
    }
  }

  const throttleSet = throttle((newValue: T) => {
    if (newValue === undefined) {
      try {
        storageAdapter.clear(name)
        options.onClear?.(initialValue)
      } catch (e) {
        options.onError?.(e, {phase: 'clear'})
      }
      if (bc && typeof bc.postMessage === 'function') bc.postMessage({type: 'clear', name})
      logPersist('cleared')
    } else {
      const toStore =
        typeof options.serialize === 'function' ? options.serialize(newValue as any) : (newValue as any)
      let payload: any = {value: toStore}
      if (options.version !== undefined) payload.version = options.version
      payload.timestamp = Date.now()
      // encrypt if provided
      if (typeof options.encrypt === 'function') {
        try {
          const plaintext = JSON.stringify(payload)
          const ciphertext = options.encrypt(plaintext)
          payload = {value: ciphertext, __enc__: true, timestamp: payload.timestamp, version: payload.version}
        } catch (e) {
          options.onError?.(e, {phase: 'encrypt'})
        }
      }
      // size limit check
      if (typeof options.maxSizeKb === 'number' && options.maxSizeKb > 0) {
        try {
          const estimated = JSON.stringify(payload)
          const sizeKb = Math.ceil(estimated.length / 1024)
          if (sizeKb > options.maxSizeKb) {
            // graceful fallback: do not write oversized payload
            options.onError?.(
              new Error('persist payload too large: ' + sizeKb + 'kb > ' + options.maxSizeKb + 'kb'),
              {phase: 'limit'},
            )
            logPersist('limit_exceeded', {sizeKb, maxSizeKb: options.maxSizeKb})
            return
          }
        } catch (e) {
          options.onError?.(e, {phase: 'limit'})
        }
      }
      try {
        storageAdapter.set(name, payload)
        // notify
        try {
          options.onPersist?.(newValue as any)
        } catch (e2) {
          options.onError?.(e2, {phase: 'persist'})
        }
      } catch (e) {
        options.onError?.(e, {phase: 'persist'})
      }
      if (bc && typeof bc.postMessage === 'function') bc.postMessage({type: 'set', name, value: newValue})
      logPersist('set', {value: newValue})
    }
  }, options.throttle ?? 0)

  const baseSet = stateValue.set.bind(stateValue)

  Object.assign(stateValue, {
    set: (v: T) => {
      baseSet(v)
      throttleSet(v)
    },
    clear: () => {
      baseSet(initialValue)
      try {
        storageAdapter.clear(name)
        options.onClear?.(initialValue)
      } catch (e) {
        options.onError?.(e, {phase: 'clear'})
      }
      logPersist('cleared')
    },
    refreshFromStorage: () => {
      if (storageAdapter.isAsync) {
        return applyPersist(stateValue, storageAdapter, options, setFromRestore, name)
      }
      // sync branch mirrors initial sync restore logic
      try {
        const existing = (storageAdapter as any).get(name)
        if (existing === undefined) {
          stateValue.set(initialValue)
          logRestore('missing')
          return
        }
        const raw = existing as any
        if (isExpiredRecord(raw, options.ttlMs)) {
          logRestore('expired', {ttlMs: options.ttlMs})
          options.onExpire?.()
          stateValue.set(initialValue)
          return
        }
        const incomingVersion = raw?.version
        let restored = raw?.value ?? raw
        // decrypt if needed
        if (raw && raw.__enc__ && typeof options.decrypt === 'function') {
          try {
            const plaintext = options.decrypt(restored)
            const parsed = JSON.parse(plaintext)
            restored = parsed?.value ?? parsed
          } catch (e) {
            options.onError?.(e, {phase: 'decrypt'})
            restored = undefined
          }
        }
        if (options.version !== undefined && incomingVersion !== undefined && options.migrations) {
          try {
            for (let v = incomingVersion + 1; v <= options.version; v++) {
              const m = options.migrations[v]
              if (typeof m === 'function') restored = m(restored)
            }
          } catch (e) {
            options.onError?.(e, {phase: 'migrate'})
            logRestore('migrate_error', {error: e})
            restored = undefined
          }
        }
        if (typeof options.deserialize === 'function') {
          try {
            restored = options.deserialize(restored)
          } catch (e) {
            options.onError?.(e, {phase: 'deserialize'})
            logRestore('deserialize_error', {error: e})
            restored = undefined
          }
        }
        if (restored !== undefined && typeof options.validate === 'function') {
          try {
            if (!options.validate(restored)) restored = undefined
          } catch (e) {
            options.onError?.(e, {phase: 'validate'})
            logRestore('validate_error', {error: e})
            restored = undefined
          }
        }
        if (restored === undefined) {
          stateValue.set(initialValue)
        } else {
          const next = options.restoreFn?.(restored) ?? restored
          stateValue.set(next)
          isRestored = true
          restoredOnce = true
          try {
            options.onRestore?.(next)
          } catch (e) {
            options.onError?.(e, {phase: 'restore'})
          }
          logRestore('restored', {value: next})
        }
      } catch (e) {
        options.onError?.(e, {phase: 'restore'})
      }
    },
  })

  // Define dynamic getters for flags
  try {
    Object.defineProperties(stateValue as any, {
      isRestored: {
        get() {
          return isRestored
        },
        enumerable: true,
      },
      restoredOnce: {
        get() {
          return restoredOnce
        },
        enumerable: true,
      },
    })
  } catch {
    // non-fatal
  }
  // For wrapped external state with sync storage, perform an immediate refresh
  // to mirror the initial sync restore logic used for internal state.
  try {
    if (!storageAdapter.isAsync && isStatxFn(value)) {
      ;(stateValue as any).refreshFromStorage()
    }
  } catch {
    // ignore
  }

  return stateValue as unknown as PersistState<T>
}
