import type {SignalAdapter, SignalWritable, SignalComputed} from '../../../src/modules/adapter/types'

// Общий адаптер сигналов для большинства тестов
export function createTestSignalAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      const listeners = new Set<(v: T) => void>()
      return {
        get(): T {
          return value
        },
        set(v: T): void {
          value = v
          for (const l of listeners) l(v)
        },
        peek(): T {
          return value
        },
        subscribe(listener: (v: T) => void): () => void {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    },
    computed<T>(_fn: () => T) {
      throw new Error('not needed in tests')
    },
  }
}

// Упрощенный адаптер для случаев, когда не нужны подписки
export function createSimpleSignalAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      return {
        get: () => value,
        set: (v: T) => (value = v),
        peek: () => value,
        subscribe: () => () => {},
      }
    },
    computed<T>(_fn: () => T) {
      throw new Error('not needed in tests')
    },
  }
}

// Базовый адаптер сигналов: writable с подписками, computed — константное значение,
// подходит для большинства тестов (query, persist и т.д.)
export function createBasicAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      const listeners = new Set<(v: T) => void>()
      return {
        get: () => value,
        peek: () => value,
        set: (v: T) => {
          value = v
          listeners.forEach((l) => l(v))
        },
        subscribe: (l: (v: T) => void) => {
          listeners.add(l)
          return () => listeners.delete(l)
        },
      }
    },
    computed<T>(fn: () => T): SignalComputed<T> {
      const value = fn()
      return {
        get: () => value,
        peek: () => value,
        subscribe: () => () => {},
      }
    },
  }
}

// Реактивный адаптер, где computed не используется (бросает исключение),
// полезен для тестов, где важно поведение writable/subscribe.
export function createReactiveSignalAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      const listeners = new Set<(v: T) => void>()
      return {
        get: () => value,
        peek: () => value,
        set: (v: T) => {
          value = v
          listeners.forEach((l) => l(v))
        },
        subscribe: (l: (v: T) => void) => {
          listeners.add(l)
          return () => listeners.delete(l)
        },
      }
    },
    computed<T>(_fn: () => T): SignalComputed<T> {
      throw new Error('not needed in these tests')
    },
  }
}

// Адаптер для тестов computed: даёт возможность вручную инициировать перерасчёт
// через скрытый метод $recompute на возвращаемом объекте.
type RecomputableComputed<T> = SignalComputed<T> & {$recompute(): void}

export function createComputedTestAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      const listeners = new Set<(v: T) => void>()
      return {
        get: () => value,
        peek: () => value,
        set: (v: T) => {
          value = v
          listeners.forEach((l) => l(v))
        },
        subscribe: (l: (v: T) => void) => {
          listeners.add(l)
          return () => listeners.delete(l)
        },
      }
    },
    computed<T>(fn: () => T): SignalComputed<T> {
      let value = fn()
      const listeners = new Set<(v: T) => void>()
      const recomputable: RecomputableComputed<T> = {
        get: () => value,
        peek: () => value,
        subscribe: (l: (v: T) => void) => {
          listeners.add(l)
          l(value)
          return () => listeners.delete(l)
        },
        $recompute: () => {
          value = fn()
          listeners.forEach((l: (v: T) => void) => l(value))
        },
      }
      return recomputable
    },
  }
}
