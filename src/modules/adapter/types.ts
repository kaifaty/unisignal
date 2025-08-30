export interface SignalReadable<T> {
  get(): T
  subscribe(listener: (value: T) => void, subscriberName?: string): () => void
  peek(): T
}

export interface SignalWritable<T> extends SignalReadable<T> {
  set(value: T): void
}

export type SignalComputed<T> = SignalReadable<T>

export type ComputedOptions = {name?: string}

export interface SignalAdapter {
  state<T>(initial: T): SignalWritable<T>
  computed<T>(fn: () => T, options?: ComputedOptions): SignalComputed<T>
}

export interface CallableWritable<T> {
  (): T
  get(): T
  peek(): T
  set(value: T): void
  subscribe(listener: (value: T) => void, subscriberName?: string): () => void
}
