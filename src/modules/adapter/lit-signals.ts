import type {SignalAdapter, SignalReadable, SignalWritable, ComputedOptions} from './types'

// Минимальные сигнатуры API из @lit-labs/signals
type LitSignal<T> = {
  get(): T
  set(value: T): void
  peek?: () => T
}

type LitComputed<T> = {
  get(): T
  peek?: () => T
}

type LitSignalsApi = {
  signal: <T>(initial: T) => LitSignal<T>
  computed: <T>(fn: () => T) => LitComputed<T>
  effect: (fn: () => void) => unknown
}

function wrapReadable<T>(
  s: {get(): T; peek?: () => T},
  effect: (fn: () => void) => unknown,
): SignalReadable<T> {
  function toDisposer(ret: unknown): () => void {
    if (typeof ret === 'function') return ret as () => void
    const obj = ret as {dispose?: () => void} | null | undefined
    return obj && typeof obj.dispose === 'function' ? obj.dispose.bind(obj) : () => {}
  }
  return {
    get(): T {
      return s.get()
    },
    peek(): T {
      return typeof s.peek === 'function' ? s.peek()! : s.get()
    },
    subscribe(listener: (value: T) => void): () => void {
      const ret = effect(() => {
        void s.get()
        listener(s.get())
      })
      return toDisposer(ret)
    },
  }
}

function wrapWritable<T>(
  s: {get(): T; set(value: T): void; peek?: () => T},
  effect: (fn: () => void) => unknown,
): SignalWritable<T> {
  const readable = wrapReadable<T>(s, effect)
  return {
    ...readable,
    set(value: T): void {
      s.set(value)
    },
  }
}

export const createLitSignalsAdapter = (api: LitSignalsApi): SignalAdapter => {
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
