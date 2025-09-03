import type {SignalAdapter, SignalWritable} from '../adapter/types'
import type {PersistAdapter} from '../persist/types'
import type {QueryKey, QueryStatus, RetryOptions} from './types'
import {delay} from '../utils/delay'

export function getKeyHash(key: QueryKey): string {
  // Stable JSON stringify for array-like keys
  return JSON.stringify(key)
}

export type QueryClientOptions = {
  persistNamespace?: string | ((name: string) => string)
  persistStorage?: 'local' | 'session' | 'idb' | PersistAdapter
  refetchOnFocus?: boolean
  refetchOnReconnect?: boolean
  keySerializer?: (key: QueryKey) => string
  defaults?: {
    staleTime?: number
    retry?: RetryOptions
  }
}

export class QueryClient {
  public readonly adapter: SignalAdapter
  public readonly persistNamespace?: string | ((name: string) => string)
  public readonly persistStorage?: 'local' | 'session' | 'idb' | PersistAdapter
  private readonly refetchOnFocus: boolean
  private readonly refetchOnReconnect: boolean
  private readonly cache: Map<string, QueryCacheRecord>
  private readonly listeners: Map<string, Set<() => void>>
  private readonly keySerializer?: (key: QueryKey) => string
  public readonly defaults: {staleTime?: number; retry?: RetryOptions}
  private readonly cleanupFns: Array<() => void>

  constructor(adapter: SignalAdapter, options: QueryClientOptions = {}) {
    this.adapter = adapter
    this.persistNamespace = options.persistNamespace
    this.persistStorage = options.persistStorage
    this.refetchOnFocus = options.refetchOnFocus === true
    this.refetchOnReconnect = options.refetchOnReconnect === true
    this.keySerializer = options.keySerializer
    this.defaults = options.defaults ?? {}
    this.cache = new Map()
    this.listeners = new Map()
    this.cleanupFns = []

    // Setup environment listeners (SSR-safe)
    try {
      // @ts-ignore
      const g = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined
      const w: Window | undefined = g?.window
      const d: Document | undefined = g?.document
      if (w && typeof w.addEventListener === 'function') {
        if (this.refetchOnReconnect) {
          const onlineHandler = () => this.notifyAll()
          w.addEventListener('online', onlineHandler)
          this.cleanupFns.push(() => w.removeEventListener('online', onlineHandler))
        }
        if (this.refetchOnFocus) {
          const focusHandler = () => this.notifyAll()
          w.addEventListener('focus', focusHandler)
          this.cleanupFns.push(() => w.removeEventListener('focus', focusHandler))
          if (d && typeof d.addEventListener === 'function') {
            const visHandler = () => {
              try {
                // @ts-ignore
                const state = d.visibilityState
                if (state === 'visible') this.notifyAll()
              } catch {
                this.notifyAll()
              }
            }
            d.addEventListener('visibilitychange', visHandler)
            this.cleanupFns.push(() => d.removeEventListener('visibilitychange', visHandler))
          }
        }
      }
    } catch {
      // ignore
    }
  }

  getOrCreateRecord<TData = unknown, TError = unknown>(key: QueryKey): QueryCacheRecord<TData, TError> {
    const hash = this.serializeKey(key)
    const existing = this.cache.get(hash) as QueryCacheRecord<TData, TError> | undefined
    if (existing) return existing
    const record: QueryCacheRecord<TData, TError> = {
      key,
      status: this.adapter.state<QueryStatus>('idle'),
      data: this.adapter.state<TData | undefined>(undefined),
      error: this.adapter.state<TError | undefined>(undefined),
      promise: undefined,
      updatedAt: undefined,
      refCount: 0,
      gcTimer: undefined,
    }
    this.cache.set(hash, record)
    return record
  }

  subscribe(key: QueryKey, listener: () => void): () => void {
    const hash = this.serializeKey(key)
    if (!this.listeners.has(hash)) this.listeners.set(hash, new Set())
    const set = this.listeners.get(hash)!
    set.add(listener)
    return () => {
      set.delete(listener)
      if (set.size === 0) this.listeners.delete(hash)
    }
  }

  notify(key: QueryKey): void {
    const hash = this.serializeKey(key)
    const set = this.listeners.get(hash)
    if (!set) return
    set.forEach((fn) => fn())
  }

  notifyAll(): void {
    for (const record of this.cache.values()) {
      this.notify(record.key)
    }
  }

  invalidate(key: QueryKey): void {
    // mark stale and notify
    const record = this.getOrCreateRecord(key)
    record.updatedAt = undefined
    this.notify(key)
  }

  retain(key: QueryKey): void {
    const record = this.getOrCreateRecord(key)
    record.refCount++
    if (record.gcTimer) {
      clearTimeout(record.gcTimer)
      record.gcTimer = undefined
    }
  }

  release(key: QueryKey, gcTimeMs?: number): void {
    const hash = this.serializeKey(key)
    const record = this.cache.get(hash)
    if (!record) return
    record.refCount = Math.max(0, record.refCount - 1)
    if (record.refCount > 0) return
    const doDelete = () => {
      // double-check no new retain happened
      const latest = this.cache.get(hash)
      if (!latest || latest.refCount > 0) return
      this.cache.delete(hash)
      this.listeners.delete(hash)
    }
    if (gcTimeMs && gcTimeMs > 0) {
      record.gcTimer = setTimeout(doDelete, gcTimeMs) as unknown as number
    } else {
      doDelete()
    }
  }

  __getCacheSizeForTests(): number {
    return this.cache.size
  }

  invalidateQueries(matcher: QueryKey | ((key: QueryKey) => boolean)): void {
    const isFn = typeof matcher === 'function'
    for (const rec of this.cache.values()) {
      if (
        isFn
          ? (matcher as (k: QueryKey) => boolean)(rec.key)
          : this.serializeKey(rec.key) === this.serializeKey(matcher as QueryKey)
      ) {
        this.invalidate(rec.key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
    this.listeners.clear()
  }

  inspect(): {size: number; keys: string[]} {
    const keys: string[] = []
    for (const rec of this.cache.values()) keys.push(this.serializeKey(rec.key))
    return {size: this.cache.size, keys}
  }

  async stop(): Promise<void> {
    try {
      for (const fn of this.cleanupFns.splice(0)) {
        try {
          fn()
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    // best-effort: wait briefly for in-flight queries to settle and clear timers
    try {
      const waits: Promise<unknown>[] = []
      for (const rec of this.cache.values()) {
        if (rec.gcTimer) {
          clearTimeout(rec.gcTimer)
          rec.gcTimer = undefined
        }
        if (rec.promise) waits.push(rec.promise.catch(() => {}))
      }
      if (waits.length) {
        await Promise.race([Promise.all(waits), delay(20)])
      }
    } catch {
      // ignore
    }
  }

  private serializeKey(key: QueryKey): string {
    return this.keySerializer ? this.keySerializer(key) : getKeyHash(key)
  }
}

export interface QueryCacheRecord<TData = unknown, TError = unknown> {
  key: QueryKey
  status: SignalWritable<QueryStatus>
  data: SignalWritable<TData | undefined>
  error: SignalWritable<TError | undefined>
  promise?: Promise<void>
  updatedAt?: number
  refCount: number
  gcTimer?: number
}
