import type {SignalWritable, SignalReadable} from '../adapter/types'
import {persist} from '../persist'
import type {QueryOptions, QueryResult, QueryStatus} from './types'
import type {QueryClient} from './client'
import type {PersistAdapter} from '../persist/types'

export function createQuery<TData = unknown, TError = unknown, TSelected = TData>(
  client: QueryClient,
  options: QueryOptions<TData, TError, TSelected>,
): QueryResult<TData, TError, TSelected> {
  const {state} = client.adapter

  const status: SignalWritable<QueryStatus> = state<QueryStatus>('idle')
  const initialDataValue = (
    typeof options.initialData === 'function' ? (options.initialData as () => TData)() : options.initialData
  ) as TData | undefined
  let data: SignalWritable<TData | undefined>
  if (options.persist) {
    const isTrue = options.persist === true
    const baseName = isTrue ? `q:${JSON.stringify(options.key)}` : (options.persist as {name?: string}).name
    type PersistConfig = Exclude<typeof options.persist, boolean>
    const baseOptions: Partial<PersistConfig> = isTrue ? {} : (options.persist as PersistConfig)
    const ttlMs =
      typeof baseOptions.ttlMs === 'number'
        ? baseOptions.ttlMs
        : typeof options.staleTime === 'number' && options.staleTime > 0
        ? options.staleTime
        : undefined
    const ns =
      (baseOptions as {namespace?: unknown}).namespace ??
      (typeof client.persistNamespace === 'function'
        ? client.persistNamespace(baseName as string)
        : (client.persistNamespace ?? '') + (baseName as string))
    const name = typeof ns === 'string' ? ns : (baseName as string)
    const storage = (baseOptions as {storage?: unknown}).storage ?? client.persistStorage
    const rest: Record<string, unknown> = (() => {
      const {storage: _s, name: _n, ...r} = (baseOptions as Record<string, unknown>) || {}
      return r
    })()
    data = persist.state<TData | undefined>(client.adapter, initialDataValue, {
      name,
      storage: storage as PersistAdapter | 'local' | 'session' | 'idb' | undefined,
      ttlMs,
      ...rest,
    }) as unknown as SignalWritable<TData | undefined>
  } else {
    data = state<TData | undefined>(initialDataValue)
  }
  const error: SignalWritable<TError | undefined> = state<TError | undefined>(undefined)

  async function run(): Promise<void> {
    const record = client.getOrCreateRecord<TData, TError>(options.key)

    // fast path: if not stale and we have data, skip fetch
    if (
      typeof options.staleTime === 'number' &&
      record.updatedAt !== undefined &&
      Date.now() - record.updatedAt <= options.staleTime &&
      record.data.get() !== undefined
    ) {
      status.set(record.status.get())
      data.set(record.data.get())
      error.set(record.error.get())
      return
    }

    if (record.promise) {
      await record.promise
      // sync local from cache
      status.set(record.status.get())
      data.set(record.data.get())
      error.set(record.error.get())
      return
    }

    const execution = (async () => {
      record.status.set('loading')
      client.notify(options.key)
      try {
        const result = await options.queryFn()
        record.data.set(result)
        record.error.set(undefined)
        record.status.set('success')
        record.updatedAt = Date.now()
      } catch (err) {
        record.error.set(err as TError)
        record.status.set('error')
      } finally {
        record.promise = undefined
        client.notify(options.key)
      }
    })()

    record.promise = execution

    // reflect status only; keepPreviousData avoids clearing data on loading
    status.set(record.status.get())
    if (!options.keepPreviousData) {
      // do not touch data/error; allow persisted/previous to remain visible
    }

    await execution
    status.set(record.status.get())
    data.set(record.data.get())
    error.set(record.error.get())
  }

  const enabled = options.enabled !== false
  if (enabled && options.refetchOnMount) void run()

  // subscribe to invalidations and refetch if stale policy requires
  let unsubscribe: (() => void) | undefined
  if (enabled && options.staleTime !== undefined) {
    unsubscribe = client.subscribe(options.key, () => {
      const record = client.getOrCreateRecord<TData, TError>(options.key)
      const isStale =
        record.updatedAt === undefined || Date.now() - record.updatedAt > (options.staleTime ?? 0)
      if (isStale && record.status.get() !== 'loading') void run()
    })
  }

  // no additional wrapping needed

  // retain record while query instance is alive
  client.retain(options.key)

  const dispose = () => {
    unsubscribe?.()
    client.release(options.key, options.gcTime)
  }

  let selectedComputed: SignalReadable<TSelected | undefined> | undefined
  if (typeof options.select === 'function') {
    const selector = options.select as (d: TData) => TSelected
    selectedComputed = client.adapter.computed<TSelected | undefined>(() => {
      const v = data.get()
      return v === undefined ? undefined : selector(v)
    })
  }

  const result: QueryResult<TData, TError, TSelected> = {
    key: options.key,
    status,
    data,
    error,
    selected: selectedComputed,
    refetch: run,
    dispose,
  }

  return result
}
