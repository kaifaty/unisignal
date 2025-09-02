// Общие утилиты для всех тестов

// Утилита для генерации уникальных идентификаторов в тестах
export function generateUniqueId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Утилита для глубокого сравнения объектов
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const objA = a as Record<string, unknown>
    const objB = b as Record<string, unknown>
    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)
    if (keysA.length !== keysB.length) return false
    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!deepEqual(objA[key], objB[key])) return false
    }
    return true
  }
  return false
}

// Утилита для создания таймера с автоматической очисткой
export class TestTimer {
  private timeoutId?: NodeJS.Timeout

  constructor(
    private callback: () => void,
    delay: number,
  ) {
    this.timeoutId = setTimeout(() => {
      this.callback()
    }, delay)
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }
  }
}

// Утилита для создания счетчика вызовов
export class CallCounter {
  private count = 0

  get value(): number {
    return this.count
  }

  increment(): void {
    this.count++
  }

  reset(): void {
    this.count = 0
  }

  get next(): number {
    return ++this.count
  }
}

// Утилита для создания mock функций
export function createMockFunction<T extends (...args: unknown[]) => unknown>(): {
  mock: T
  calls: Parameters<T>[]
  reset: () => void
} {
  const calls: Parameters<T>[] = []

  const mock = ((...args: Parameters<T>) => {
    calls.push(args)
  }) as T

  return {
    mock,
    calls,
    reset: () => (calls.length = 0),
  }
}

// Утилита для ожидания выполнения условий
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 1000,
  interval: number = 10,
): Promise<void> {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition not met within timeout')
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}

// Утилита для создания последовательности значений
export function* sequenceGenerator<T>(values: T[]): Generator<T, void, unknown> {
  let index = 0
  while (true) {
    yield values[index % values.length]
    index++
  }
}

// Утилита для очистки globalThis после тестов
export function cleanupGlobalThis(...properties: string[]): void {
  for (const prop of properties) {
    delete (globalThis as Record<string, unknown>)[prop]
  }
}
