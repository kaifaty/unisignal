import type {SignalReadable} from '../adapter/types'
import type {PersistAdapter, PersistStateOptions} from '../persist/types'

export type PersistDataOptions<T> =
  | false
  | true
  | ({
      name?: string
      storage?: 'local' | 'session' | 'idb' | PersistAdapter
    } & Pick<
      PersistStateOptions<T>,
      | 'namespace'
      | 'version'
      | 'migrations'
      | 'ttlMs'
      | 'serialize'
      | 'deserialize'
      | 'validate'
      | 'encrypt'
      | 'decrypt'
      | 'maxSizeKb'
      | 'debug'
    >)

export type QueryKey = readonly unknown[]

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error'

export type RetryOptions<TError = unknown> =
  | number
  | {
      count: number
      delay?: (attempt: number, error: TError) => number
      predicate?: (error: TError) => boolean
    }

export interface QueryOptions<TData = unknown, TError = unknown, TSelected = TData> {
  key: QueryKey
  queryFn: () => Promise<TData>
  staleTime?: number
  gcTime?: number
  refetchOnMount?: boolean
  enabled?: boolean
  initialData?: TData | (() => TData)
  persist?: PersistDataOptions<TData>
  select?: (data: TData) => TSelected
  keepPreviousData?: boolean
  retry?: RetryOptions<TError>
}

export interface QueryResult<TData = unknown, TError = unknown, TSelected = TData> {
  key: QueryKey
  status: SignalReadable<QueryStatus>
  data: SignalReadable<TData | undefined>
  error: SignalReadable<TError | undefined>
  selected?: SignalReadable<TSelected | undefined>
  refetch: () => Promise<void>
  dispose: () => void
}

export interface MutationOptions<TData = unknown, TError = unknown, TVariables = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: TError, variables: TVariables) => void
  invalidateKeys?: QueryKey[]
}

export interface MutationResult<TData = unknown, TError = unknown, TVariables = unknown> {
  status: SignalReadable<QueryStatus>
  data: SignalReadable<TData | undefined>
  error: SignalReadable<TError | undefined>
  mutate: (variables: TVariables) => Promise<TData>
  reset: () => void
}
