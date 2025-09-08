/* eslint-disable @typescript-eslint/no-explicit-any */
import {Router} from '../../../src/modules/router/router'
import {configure as configureUrl, url} from '../../../src/modules/url'
import {createTestSignalAdapter} from './adapter'

// Типы для фейкового environment
export interface FakeHistory {
  pushState: (state: unknown, title: string, url: string) => void
  replaceState: (state: unknown, title: string, url: string) => void
  go: () => void
  back: () => void
}

export interface FakeLocation {
  pathname: string
  hash: string
  origin: string
  protocol: string
}

export interface RouterTestEnv {
  adapter: ReturnType<typeof createTestSignalAdapter>
  fakeLocation: FakeLocation
  fakeHistory: FakeHistory
  historyRecords: Array<[string, string]>
  cleanup: () => void
}

// Фикстура для создания router с фейковым environment
export function createRouterTestEnv(options?: {
  base?: string
  withUrl?: boolean
  initialPath?: string
  historyMax?: number | false
}): RouterTestEnv {
  const adapter = createTestSignalAdapter()
  const historyRecords: Array<[string, string]> = []
  // Примитивный стек history для эмуляции back()/go()
  const historyStack: string[] = []
  let historyIndex = -1

  Router.configure(adapter, {
    withUrl: options?.withUrl ?? true,
    base: options?.base ?? '/',
    historyMax: options?.historyMax
  })
  configureUrl(adapter)

  const fakeLocation: FakeLocation = {
    pathname: options?.initialPath ?? '/',
    hash: '',
    origin: 'http://test',
    protocol: 'http:',
  }
  // Инициализируем стек текущим путём
  historyStack.push(fakeLocation.pathname)
  historyIndex = 0

  const fakeHistory: FakeHistory = {
    pushState: (_state: unknown, _title: string, url: string) => {
      historyRecords.push(['push', url])
      // Отбрасываем forward-ветку при новом push
      if (historyIndex < historyStack.length - 1) {
        historyStack.splice(historyIndex + 1)
      }
      historyStack.push(String(url))
      historyIndex = historyStack.length - 1
      fakeLocation.pathname = String(url).split('?')[0]
    },
    replaceState: (_state: unknown, _title: string, url: string) => {
      historyRecords.push(['replace', url])
      if (historyIndex >= 0 && historyIndex < historyStack.length) {
        historyStack[historyIndex] = String(url)
      } else {
        historyStack.push(String(url))
        historyIndex = historyStack.length - 1
      }
      fakeLocation.pathname = String(url).split('?')[0]
    },
    go: (delta: number = 0) => {
      const win: any = (globalThis as any).window
      if (typeof delta !== 'number' || delta === 0) return
      const nextIndex = Math.max(0, Math.min(historyStack.length - 1, historyIndex + delta))
      if (nextIndex === historyIndex) return
      historyIndex = nextIndex
      const nextUrl = historyStack[historyIndex]
      fakeLocation.pathname = String(nextUrl).split('?')[0]
      try {
        win?.dispatchEvent?.(new (win as any).PopStateEvent('popstate', {state: null}))
      } catch {
        // fallback без состояния
        win?.dispatchEvent?.(new (win as any).Event('popstate'))
      }
    },
    back: () => {
      const win: any = (globalThis as any).window
      if (historyIndex <= 0) return
      historyIndex -= 1
      const nextUrl = historyStack[historyIndex]
      fakeLocation.pathname = String(nextUrl).split('?')[0]
      try {
        win?.dispatchEvent?.(new (win as any).PopStateEvent('popstate', {state: null}))
      } catch {
        win?.dispatchEvent?.(new (win as any).Event('popstate'))
      }
    },
  }

  // Настройка фейкового environment
  ;(url as any).constructor.configureEnv({
    get window() {
      return (globalThis as any).window
    },
    get location() {
      return fakeLocation as any
    },
    get history() {
      return fakeHistory as any
    },
  })

  // Функция очистки
  const cleanup = () => {
    Router.stop()
    // Сбрасываем env к дефолтным геттерам
    ;(url as any).constructor.configureEnv({
      get window() {
        return (globalThis as any).window
      },
      get location() {
        return ((globalThis as any).window as any)?.location
      },
      get history() {
        return ((globalThis as any).window as any)?.history
      },
    })
  }

  return {
    adapter,
    fakeLocation,
    fakeHistory,
    historyRecords,
    cleanup,
  }
}

// Утилита для создания DOM контейнера для router
export function createRouterContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

// Утилита для очистки DOM контейнера
export function cleanupRouterContainer(container: HTMLElement): void {
  if (container.parentNode) {
    container.parentNode.removeChild(container)
  }
}

// Утилита для ожидания навигации
export async function waitForNavigation(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}
