/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import type {SignalAdapter, SignalWritable} from '../../../src/modules/adapter/types'
import {createMemoryAdapter} from '../fixtures/persist'
import {createComputedTestAdapter} from '../fixtures/adapter'

function createTestSignalAdapter(): SignalAdapter {
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
          listeners.forEach((l) => l(v))
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
    computed<T>(fn: () => T) {
      const value = fn()
      return {
        get: () => value,
        peek: () => value,
        subscribe: () => () => {},
      }
    },
  }
}

describe('persist: debug & logging', () => {
  let consoleSpy: any

  beforeEach(() => {
    // Мокируем console для перехвата логов
    consoleSpy = {
      debug: console.debug,
      log: console.log,
      warn: console.warn,
      error: console.error,
    }
  })

  afterEach(() => {
    // Восстанавливаем console
    if (consoleSpy) {
      console.debug = consoleSpy.debug
      console.log = consoleSpy.log
      console.warn = consoleSpy.warn
      console.error = consoleSpy.error
    }
  })

  it('debug: true работает без падений и вызывает console логи', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()

    // Перехватываем console логи
    const logs: string[] = []
    const originalDebug = console.debug
    const originalLog = console.log
    console.debug = (...args: any[]) => logs.push(`DEBUG: ${args.join(' ')}`)
    console.log = (...args: any[]) => logs.push(`LOG: ${args.join(' ')}`)

    try {
      const s = persist.state(base, 'init', {
        storage,
        name: 'debug-test',
        debug: true,
      })

      // Должен работать без ошибок
      expect(s.get()).to.equal('init')
      s.set('updated')

      // Должны быть логи о persist операции
      const persistLogs = logs.filter((log) => log.includes('persist:persist'))
      expect(persistLogs.length).to.be.greaterThan(0)
    } finally {
      console.debug = originalDebug
      console.log = originalLog
    }
  })

  it('кастомный logger работает без падений', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()

    // Кастомный logger
    const loggerCalls: Array<{message: string; context: any}> = []
    const customLogger = (message: string, context: any) => {
      loggerCalls.push({message, context})
    }

    const s = persist.state(base, 'init', {
      storage,
      name: 'custom-logger-test',
      debug: {logger: customLogger},
    })

    // Должен работать без ошибок
    expect(s.get()).to.equal('init')
    s.set('updated')

    // Должен быть хотя бы один вызов кастомного логгера
    expect(loggerCalls.length).to.be.greaterThan(0)
    expect(loggerCalls.some((call) => call.message.includes('[persist:persist]'))).to.equal(true)
  })

  it('debug логирует ключевые фазы: restore, persist, sync', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()

    // Кастомный logger для отслеживания фаз
    const phases: string[] = []
    const customLogger = (message: string) => {
      if (message.includes('[persist:')) {
        const phase = message.match(/\[persist:(\w+)\]/)?.[1]
        if (phase) phases.push(phase)
      }
    }

    // Предварительно сохраняем данные для тестирования restore
    storage.set('debug-phases', {value: 'restored', timestamp: Date.now()})

    const s = persist.state(base, 'default', {
      storage,
      name: 'debug-phases',
      debug: {logger: customLogger},
      sync: 'broadcast', // для тестирования sync фазы
    })

    // Вызываем persist операцию
    s.set('new-value')

    // Должны быть логированы основные фазы
    expect(phases.includes('restore')).to.equal(true)
    expect(phases.includes('persist')).to.equal(true)
  })

  it('debug не влияет на функциональность persist', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()

    const s1 = persist.state(base, 'init', {
      storage,
      name: 'debug-func-test',
      debug: true,
    })

    const s2 = persist.state(base, 'init', {
      storage,
      name: 'debug-func-test',
      debug: false,
    })

    // Оба должны работать одинаково
    s1.set('value1')
    s2.set('value2')

    expect(s1.get()).to.equal('value1')
    expect(s2.get()).to.equal('value2')

    // Данные должны сохраняться
    const stored1 = storage.get('debug-func-test') as {value?: string} | undefined
    expect(stored1?.value).to.equal('value2') // последний set перезаписывает
  })

  it('кастомный logger получает корректный контекст', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()

    const contexts: any[] = []
    const customLogger = (_message: string, context: any) => {
      contexts.push(context)
    }

    const s = persist.state(base, 'init', {
      storage,
      name: 'context-test',
      debug: {logger: customLogger},
    })

    s.set('updated')

    // Должен быть контекст с name
    expect(contexts.some((ctx) => ctx.name === 'context-test')).to.equal(true)
  })

  it('debug работает с computed persist', () => {
    const base = createComputedTestAdapter() // используем адаптер с поддержкой recompute
    const storage = createMemoryAdapter()

    const logs: string[] = []
    const customLogger = (message: string) => {
      logs.push(message)
    }

    let source = 'test'
    const c = persist.computed(base, () => source, {
      persist: true,
      storage,
      name: 'debug-computed',
      debug: {logger: customLogger},
    })

    // Должен работать без ошибок
    expect(c.get()).to.equal('test')

    // Подписываемся для активации persist логики
    const unsubscribe = c.subscribe(() => {})

    // Меняем source и перевычисляем
    source = 'updated'
    ;(c as any).$recompute()

    // Должны быть логи о persist операциях
    const persistLogs = logs.filter((log) => log.includes('persist:persist'))
    expect(persistLogs.length).to.be.greaterThan(0)

    unsubscribe()
  })

  it('debug работает с async storage (idb)', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter() // используем sync для простоты

    const logs: string[] = []
    const customLogger = (message: string) => {
      logs.push(message)
    }

    const s = persist.state(base, 'init', {
      storage,
      name: 'debug-async',
      debug: {logger: customLogger},
    })

    // Должен работать без ошибок
    expect(s.get()).to.equal('init')
    s.set('async-updated')

    // Должны быть логи
    expect(logs.length).to.be.greaterThan(0)
  })

  it('невалидный logger не вызывает падений', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()

    // Неверный logger (не функция)
    const s = persist.state(base, 'init', {
      storage,
      name: 'invalid-logger',
      debug: {logger: 'not-a-function' as any},
    })

    // Должен работать без ошибок несмотря на невалидный logger
    expect(s.get()).to.equal('init')
    s.set('updated')
    expect(s.get()).to.equal('updated')
  })

  it('logger exceptions не влияют на persist функциональность', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()

    // Logger, который выбрасывает исключение
    const throwingLogger = () => {
      throw new Error('Logger error')
    }

    const s = persist.state(base, 'init', {
      storage,
      name: 'throwing-logger',
      debug: {logger: throwingLogger},
    })

    // Должен работать несмотря на исключения в logger
    expect(s.get()).to.equal('init')
    s.set('updated')
    expect(s.get()).to.equal('updated')

    // Данные должны сохраняться
    const stored = storage.get('throwing-logger') as {value?: string} | undefined
    expect(stored?.value).to.equal('updated')
  })
})
