import type {SignalWritable} from '../adapter/types'
import type {MutationOptions, MutationResult, QueryStatus} from './types'
import type {QueryClient} from './client'

export function createMutation<TData = unknown, TError = unknown, TVariables = unknown>(
  client: QueryClient,
  options: MutationOptions<TData, TError, TVariables>,
): MutationResult<TData, TError, TVariables> {
  const {state} = client.adapter

  const status: SignalWritable<QueryStatus> = state<QueryStatus>('idle')
  const data: SignalWritable<TData | undefined> = state<TData | undefined>(undefined)
  const error: SignalWritable<TError | undefined> = state<TError | undefined>(undefined)

  async function mutate(variables: TVariables): Promise<TData> {
    status.set('loading')
    try {
      const result = await options.mutationFn(variables)
      data.set(result)
      error.set(undefined)
      status.set('success')
      if (options.onSuccess) options.onSuccess(result, variables)
      // Invalidate keys later via client.invalidate
      return result
    } catch (err) {
      const casted = err as TError
      error.set(casted)
      status.set('error')
      if (options.onError) options.onError(casted, variables)
      throw casted
    }
  }

  function reset(): void {
    status.set('idle')
    data.set(undefined)
    error.set(undefined)
  }

  return {
    status,
    data,
    error,
    mutate,
    reset,
  }
}
