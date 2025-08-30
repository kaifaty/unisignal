import type {SignalAdapter, SignalReadable, SignalWritable, ComputedOptions} from './types'

// Минимальные сигнатуры API из @preact/signals-core, чтобы избежать жёсткой зависимости
type PreactSignalApi = {
  signal: <T>(initial: T) => {
    value: T
    peek?: () => T
  }
  computed: <T>(fn: () => T) => {
    value: T
    peek?: () => T
  }
  effect: (fn: () => void) => unknown
}

function toDisposer(ret: unknown): () => void {
  if (typeof ret === 'function') return ret as () => void
  const obj = ret as {dispose?: () => void} | null | undefined
  return obj && typeof obj.dispose === 'function' ? obj.dispose.bind(obj) : () => {}
}

function wrapReadable<T>(
  s: {value: T; peek?: () => T},
  effect: (fn: () => void) => unknown,
): SignalReadable<T> {
  return {
    get(): T {
      return s.value
    },
    peek(): T {
      return typeof s.peek === 'function' ? s.peek()! : s.value
    },
    subscribe(listener: (value: T) => void): () => void {
      const ret = effect(() => {
        void s.value
        listener(s.value)
      })
      return toDisposer(ret)
    },
  }
}

function wrapWritable<T>(
  s: {value: T; peek?: () => T},
  effect: (fn: () => void) => unknown,
): SignalWritable<T> {
  const readable = wrapReadable(s, effect)
  return {
    ...readable,
    set(value: T): void {
      s.value = value
    },
  }
}

export const createPreactSignalsAdapter = (api: PreactSignalApi): SignalAdapter => {
  return {
    state<T>(initial: T): SignalWritable<T> {
      const s = api.signal<T>(initial)
      return wrapWritable<T>(s, api.effect)
    },
    computed<T>(fn: () => T, _options?: ComputedOptions): SignalReadable<T> {
      const c = api.computed<T>(fn)
      return wrapReadable<T>(c, api.effect)
    },
  }
}
