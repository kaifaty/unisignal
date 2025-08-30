import type {SignalAdapter, SignalWritable} from '../adapter/types'
import type {PersistAdapter} from '../persist/types'
import type {QueryKey, QueryStatus} from './types'

export function getKeyHash(key: QueryKey): string {
  // Stable JSON stringify for array-like keys
  return JSON.stringify(key)
}

export type QueryClientOptions = {
  persistNamespace?: string | ((name: string) => string)
  persistStorage?: 'local' | 'session' | 'idb' | PersistAdapter
}

export class QueryClient {
  public readonly adapter: SignalAdapter
  public readonly persistNamespace?: string | ((name: string) => string)
  public readonly persistStorage?: 'local' | 'session' | 'idb' | PersistAdapter
  private readonly cache: Map<string, QueryCacheRecord>
  private readonly listeners: Map<string, Set<() => void>>

  constructor(adapter: SignalAdapter, options: QueryClientOptions = {}) {
    this.adapter = adapter
    this.persistNamespace = options.persistNamespace
    this.persistStorage = options.persistStorage
    this.cache = new Map()
    this.listeners = new Map()
  }

  getOrCreateRecord<TData = unknown, TError = unknown>(key: QueryKey): QueryCacheRecord<TData, TError> {
    const hash = getKeyHash(key)
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
    const hash = getKeyHash(key)
    if (!this.listeners.has(hash)) this.listeners.set(hash, new Set())
    const set = this.listeners.get(hash)!
    set.add(listener)
    return () => {
      set.delete(listener)
      if (set.size === 0) this.listeners.delete(hash)
    }
  }

  notify(key: QueryKey): void {
    const hash = getKeyHash(key)
    const set = this.listeners.get(hash)
    if (!set) return
    set.forEach((fn) => fn())
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
    const hash = getKeyHash(key)
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
