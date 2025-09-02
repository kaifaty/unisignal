import {QueryClient} from '../../../src/modules/query'
import {createBasicAdapter, createTestSignalAdapter} from './adapter'

// Фикстура для создания QueryClient с базовой конфигурацией
export function createTestQueryClient() {
  return new QueryClient(createTestSignalAdapter())
}

// Фикстура для создания QueryClient с расширенной конфигурацией
export function createAdvancedQueryClient(options?: {
  persistStorage?: unknown
  persistNamespace?: string
  defaults?: unknown
  keySerializer?: (key: unknown[]) => string
}) {
  const adapter = createBasicAdapter()
  return new QueryClient(adapter, {
    persistStorage: options?.persistStorage,
    persistNamespace: options?.persistNamespace,
    defaults: options?.defaults,
    keySerializer: options?.keySerializer,
  })
}

// Утилита для создания простого query с базовой конфигурацией
export function createTestQuery(client: QueryClient, key: unknown[], queryFn: () => unknown) {
  return client.createQuery({
    key,
    queryFn,
    refetchOnMount: false,
  })
}

// Утилита для создания mutation с базовой конфигурацией
export function createTestMutation(client: QueryClient, mutationFn: (variables: unknown) => unknown) {
  return client.createMutation({
    mutationFn,
  })
}

// Утилита для ожидания завершения асинхронных операций
export function waitFor(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Утилита для очистки клиента после теста
export async function cleanupQueryClient(client: QueryClient) {
  await client.clear()
  await (client as {stop?: () => Promise<void>}).stop?.()
}
