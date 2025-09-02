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

  const fakeHistory: FakeHistory = {
    pushState: (_state: unknown, _title: string, url: string) => {
      historyRecords.push(['push', url])
      fakeLocation.pathname = String(url).split('?')[0]
    },
    replaceState: (_state: unknown, _title: string, url: string) => {
      historyRecords.push(['replace', url])
      fakeLocation.pathname = String(url).split('?')[0]
    },
    go: () => {},
    back: () => {},
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
    ;(url as any).constructor.configureEnv(null)
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
